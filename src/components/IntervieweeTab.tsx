import React, { useEffect } from 'react';
import { Card, Steps, Alert, Button, Space } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { setActiveTab } from '../store/slices/uiSlice';
import { clearCurrentCandidate } from '../store/slices/candidateSlice';
import ResumeUpload from './ResumeUpload';
import ChatInterface from './ChatInterface';

const { Step } = Steps;

const IntervieweeTab: React.FC = () => {
  const dispatch = useDispatch();
  const interview = useSelector((state: RootState) => state.interview);
  const candidates = useSelector((state: RootState) => state.candidates);

  useEffect(() => {
    dispatch(setActiveTab('interviewee'));
  }, [dispatch]);

  const currentCandidate = useSelector((state: RootState) => state.candidates.currentCandidate);

  const getCurrentStep = () => {
    if (!currentCandidate) return 0;
    if (currentCandidate.interviewStatus === 'not_started') return 0;
    if (currentCandidate.interviewStatus === 'in_progress') return 1;
    if (currentCandidate.interviewStatus === 'completed') return 2;
    return 0;
  };

  const steps = [
    {
      title: 'Upload Resume',
      description: 'Upload your resume to get started',
    },
    {
      title: 'Interview',
      description: 'Answer AI-generated questions',
    },
    {
      title: 'Complete',
      description: 'Review your results',
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Steps current={getCurrentStep()} style={{ marginBottom: '24px' }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} description={step.description} />
          ))}
        </Steps>

        {getCurrentStep() === 0 && (
          <ResumeUpload onComplete={() => {
            // Force re-render by dispatching a dummy action or using a state update
            // The Redux state change should trigger a re-render automatically
          }} />
        )}

        {getCurrentStep() === 1 && currentCandidate && (
          <div>
            <div style={{ marginBottom: '16px', textAlign: 'right' }}>
              <Button 
                type="default" 
                onClick={() => dispatch(clearCurrentCandidate())}
              >
                Start New Interview
              </Button>
            </div>
            <ChatInterface />
          </div>
        )}

        {getCurrentStep() === 2 && currentCandidate && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Alert
              message="Interview Completed!"
              description={`Your final score: ${currentCandidate.finalScore}/100`}
              type="success"
              showIcon
              style={{ marginBottom: '24px' }}
            />
            {currentCandidate.aiSummary && (
              <Card title="AI Summary" style={{ textAlign: 'left', marginBottom: '24px' }}>
                <p>{currentCandidate.aiSummary}</p>
              </Card>
            )}
            <Space>
              <Button 
                type="primary" 
                size="large"
                onClick={() => dispatch(clearCurrentCandidate())}
              >
                Start New Interview
              </Button>
            </Space>
          </div>
        )}
      </Card>
    </div>
  );
};

export default IntervieweeTab;
