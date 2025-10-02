import React, { useState, useEffect } from 'react';
import { Alert, Button, Space } from 'antd';
import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';

interface APIStatusNotificationProps {
  isVisible: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}

export const APIStatusNotification: React.FC<APIStatusNotificationProps> = ({
  isVisible,
  onRetry,
  onDismiss
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible) return null;

  return (
    <Alert
      message="AI Service Temporarily Unavailable"
      description={
        <div>
          <p>
            We're experiencing high demand for AI services. The application is now running in offline mode with fallback features.
          </p>
          {showDetails && (
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              <p><strong>What's working:</strong></p>
              <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                <li>Resume parsing with regex extraction</li>
                <li>Pre-defined interview questions</li>
                <li>Basic answer evaluation</li>
                <li>All core interview features</li>
              </ul>
              <p><strong>What's limited:</strong></p>
              <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                <li>AI-powered resume analysis</li>
                <li>Dynamic question generation</li>
                <li>Advanced answer evaluation</li>
              </ul>
            </div>
          )}
        </div>
      }
      type="warning"
      icon={<InfoCircleOutlined />}
      action={
        <Space>
          <Button
            size="small"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={onRetry}
          >
            Retry
          </Button>
          <Button
            size="small"
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        </Space>
      }
      closable
      onClose={onDismiss}
      style={{ marginBottom: 16 }}
    />
  );
};

export default APIStatusNotification;

