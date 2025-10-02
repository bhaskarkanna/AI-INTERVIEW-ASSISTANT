import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { InterviewState, Question } from '../../types';

const initialState: InterviewState = {
  isInterviewActive: false,
  currentQuestion: undefined,
  timeRemaining: 0,
  isPaused: false,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startInterview: (state, action: PayloadAction<{ candidate: any; questions: Question[] }>) => {
      state.isInterviewActive = true;
      state.currentQuestion = action.payload.questions[0];
      state.timeRemaining = action.payload.questions[0]?.timeLimit || 0;
      state.isPaused = false;
    },
    setCurrentQuestion: (state, action: PayloadAction<{ question: Question; timeRemaining: number }>) => {
      state.currentQuestion = action.payload.question;
      state.timeRemaining = action.payload.timeRemaining;
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
    },
    pauseInterview: (state) => {
      state.isPaused = true;
    },
    resumeInterview: (state) => {
      state.isPaused = false;
    },
    endInterview: (state) => {
      state.isInterviewActive = false;
      state.currentQuestion = undefined;
      state.timeRemaining = 0;
      state.isPaused = false;
    },
    submitAnswer: (state) => {
      // This will be handled by the candidate slice
      state.timeRemaining = 0;
    },
  },
});

export const {
  startInterview,
  setCurrentQuestion,
  updateTimeRemaining,
  pauseInterview,
  resumeInterview,
  endInterview,
  submitAnswer,
} = interviewSlice.actions;

export default interviewSlice.reducer;
