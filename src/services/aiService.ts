import OpenAI from 'openai';
import type { Question, Candidate } from '../types';

// Initialize OpenAI with proper error handling
let openai: OpenAI | null = null;
let apiQuotaExceeded = false; // Reset quota status for new API key
let lastQuotaCheck = 0;

// Debug environment variables
console.log('=== OpenAI Configuration Debug ===');
console.log('All environment variables:', import.meta.env);
console.log('VITE_OPENAI_API_KEY:', import.meta.env.VITE_OPENAI_API_KEY);
console.log('API Key type:', typeof import.meta.env.VITE_OPENAI_API_KEY);
console.log('API Key length:', import.meta.env.VITE_OPENAI_API_KEY?.length);

try {
  // Try environment variable first
  let apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  // If not found, use hardcoded key for testing
  if (!apiKey || apiKey === 'undefined' || apiKey.trim() === '') {
    console.log('Environment variable not found, using hardcoded key for testing');
    apiKey = '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';
  }
  
  console.log('API Key check:', apiKey ? 'Present' : 'Missing');
  console.log('API Key starts with sk-:', apiKey?.startsWith('sk-'));
  
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_openai_api_key_here' && apiKey.startsWith('sk-')) {
    openai = new OpenAI({
      apiKey: apiKey.trim(),
      dangerouslyAllowBrowser: true, // Required for browser environment
    });
    console.log('✅ OpenAI client initialized successfully');
  } else {
    console.warn('❌ OpenAI API key not configured or invalid. AI features will use fallback methods.');
    console.log('Current API key value:', apiKey);
    console.log('API key validation failed - reasons:');
    console.log('- Is empty:', !apiKey);
    console.log('- Is placeholder:', apiKey === 'your_openai_api_key_here');
    console.log('- Does not start with sk-:', !apiKey?.startsWith('sk-'));
  }
} catch (error) {
  console.warn('Failed to initialize OpenAI client:', error);
}

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Question validation helper
const validateQuestions = (questions: any[]): Question[] => {
  return questions.map((q: any, index: number) => ({
    id: q.id || `q${index + 1}`,
    text: q.text || 'Question text missing',
    difficulty: q.difficulty || (index < 2 ? 'easy' : index < 4 ? 'medium' : 'hard'),
    timeLimit: q.timeLimit || (index < 2 ? 50 : index < 4 ? 90 : 150), // Updated time limits: Easy=50s, Medium=90s, Hard=150s
    category: q.category || 'General'
  }));
};

// API quota checker
export const checkAPICredits = async (): Promise<boolean> => {
  if (!openai || apiQuotaExceeded) return false;
  
  // Don't check too frequently (every 5 minutes)
  const now = Date.now();
  if (now - lastQuotaCheck < 5 * 60 * 1000) {
    return !apiQuotaExceeded;
  }
  
  try {
    const completion = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL_FAST || "gpt-4o-mini",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 1
    });
    apiQuotaExceeded = false;
    lastQuotaCheck = now;
    return true;
  } catch (error: any) {
    if (error.status === 429 || error.message?.includes('quota')) {
      console.warn('❌ OpenAI API quota exceeded');
      apiQuotaExceeded = true;
      lastQuotaCheck = now;
      localStorage.setItem('openai_quota_exceeded', 'true');
      localStorage.setItem('openai_last_quota_check', now.toString());
      return false;
    }
    return true;
  }
};

// Check if API is available without making a request
export const isAPIAvailable = (): boolean => {
  return !!(openai && !apiQuotaExceeded);
};

// Reset API status (useful when user adds credits)
export const resetAPIStatus = (): void => {
  apiQuotaExceeded = false;
  lastQuotaCheck = 0;
  localStorage.removeItem('openai_quota_exceeded');
  localStorage.removeItem('openai_last_quota_check');
  console.log('🔄 API status reset - will attempt to use OpenAI again');
};

// AI-powered data extraction
export const extractResumeDataWithAI = async (resumeText: string): Promise<Partial<Candidate>> => {
  // Check if API is available before making any requests
  if (!isAPIAvailable()) {
    console.log('🔄 OpenAI API quota exceeded or unavailable, using fallback extraction');
    return extractCandidateInfoFallback(resumeText);
  }
  
  try {
    // Add delay to avoid rate limiting
    await delay(1000);
    
    const completion = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL_FAST || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting contact information from resumes. Extract Name, Email, and Phone number. Return ONLY valid JSON without any markdown formatting or code blocks. Format: {\"name\": \"string\", \"email\": \"string\", \"phone\": \"string\"}"
        },
        {
          role: "user",
          content: `Extract Name, Email, and Phone from this resume text: ${resumeText}`
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    const responseText = completion.choices[0].message.content || '{}';
    
    // Clean the response - remove markdown formatting if present
    let cleanResponse = responseText.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const extractedData = JSON.parse(cleanResponse);
    
    // Clear quota exceeded flag on successful API call
    if (apiQuotaExceeded) {
      apiQuotaExceeded = false;
      localStorage.removeItem('openai_quota_exceeded');
      console.log('✅ OpenAI API working again - quota issue resolved');
    }
    
    return extractedData;
  } catch (error: any) {
    console.error('OpenAI extraction error:', error);
    
    // Handle rate limiting specifically
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      console.warn('❌ OpenAI rate limit exceeded, marking API as unavailable');
      apiQuotaExceeded = true;
      lastQuotaCheck = Date.now();
      localStorage.setItem('openai_quota_exceeded', 'true');
      localStorage.setItem('openai_last_quota_check', lastQuotaCheck.toString());
      console.log('💡 Tip: Add credits to your OpenAI account or wait for quota reset');
      console.log('🔄 Switching to offline mode for resume parsing...');
    }
    
    // Fallback to regex-based extraction
    return extractCandidateInfoFallback(resumeText);
  }
};

// AI-powered question generation based on resume
export const generateQuestionsFromResume = async (resumeText: string): Promise<Question[]> => {
  if (!isAPIAvailable()) {
    console.log('🔄 OpenAI API quota exceeded or unavailable, using fallback question generation');
    return generateQuestions();
  }
  
  try {
    // Add delay to avoid rate limiting
    await delay(2000);
    
    const completion = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL_FAST || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer. Generate EXACTLY 6 interview questions for a full-stack developer role based on the candidate's resume. 
          Create EXACTLY 2 easy (50 seconds each), 2 medium (90 seconds each), and 2 hard (150 seconds each) questions. Focus on React, Node.js, JavaScript, and technologies mentioned in the resume.
          IMPORTANT: Return EXACTLY 6 questions, no more, no less.
          Return ONLY valid JSON without any markdown formatting or code blocks. Format: {"questions": [{"id": "string", "text": "string", "difficulty": "easy|medium|hard", "timeLimit": number, "category": "string"}]}`
        },
        {
          role: "user",
          content: `Generate interview questions based on this resume: ${resumeText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const responseText = completion.choices[0].message.content || '{}';
    
    // Clean the response - remove markdown formatting if present
    let cleanResponse = responseText.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const response = JSON.parse(cleanResponse);
    
    // Validate and limit to exactly 6 questions
    let questions = response.questions || [];
    console.log(`🔍 AI generated ${questions.length} questions initially`);
    
    // Ensure we have exactly 6 questions
    if (questions.length > 6) {
      console.warn(`🚨 AI generated ${questions.length} questions, limiting to 6`);
      console.warn('🚨 Original questions:', questions.map(q => ({ id: q.id, text: q.text.substring(0, 30) })));
      questions = questions.slice(0, 6);
      console.warn('🚨 After limiting:', questions.map(q => ({ id: q.id, text: q.text.substring(0, 30) })));
    }
    
    // Ensure we have at least 6 questions by padding with fallback questions if needed
    if (questions.length < 6) {
      console.warn(`AI generated only ${questions.length} questions, using fallback for missing questions`);
      const fallbackQuestions = await generateQuestions();
      const neededQuestions = 6 - questions.length;
      console.log(`🔍 Adding ${neededQuestions} fallback questions`);
      questions = [...questions, ...fallbackQuestions.slice(0, neededQuestions)];
      console.log(`🔍 After padding: ${questions.length} questions`);
    }
    
    // Validate question structure
    questions = validateQuestions(questions);
    
    // Final safety check - ensure exactly 6 questions
    if (questions.length !== 6) {
      console.error(`🚨 CRITICAL: Expected 6 questions, got ${questions.length}! Forcing to 6.`);
      if (questions.length > 6) {
        console.error(`🚨 CRITICAL: Had ${questions.length} questions, slicing to 6`);
        questions = questions.slice(0, 6);
        console.error(`🚨 CRITICAL: After slicing: ${questions.length} questions`);
      } else {
        // This should never happen due to padding logic above
        console.error('🚨 CRITICAL: Less than 6 questions after padding - this is a bug!');
      }
    }
    
    // ABSOLUTE FINAL CHECK - This should never happen
    if (questions.length > 6) {
      console.error(`🚨 ABSOLUTE CRITICAL BUG: Still have ${questions.length} questions! Forcing to 6.`);
      questions = questions.slice(0, 6);
    }
    
    console.log(`✅ Generated ${questions.length} questions for interview`);
    console.log('🔍 Final questions array:', questions.map((q: Question) => ({ id: q.id, text: q.text.substring(0, 50) + '...', difficulty: q.difficulty })));
    
    // CRITICAL DEBUG: Log each question individually
    console.log('🔍 CRITICAL DEBUG - Individual questions:');
    questions.forEach((q: Question, index: number) => {
      console.log(`  Question ${index + 1}: ${q.id} - ${q.text.substring(0, 30)}...`);
    });
    
    return questions;
  } catch (error: any) {
    console.error('OpenAI question generation error:', error);
    
    // Handle rate limiting specifically
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      console.warn('❌ OpenAI rate limit exceeded, marking API as unavailable');
      apiQuotaExceeded = true;
      lastQuotaCheck = Date.now();
      localStorage.setItem('openai_quota_exceeded', 'true');
      localStorage.setItem('openai_last_quota_check', lastQuotaCheck.toString());
      console.log('🔄 Using fallback questions');
    }
    
    return generateQuestions();
  }
};

// AI-powered answer evaluation
export const evaluateAnswerWithAI = async (question: Question, answer: string): Promise<number> => {
  if (!isAPIAvailable()) {
    console.log('🔄 OpenAI API quota exceeded or unavailable, using fallback evaluation');
    return evaluateAnswer(question, answer);
  }
  
  try {
    // Add delay to avoid rate limiting
    await delay(1500);
    
    const completion = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL_FAST || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer evaluating candidate answers. 
          Rate the answer on a scale of 0-100 based on:
          - Technical accuracy
          - Completeness of response
          - Understanding of concepts
          - Practical application
          - Communication clarity
          
          Consider the question difficulty:
          - Easy (0-50s): Basic concepts, simple explanations
          - Medium (0-90s): Intermediate concepts, some depth
          - Hard (0-150s): Advanced concepts, complex problem-solving
          
          Return ONLY valid JSON without any markdown formatting or code blocks. Format: {"score": number, "feedback": "string"}`
        },
        {
          role: "user",
          content: `Question (${question.difficulty} - ${question.timeLimit}s): ${question.text}
          
          Candidate Answer: ${answer}
          
          Evaluate this answer and provide a score from 0-100.`
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const responseText = completion.choices[0].message.content || '{"score": 0}';
    
    // Clean the response - remove markdown formatting if present
    let cleanResponse = responseText.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const evaluation = JSON.parse(cleanResponse);
    return evaluation.score;
  } catch (error: any) {
    console.error('OpenAI evaluation error:', error);
    
    // Handle rate limiting specifically
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      console.warn('❌ OpenAI rate limit exceeded, marking API as unavailable');
      apiQuotaExceeded = true;
      lastQuotaCheck = Date.now();
      localStorage.setItem('openai_quota_exceeded', 'true');
      localStorage.setItem('openai_last_quota_check', lastQuotaCheck.toString());
      console.log('🔄 Using fallback evaluation');
    }
    
    return evaluateAnswer(question, answer);
  }
};

// AI-powered summary generation
export const generateSummaryWithAI = async (candidate: any, questions: Question[], answers: any[]): Promise<string> => {
  if (!isAPIAvailable()) {
    console.log('🔄 OpenAI API quota exceeded or unavailable, using fallback summary generation');
    return generateSummary(candidate, questions, answers);
  }
  
  try {
    // Add delay to avoid rate limiting
    await delay(2500);
    
    const completion = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL_FAST || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert HR professional creating candidate evaluation summaries. 
          Analyze the interview performance and provide a comprehensive summary including:
          - Overall performance assessment
          - Strengths demonstrated
          - Areas for improvement
          - Technical competency level
          - Recommendation for next steps
          
          Be professional, constructive, and specific.`
        },
        {
          role: "user",
          content: `Create a summary for candidate: ${candidate.name}
          
          Interview Questions and Answers:
          ${questions.map((q, index) => `
          Q${index + 1} (${q.difficulty}): ${q.text}
          A${index + 1}: ${answers[index]?.text || 'No answer provided'}
          Score: ${answers[index]?.score || 0}/100
          `).join('\n')}
          
          Final Score: ${candidate.finalScore}/100
          
          Generate a professional evaluation summary.`
        }
      ],
      temperature: 0.5,
      max_tokens: 500
    });

    return completion.choices[0].message.content || 'No summary available';
  } catch (error: any) {
    console.error('OpenAI summary generation error:', error);
    
    // Handle rate limiting specifically
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      console.warn('❌ OpenAI rate limit exceeded, marking API as unavailable');
      apiQuotaExceeded = true;
      lastQuotaCheck = Date.now();
      localStorage.setItem('openai_quota_exceeded', 'true');
      localStorage.setItem('openai_last_quota_check', lastQuotaCheck.toString());
      console.log('🔄 Using fallback summary');
    }
    
    return generateSummary(candidate, questions, answers);
  }
};

// Fallback function for data extraction
export const extractCandidateInfoFallback = (text: string): Partial<Candidate> => {
  const extractedData: Partial<Candidate> = {
    resumeText: text,
  };

  // Extract email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    extractedData.email = emailMatch[0];
  }

  // Extract phone number
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    extractedData.phone = phoneMatch[0];
  }

  // Extract name (look for common patterns) - improved regex
  const namePatterns = [
    /(?:Name|Full Name|Candidate Name)[:\s]+([A-Za-z\s]+?)(?:\n|$)/i,
    /^([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\n|$)/m, // First line with proper name pattern
    /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s|$)/, // First Name Last Name pattern with word boundary
  ];

  for (const pattern of namePatterns) {
    const nameMatch = text.match(pattern);
    if (nameMatch) {
      const potentialName = nameMatch[1]?.trim();
      // More strict validation - only accept proper names
      if (potentialName && 
          potentialName.length > 2 && 
          potentialName.length < 50 &&
          /^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(potentialName)) {
        extractedData.name = potentialName;
        break;
      }
    }
  }

  return extractedData;
};

// Keep existing fallback functions
export const generateQuestions = async (): Promise<Question[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('🔍 Generating fallback questions...');
  const questions: Question[] = [
    // Easy Questions
    {
      id: 'q1',
      text: 'What is React and what are its main advantages for building user interfaces? How does it differ from traditional DOM manipulation?',
      difficulty: 'easy',
      timeLimit: 50, // 20 + 30 = 50 seconds
      category: 'React Fundamentals',
    },
    {
      id: 'q2',
      text: 'Explain the difference between let, const, and var in JavaScript. When would you use each in a React/Node.js application?',
      difficulty: 'easy',
      timeLimit: 50, // 20 + 30 = 50 seconds
      category: 'JavaScript Fundamentals',
    },
    // Medium Questions
    {
      id: 'q3',
      text: 'How would you implement state management in a large React application? Discuss Redux Toolkit, Context API, and Zustand for a full-stack React/Node.js project.',
      difficulty: 'medium',
      timeLimit: 90, // 60 + 30 = 90 seconds
      category: 'React State Management',
    },
    {
      id: 'q4',
      text: 'Explain how you would build a RESTful API using Node.js and Express. Include middleware, error handling, and database integration.',
      difficulty: 'medium',
      timeLimit: 90, // 60 + 30 = 90 seconds
      category: 'Node.js Backend',
    },
    // Hard Questions
    {
      id: 'q5',
      text: 'Design a full-stack architecture for a real-time chat application using React, Node.js, and WebSockets. Consider performance, scalability, and data consistency.',
      difficulty: 'hard',
      timeLimit: 150, // 120 + 30 = 150 seconds
      category: 'Full-Stack Architecture',
    },
    {
      id: 'q6',
      text: 'Implement a custom React hook for managing complex form validation with async validation rules. Show how you would integrate it with a Node.js backend API.',
      difficulty: 'hard',
      timeLimit: 150, // 120 + 30 = 150 seconds
      category: 'React Advanced + Node.js Integration',
    },
  ];

  console.log(`🔍 Fallback generated ${questions.length} questions`);
  return questions;
};

export const evaluateAnswer = async (question: Question, answer: string): Promise<number> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock scoring logic - in a real implementation, this would use AI to evaluate the answer
  const baseScore = getBaseScoreByDifficulty(question.difficulty);
  const answerLength = answer.trim().length;
  
  // Simple scoring based on answer length and content
  let score = baseScore;
  
  if (answerLength < 10) {
    score = Math.max(0, score - 20); // Very short answers get penalized
  } else if (answerLength > 100) {
    score = Math.min(100, score + 10); // Longer, thoughtful answers get bonus
  }
  
  // Add some randomness to simulate AI evaluation
  const randomFactor = (Math.random() - 0.5) * 10;
  score = Math.max(0, Math.min(100, score + randomFactor));
  
  return Math.round(score);
};

const getBaseScoreByDifficulty = (difficulty: string): number => {
  switch (difficulty) {
    case 'easy': return 70;
    case 'medium': return 60;
    case 'hard': return 50;
    default: return 50;
  }
};

export const generateSummary = async (candidate: any, questions: Question[], answers: any[]): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const totalScore = answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
  const averageScore = totalScore / answers.length;
  
  const completedQuestions = answers.length;
  const totalQuestions = questions.length;
  
  let summary = `Candidate ${candidate.name} completed ${completedQuestions}/${totalQuestions} questions with an average score of ${Math.round(averageScore)}/100. `;
  
  if (averageScore >= 80) {
    summary += 'The candidate demonstrated strong technical knowledge and provided comprehensive answers. ';
  } else if (averageScore >= 60) {
    summary += 'The candidate showed good understanding of the topics with room for improvement. ';
  } else {
    summary += 'The candidate may need additional training or experience in the technical areas covered. ';
  }
  
  // Add specific feedback based on performance
  const easyAnswers = answers.filter((_, index) => questions[index]?.difficulty === 'easy');
  // const mediumAnswers = answers.filter((_, index) => questions[index]?.difficulty === 'medium');
  const hardAnswers = answers.filter((_, index) => questions[index]?.difficulty === 'hard');
  
  if (easyAnswers.length > 0) {
    const easyAvg = easyAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0) / easyAnswers.length;
    if (easyAvg >= 80) {
      summary += 'Strong performance on fundamental concepts. ';
    }
  }
  
  if (hardAnswers.length > 0) {
    const hardAvg = hardAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0) / hardAnswers.length;
    if (hardAvg >= 70) {
      summary += 'Excellent problem-solving skills demonstrated in complex scenarios. ';
    } else if (hardAvg < 40) {
      summary += 'May need more experience with advanced technical challenges. ';
    }
  }
  
  summary += `Overall recommendation: ${averageScore >= 70 ? 'Proceed to next round' : 'Consider for junior role or additional training'}.`;
  
  return summary;
};

// Real AI integration functions (commented out for now)
/*
export const generateQuestionsWithAI = async (): Promise<Question[]> => {
  const response = await fetch('/api/generate-questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'full-stack-developer',
      difficulty: 'mixed',
      count: 6,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate questions');
  }
  
  return await response.json();
};

export const evaluateAnswerWithAI = async (question: Question, answer: string): Promise<number> => {
  const response = await fetch('/api/evaluate-answer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: question.text,
      answer: answer,
      difficulty: question.difficulty,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to evaluate answer');
  }
  
  const result = await response.json();
  return result.score;
};
*/
