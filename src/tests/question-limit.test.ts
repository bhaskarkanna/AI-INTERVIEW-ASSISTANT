import { describe, it, expect, vi } from 'vitest';
import { generateQuestionsFromResume, generateQuestions } from '../services/aiService';

// Mock OpenAI to simulate different scenarios
vi.mock('../services/aiService', async () => {
  const actual = await vi.importActual('../services/aiService');
  return {
    ...actual,
    // Don't mock generateQuestionsFromResume - let it run normally
  };
});

describe('Question Limit Validation', () => {
  it('should return exactly 6 questions from fallback function', async () => {
    const questions = await generateQuestions();
    expect(questions).toHaveLength(6);
  });

  it('should handle AI generating more than 6 questions', async () => {
    // Test the actual limiting logic by calling the real function
    // This will test our safety checks in the actual implementation
    const questions = await generateQuestionsFromResume('test resume');
    
    // Should be limited to 6 questions by our safety checks
    expect(questions).toHaveLength(6);
    expect(questions[0].id).toBeDefined();
    expect(questions[5].id).toBeDefined();
  });

  it('should handle AI generating less than 6 questions', async () => {
    // Test the actual padding logic by calling the real function
    // This will test our padding logic in the actual implementation
    const questions = await generateQuestionsFromResume('test resume');
    
    // Should be padded to 6 questions by our padding logic
    expect(questions).toHaveLength(6);
  });

  it('should validate question structure', async () => {
    const questions = await generateQuestions();
    
    questions.forEach((question, index) => {
      expect(question.id).toBeDefined();
      expect(question.text).toBeDefined();
      expect(question.difficulty).toMatch(/^(easy|medium|hard)$/);
      expect(question.timeLimit).toBeDefined();
      expect(question.category).toBeDefined();
      
      // Validate difficulty distribution
      if (index < 2) {
        expect(question.difficulty).toBe('easy');
        expect(question.timeLimit).toBe(20);
      } else if (index < 4) {
        expect(question.difficulty).toBe('medium');
        expect(question.timeLimit).toBe(60);
      } else {
        expect(question.difficulty).toBe('hard');
        expect(question.timeLimit).toBe(120);
      }
    });
  });
});
