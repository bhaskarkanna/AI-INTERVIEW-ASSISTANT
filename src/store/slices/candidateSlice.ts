import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Candidate } from '../../types';

interface CandidateState {
  candidates: Candidate[];
  currentCandidate?: Candidate;
}

const initialState: CandidateState = {
  candidates: [],
  currentCandidate: undefined,
};

const candidateSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCandidate: (state, action: PayloadAction<Candidate>) => {
      state.candidates.push(action.payload);
    },
    updateCandidate: (state, action: PayloadAction<{ id: string; updates: Partial<Candidate> }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.id);
      if (candidate) {
        Object.assign(candidate, action.payload.updates);
        candidate.updatedAt = new Date().toISOString();
      }
    },
    setCurrentCandidate: (state, action: PayloadAction<string>) => {
      state.currentCandidate = state.candidates.find(c => c.id === action.payload);
    },
    addAnswer: (state, action: PayloadAction<{ candidateId: string; answer: any }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.answers.push(action.payload.answer);
        candidate.currentQuestionIndex += 1;
        candidate.updatedAt = new Date().toISOString();
        
        // Update currentCandidate if it's the same candidate
        if (state.currentCandidate?.id === candidate.id) {
          state.currentCandidate = candidate;
        }
      }
    },
    updateInterviewStatus: (state, action: PayloadAction<{ candidateId: string; status: Candidate['interviewStatus'] }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.interviewStatus = action.payload.status;
        candidate.updatedAt = new Date().toISOString();
        
        // Update currentCandidate if it's the same candidate
        if (state.currentCandidate?.id === candidate.id) {
          state.currentCandidate = candidate;
        }
      }
    },
    setFinalScore: (state, action: PayloadAction<{ candidateId: string; score: number; summary: string }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.candidateId);
      if (candidate) {
        candidate.finalScore = action.payload.score;
        candidate.aiSummary = action.payload.summary;
        candidate.interviewStatus = 'completed';
        candidate.updatedAt = new Date().toISOString();
        
        // Update currentCandidate if it's the same candidate
        if (state.currentCandidate?.id === candidate.id) {
          state.currentCandidate = candidate;
        }
      }
    },
    clearCurrentCandidate: (state) => {
      state.currentCandidate = undefined;
    },
  },
});

export const {
  addCandidate,
  updateCandidate,
  setCurrentCandidate,
  addAnswer,
  updateInterviewStatus,
  setFinalScore,
  clearCurrentCandidate,
} = candidateSlice.actions;

export default candidateSlice.reducer;
