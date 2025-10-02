import React from 'react';
import { Modal, Button, Typography, Space } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { showWelcomeBackModal } from '../store/slices/uiSlice';
import { setCurrentCandidate } from '../store/slices/candidateSlice';
import { startInterview } from '../store/slices/interviewSlice';
import type { Candidate } from '../types';

const { Title, Text } = Typography;

const WelcomeBackModal: React.FC = () => {
  const dispatch = useDispatch();
  const ui = useSelector((state: RootState) => state.ui);
  const candidates = useSelector((state: RootState) => state.candidates.candidates);

  const handleResumeInterview = () => {
    // Find the candidate with in-progress interview
    const inProgressCandidate = candidates.find((c: Candidate) => c.interviewStatus === 'in_progress');
    
    if (inProgressCandidate) {
      dispatch(setCurrentCandidate(inProgressCandidate.id));
      dispatch(startInterview({ 
        candidate: inProgressCandidate, 
        questions: inProgressCandidate.questions 
      }));
    }
    
    dispatch(showWelcomeBackModal(false));
  };

  const handleStartNewInterview = () => {
    dispatch(showWelcomeBackModal(false));
  };

  const inProgressCandidate = candidates.find((c: Candidate) => c.interviewStatus === 'in_progress');

  return (
    <Modal
      title="Welcome Back!"
      open={ui.showWelcomeBackModal}
      onCancel={() => dispatch(showWelcomeBackModal(false))}
      footer={null}
      centered
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Title level={4}>You have an unfinished interview</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
          Would you like to continue where you left off or start a new interview?
        </Text>

        {inProgressCandidate && (
          <div style={{ 
            background: '#f5f5f5', 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <Text strong>Previous Interview Details:</Text>
            <div style={{ marginTop: '8px' }}>
              <div>Candidate: {inProgressCandidate.name}</div>
              <div>Progress: {inProgressCandidate.currentQuestionIndex + 1}/{inProgressCandidate.questions.length} questions</div>
              <div>Status: {inProgressCandidate.interviewStatus}</div>
            </div>
          </div>
        )}

        <Space>
          <Button type="primary" onClick={handleResumeInterview}>
            Resume Interview
          </Button>
          <Button onClick={handleStartNewInterview}>
            Start New Interview
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;
