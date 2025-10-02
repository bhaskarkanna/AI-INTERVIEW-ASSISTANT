import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Typography, Progress, Alert, Space, Avatar } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { addAnswer, updateInterviewStatus, setFinalScore } from '../store/slices/candidateSlice';
import { setCurrentQuestion, submitAnswer, updateTimeRemaining } from '../store/slices/interviewSlice';
import { evaluateAnswerWithAI, generateSummaryWithAI } from '../services/aiService';
import Timer from './Timer';
import type { Candidate, Answer } from '../types';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface ChatInterfaceProps {}

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

const ChatInterface: React.FC<ChatInterfaceProps> = () => {
  const dispatch = useDispatch();
  const interview = useSelector((state: RootState) => state.interview);
  const currentCandidate = useSelector((state: RootState) => state.candidates.currentCandidate);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log('ChatInterface render - candidate:', currentCandidate);
  console.log('ChatInterface render - interview:', interview);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Timer update effect
  useEffect(() => {
    if (interview.currentQuestion) {
      console.log('Timer effect - currentQuestion:', interview.currentQuestion);
      console.log('Timer effect - timeRemaining:', interview.timeRemaining);
      
      // If timeRemaining is 0, set it to the question's timeLimit
      if (interview.timeRemaining === 0 && interview.currentQuestion.timeLimit > 0) {
        console.log('Setting timeRemaining to question timeLimit:', interview.currentQuestion.timeLimit);
        dispatch(updateTimeRemaining(interview.currentQuestion.timeLimit));
        return;
      }
      
      if (interview.timeRemaining > 0) {
        console.log('Starting timer with time remaining:', interview.timeRemaining);
        const timer = setInterval(() => {
          const newTime = interview.timeRemaining - 1;
          console.log('Timer tick:', newTime);
          dispatch(updateTimeRemaining(newTime));
          
          // Auto-submit when time reaches 0
          if (newTime <= 0) {
            console.log('Timer reached 0, calling handleTimeUp');
            handleTimeUp();
          }
        }, 1000);

        return () => clearInterval(timer);
      }
    }
  }, [interview.currentQuestion, interview.timeRemaining, dispatch]);

  useEffect(() => {
    if (interview.currentQuestion) {
      // Build chat history with previous Q&A pairs and current question
      const chatHistory: Message[] = [];
      
      // Add previous Q&A pairs
      for (let i = 0; i < currentCandidate.currentQuestionIndex; i++) {
        const question = currentCandidate.questions[i];
        const answer = currentCandidate.answers[i];
        
        if (question) {
          chatHistory.push({
            id: `q-${question.id}`,
            type: 'ai',
            content: `Question ${i + 1}/${currentCandidate.questions.length} (${question.difficulty.toUpperCase()}): ${question.text}`,
            timestamp: new Date(),
          });
        }
        
        if (answer) {
          chatHistory.push({
            id: `a-${answer.questionId}`,
            type: 'user',
            content: answer.text,
            timestamp: new Date(answer.submittedAt),
          });
        }
      }
      
      // Add current question
      const currentQuestionMessage: Message = {
        id: `q-${interview.currentQuestion.id}`,
        type: 'ai',
        content: `Question ${currentCandidate.currentQuestionIndex + 1}/${currentCandidate.questions.length} (${interview.currentQuestion.difficulty.toUpperCase()}): ${interview.currentQuestion.text}`,
        timestamp: new Date(),
      };
      chatHistory.push(currentQuestionMessage);
      
      setMessages(chatHistory);
    }
  }, [interview.currentQuestion, currentCandidate?.currentQuestionIndex, currentCandidate?.questions, currentCandidate?.answers]);

  const handleSubmitAnswer = async () => {
    console.log('Submit button clicked!');
    console.log('Current answer:', currentAnswer);
    console.log('Current question:', interview.currentQuestion);
    console.log('Current candidate:', currentCandidate);
    
    if (!currentAnswer.trim() || !interview.currentQuestion || !currentCandidate) {
      console.log('Submit blocked - no answer, question, or candidate');
      return;
    }

    console.log('Starting submit process...');
    setIsSubmitting(true);
    
    const answer: Answer = {
      questionId: interview.currentQuestion.id,
      text: currentAnswer,
      timeSpent: interview.currentQuestion.timeLimit - interview.timeRemaining,
      submittedAt: new Date().toISOString(),
    };

    // Add user message to current messages
    const userMessage: Message = {
      id: `a-${Date.now()}`,
      type: 'user',
      content: currentAnswer,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Submit answer
    dispatch(addAnswer({ candidateId: currentCandidate.id, answer }));
    dispatch(submitAnswer());

    setCurrentAnswer('');

    // Move to next question or complete interview
    const nextQuestionIndex = currentCandidate.currentQuestionIndex + 1;
    console.log('Next question index:', nextQuestionIndex);
    console.log('Total questions:', currentCandidate.questions.length);
    
    // Safety check: ensure we don't go beyond available questions
    if (nextQuestionIndex < currentCandidate.questions.length && nextQuestionIndex < 6) {
      const nextQuestion = currentCandidate.questions[nextQuestionIndex];
      console.log('Moving to next question:', nextQuestion);
      dispatch(setCurrentQuestion({ 
        question: nextQuestion, 
        timeRemaining: nextQuestion.timeLimit 
      }));
      dispatch(updateInterviewStatus({ 
        candidateId: currentCandidate.id, 
        status: 'in_progress' 
      }));
    } else {
      console.log('Interview completed!');
      // Interview completed - calculate scores
      handleInterviewCompletion();
    }

    setIsSubmitting(false);
  };

  const handleInterviewCompletion = async () => {
    console.log('Starting interview completion process...');
    
    // Show evaluation message
    const evaluationMessage: Message = {
      id: `evaluate-${Date.now()}`,
      type: 'ai',
      content: 'Interview completed! Your responses are being evaluated...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, evaluationMessage]);

    try {
      // Calculate scores for each answer
      const scoredAnswers = [];
      for (let i = 0; i < currentCandidate.answers.length; i++) {
        const answer = currentCandidate.answers[i];
        const question = currentCandidate.questions[i];
        
        if (question && answer) {
          console.log(`Evaluating answer ${i + 1}:`, answer.text);
          const score = await evaluateAnswerWithAI(question, answer.text);
          console.log(`Score for answer ${i + 1}:`, score);
          
          scoredAnswers.push({
            ...answer,
            score: score
          });
        }
      }

      // Calculate final score
      const totalScore = scoredAnswers.reduce((sum, answer) => sum + (answer.score || 0), 0);
      const averageScore = Math.round(totalScore / scoredAnswers.length);
      
      console.log('Final average score:', averageScore);

      // Generate AI summary
      const summary = await generateSummaryWithAI(currentCandidate, currentCandidate.questions, scoredAnswers);
      console.log('Generated summary:', summary);

      // Update candidate with final score and summary
      dispatch(setFinalScore({ 
        candidateId: currentCandidate.id, 
        score: averageScore, 
        summary: summary 
      }));

      // Show completion message with score
      const completionMessage: Message = {
        id: `complete-${Date.now()}`,
        type: 'ai',
        content: `🎉 Interview completed! Your final score: ${averageScore}/100. Check the Interviewer tab to see detailed results.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, completionMessage]);

    } catch (error) {
      console.error('Error during interview completion:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'ai',
        content: 'There was an error evaluating your responses. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleTimeUp = () => {
    console.log('Time up! Current answer:', currentAnswer);
    if (currentAnswer.trim()) {
      console.log('Submitting answer:', currentAnswer);
      handleSubmitAnswer();
    } else {
      console.log('Auto-submitting empty answer');
      // Auto-submit empty answer
      handleSubmitAnswer();
    }
  };

  const getProgressPercentage = () => {
    if (!currentCandidate || !currentCandidate.questions.length) return 0;
    return ((currentCandidate.currentQuestionIndex + 1) / currentCandidate.questions.length) * 100;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#52c41a';
      case 'medium': return '#faad14';
      case 'hard': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Title level={4}>Interview Progress</Title>
          <Progress 
            percent={getProgressPercentage()} 
            status="active"
            format={() => {
              const current = currentCandidate ? currentCandidate.currentQuestionIndex + 1 : 0;
              const total = currentCandidate ? currentCandidate.questions.length : 0;
              console.log(`🔍 Progress Debug: current=${current}, total=${total}, questions=`, currentCandidate?.questions);
              return `${current}/${total} questions`;
            }}
          />
        </div>

        {interview.currentQuestion && (
          <div style={{ marginBottom: '16px' }}>
            <Alert
              message={`${interview.currentQuestion.difficulty.toUpperCase()} Question`}
              description={`Time Limit: ${interview.currentQuestion.timeLimit} seconds`}
              type="info"
              style={{ 
                borderLeftColor: getDifficultyColor(interview.currentQuestion.difficulty),
                borderLeftWidth: '4px'
              }}
            />
          </div>
        )}

        <div style={{ 
          height: '400px', 
          overflowY: 'auto', 
          border: '1px solid #d9d9d9', 
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '16px',
          background: '#fafafa'
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <Avatar 
                  icon={message.type === 'ai' ? <RobotOutlined /> : <UserOutlined />}
                  style={{ 
                    backgroundColor: message.type === 'ai' ? '#1890ff' : '#52c41a',
                    flexShrink: 0
                  }}
                />
                <div
                  style={{
                    background: message.type === 'ai' ? '#fff' : '#1890ff',
                    color: message.type === 'ai' ? '#000' : '#fff',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    wordWrap: 'break-word',
                  }}
                >
                  <Text style={{ color: message.type === 'ai' ? '#000' : '#fff' }}>
                    {message.content}
                  </Text>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {interview.currentQuestion && (
          <div style={{ marginBottom: '16px' }}>
            <Timer
              timeRemaining={interview.timeRemaining}
              onTimeUp={handleTimeUp}
              isPaused={interview.isPaused}
            />
          </div>
        )}

        {currentCandidate && currentCandidate.interviewStatus === 'in_progress' && (
          <div style={{ width: '100%' }}>
            <TextArea
              value={currentAnswer}
              onChange={(e) => {
                console.log('Input change:', e.target.value);
                setCurrentAnswer(e.target.value);
              }}
              placeholder="Type your answer here..."
              autoSize={{ minRows: 3, maxRows: 6 }}
              disabled={isSubmitting}
              style={{ width: '100%', marginBottom: '8px' }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => {
                console.log('Button clicked!');
                handleSubmitAnswer();
              }}
              loading={isSubmitting}
              disabled={!currentAnswer.trim()}
              style={{ width: '100%' }}
            >
              Submit
            </Button>
          </div>
        )}
        
        {/* Debug info */}
        <div style={{ marginTop: '16px', padding: '8px', background: '#f0f0f0', fontSize: '12px' }}>
          <div>Interview Status: {currentCandidate?.interviewStatus || 'No candidate'}</div>
          <div>Current Answer: "{currentAnswer}"</div>
          <div>Is Submitting: {isSubmitting.toString()}</div>
          <div>Current Question Index: {currentCandidate?.currentQuestionIndex || 0}</div>
        </div>

        {currentCandidate && currentCandidate.interviewStatus === 'completed' && (
          <div>
            <Alert
              message="Interview Completed!"
              description={`Your final score: ${currentCandidate.finalScore || 'Calculating...'}/100`}
              type="success"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            {currentCandidate.aiSummary && (
              <Card title="AI Summary" size="small">
                <Text>{currentCandidate.aiSummary}</Text>
              </Card>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChatInterface;
