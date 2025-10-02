import React, { useEffect, useState } from 'react';
import { Progress, Typography, Space } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TimerProps {
  timeRemaining: number;
  onTimeUp: () => void;
  isPaused: boolean;
}

const Timer: React.FC<TimerProps> = ({ timeRemaining, onTimeUp, isPaused }) => {
  const [displayTime, setDisplayTime] = useState(timeRemaining);
  const [initialTime, setInitialTime] = useState(timeRemaining);

  useEffect(() => {
    setInitialTime(timeRemaining);
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (isPaused || displayTime <= 0) return;

    const timer = setInterval(() => {
      setDisplayTime(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, displayTime]);

  // Separate effect to handle time up
  useEffect(() => {
    if (displayTime === 0 && !isPaused) {
      onTimeUp();
    }
  }, [displayTime, isPaused, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    const percentage = (displayTime / initialTime) * 100;
    if (percentage > 50) return '#52c41a';
    if (percentage > 25) return '#faad14';
    return '#ff4d4f';
  };

  const getStatus = () => {
    if (isPaused) return 'normal';
    if (displayTime <= 10) return 'exception';
    return 'active';
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space>
          <ClockCircleOutlined />
          <Text strong style={{ fontSize: '16px' }}>
            {formatTime(displayTime)}
          </Text>
        </Space>
        
        <Progress
          percent={(displayTime / initialTime) * 100}
          strokeColor={getProgressColor()}
          status={getStatus()}
          showInfo={false}
          style={{ width: '100%' }}
        />
        
        {isPaused && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Timer paused
          </Text>
        )}
        
        {displayTime <= 10 && !isPaused && (
          <Text type="danger" style={{ fontSize: '12px' }}>
            Time running out!
          </Text>
        )}
      </Space>
    </div>
  );
};

export default Timer;
