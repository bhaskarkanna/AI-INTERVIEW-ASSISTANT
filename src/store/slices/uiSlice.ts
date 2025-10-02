import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UIState } from '../../types';

const initialState: UIState = {
  activeTab: 'interviewee',
  isLoading: false,
  error: undefined,
  showWelcomeBackModal: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<'interviewee' | 'interviewer'>) => {
      state.activeTab = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    },
    showWelcomeBackModal: (state, action: PayloadAction<boolean>) => {
      state.showWelcomeBackModal = action.payload;
    },
    clearError: (state) => {
      state.error = undefined;
    },
  },
});

export const {
  setActiveTab,
  setLoading,
  setError,
  showWelcomeBackModal,
  clearError,
} = uiSlice.actions;

export default uiSlice.reducer;
