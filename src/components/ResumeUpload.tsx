import React, { useState } from 'react';
import { Upload, Button, Form, Input, Card, Alert, Typography } from 'antd';
import { InboxOutlined, FileTextOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { addCandidate, setCurrentCandidate, clearCurrentCandidate } from '../store/slices/candidateSlice';
import { startInterview } from '../store/slices/interviewSlice';
import { parseResume } from '../services/resumeParser';
import { generateQuestionsFromResume, checkAPICredits } from '../services/aiService';
import { v4 as uuidv4 } from 'uuid';
import type { Candidate } from '../types';
import APIStatusNotification from './APIStatusNotification';
import { useAPIStatus } from '../hooks/useAPIStatus';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface ResumeUploadProps {
  onComplete: () => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<Candidate>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'quota-exceeded' | 'unavailable'>('checking');
  const { status, handleAPIError, retryAPI, dismissNotification } = useAPIStatus();

  // Check API status on component mount (disabled to avoid quota issues)
  React.useEffect(() => {
    // Set status based on known quota issue
    setApiStatus('quota-exceeded');
  }, []);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await parseResume(file);
      setExtractedData(data);
      form.setFieldsValue({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
      });
      setFile(file);
    } catch (err: any) {
      setError('Failed to parse resume. Please try again.');
      console.error('Resume parsing error:', err);
      
      // Handle API errors
      handleAPIError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError(null);

    try {
      const candidate: Candidate = {
        id: uuidv4(),
        name: values.name,
        email: values.email,
        phone: values.phone,
        resumeFileName: file?.name || undefined,
        resumeText: extractedData.resumeText,
        interviewStatus: 'in_progress',
        currentQuestionIndex: 0,
        questions: [],
        answers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Generate interview questions based on resume
      const questions = await generateQuestionsFromResume(extractedData.resumeText || '');
      console.log('🔍 ResumeUpload: Generated questions count:', questions.length);
      console.log('🔍 ResumeUpload: Questions array:', questions.map(q => ({ id: q.id, text: q.text.substring(0, 30) + '...' })));
      
      // CRITICAL: Ensure exactly 6 questions
      if (questions.length !== 6) {
        console.error(`🚨 CRITICAL BUG: Expected 6 questions, got ${questions.length}!`);
        console.error('Questions:', questions.map(q => ({ id: q.id, text: q.text.substring(0, 50) })));
        // Force to 6 questions
        candidate.questions = questions.slice(0, 6);
        console.log(`🔍 CRITICAL: Forced to ${candidate.questions.length} questions`);
      } else {
        candidate.questions = questions;
        console.log(`✅ ResumeUpload: Set ${candidate.questions.length} questions correctly`);
      }
      
      // CRITICAL DEBUG: Log the final questions array
      console.log('🔍 CRITICAL DEBUG - Final candidate questions:');
      candidate.questions.forEach((q, index) => {
        console.log(`  Question ${index + 1}: ${q.id} - ${q.text.substring(0, 30)}...`);
      });

      dispatch(addCandidate(candidate));
      dispatch(setCurrentCandidate(candidate.id));
      dispatch(startInterview({ candidate, questions: candidate.questions }));

      onComplete();
    } catch (err: any) {
      setError('Failed to start interview. Please try again.');
      console.error('Interview start error:', err);
      
      // Handle API errors
      handleAPIError(err);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.docx',
    beforeUpload: (file: File) => {
      handleFileUpload(file);
      return false; // Prevent auto upload
    },
    showUploadList: false,
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          Upload Your Resume
        </Title>
        <Button 
          type="default" 
          onClick={() => dispatch(clearCurrentCandidate())}
        >
          Clear Data
        </Button>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          style={{ marginBottom: '16px' }}
          closable
          onClose={() => setError(null)}
        />
      )}

      {/* API Status Notification */}
      <APIStatusNotification
        isVisible={!status.isOnline && status.lastError !== null}
        onRetry={retryAPI}
        onDismiss={dismissNotification}
      />

      <Card>
        <Dragger {...uploadProps} style={{ marginBottom: '24px' }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for PDF and DOCX files. Maximum file size: 10MB
          </p>
        </Dragger>

        {file && (
          <Alert
            message={`File uploaded: ${file.name}`}
            type="success"
            icon={<FileTextOutlined />}
            style={{ marginBottom: '16px' }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={loading}
        >
          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Enter your email address" />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[{ required: true, message: 'Please enter your phone number' }]}
          >
            <Input placeholder="Enter your phone number" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              Start Interview
            </Button>
          </Form.Item>
        </Form>

        <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
          By starting the interview, you agree to our terms of service and privacy policy.
        </Text>
      </Card>
    </div>
  );
};

export default ResumeUpload;
