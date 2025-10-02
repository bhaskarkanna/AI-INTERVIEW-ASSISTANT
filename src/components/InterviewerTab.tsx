import React, { useState } from 'react';
import { Card, Table, Button, Input, Select, Space, Tag, Typography, Modal, Descriptions } from 'antd';
import { SearchOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { setActiveTab } from '../store/slices/uiSlice';
import type { Candidate } from '../types';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const InterviewerTab: React.FC = () => {
  const dispatch = useDispatch();
  const candidates = useSelector((state: RootState) => state.candidates.candidates);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  React.useEffect(() => {
    dispatch(setActiveTab('interviewer'));
  }, [dispatch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'default';
      case 'in_progress': return 'processing';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const filteredCandidates = candidates.filter((candidate: Candidate) => {
    const matchesSearch = 
      candidate.name.toLowerCase().includes(searchText.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || candidate.interviewStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    // Sort by completion status first, then by score
    if (a.interviewStatus === 'completed' && b.interviewStatus !== 'completed') return -1;
    if (b.interviewStatus === 'completed' && a.interviewStatus !== 'completed') return 1;
    
    if (a.finalScore && b.finalScore) {
      return b.finalScore - a.finalScore;
    }
    
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleViewDetails = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'Candidate',
      key: 'candidate',
      render: (record: Candidate) => (
        <Space>
          <UserOutlined />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'interviewStatus',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'finalScore',
      key: 'score',
      render: (score: number) => (
        score ? (
          <Tag color={getScoreColor(score)}>
            {score}/100
          </Tag>
        ) : (
          <Tag color="default">-</Tag>
        )
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (record: Candidate) => (
        <div>
          {record.questions.length > 0 ? (
            `${record.currentQuestionIndex + 1}/${record.questions.length} questions`
          ) : (
            'Not started'
          )}
        </div>
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: Date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Candidate) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Title level={3} style={{ marginBottom: '24px' }}>
          Interview Dashboard
        </Title>

        <Space style={{ marginBottom: '16px', width: '100%' }} direction="vertical" size="middle">
          <Space wrap>
            <Search
              placeholder="Search candidates..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Option value="all">All Status</Option>
              <Option value="not_started">Not Started</Option>
              <Option value="in_progress">In Progress</Option>
              <Option value="completed">Completed</Option>
            </Select>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={sortedCandidates}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} candidates`,
          }}
        />

        <Modal
          title={`Candidate Details - ${selectedCandidate?.name}`}
          open={isDetailModalVisible}
          onCancel={() => setIsDetailModalVisible(false)}
          footer={null}
          width={800}
        >
          {selectedCandidate && (
            <div>
              <Descriptions bordered column={2} style={{ marginBottom: '24px' }}>
                <Descriptions.Item label="Name">{selectedCandidate.name}</Descriptions.Item>
                <Descriptions.Item label="Email">{selectedCandidate.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedCandidate.phone}</Descriptions.Item>
                <Descriptions.Item label="Resume File">{selectedCandidate.resumeFileName || 'No file'}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(selectedCandidate.interviewStatus)}>
                    {getStatusText(selectedCandidate.interviewStatus)}
                  </Tag>
                </Descriptions.Item>
                {selectedCandidate.finalScore && (
                  <>
                    <Descriptions.Item label="Final Score">
                      <Tag color={getScoreColor(selectedCandidate.finalScore)}>
                        {selectedCandidate.finalScore}/100
                      </Tag>
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>

              {selectedCandidate.questions.length > 0 && (
                <div>
                  <Title level={4}>Interview Questions & Answers</Title>
                  {selectedCandidate.questions.map((question: any, index: number) => {
                    const answer = selectedCandidate.answers.find((a: any) => a.questionId === question.id);
                    return (
                      <Card key={question.id} style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <Tag color={question.difficulty === 'easy' ? 'green' : question.difficulty === 'medium' ? 'orange' : 'red'}>
                            {question.difficulty.toUpperCase()}
                          </Tag>
                          <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                            Question {index + 1}
                          </span>
                        </div>
                        <p style={{ marginBottom: '12px' }}>{question.text}</p>
                        {answer ? (
                          <div>
                            <strong>Answer:</strong>
                            <p style={{ marginTop: '4px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                              {answer.text}
                            </p>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                              Time spent: {answer.timeSpent}s | Submitted: {new Date(answer.submittedAt).toLocaleString()}
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: '#999', fontStyle: 'italic' }}>
                            No answer provided
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}

              {selectedCandidate.aiSummary && (
                <div>
                  <Title level={4}>AI Summary</Title>
                  <Card>
                    <p>{selectedCandidate.aiSummary}</p>
                  </Card>
                </div>
              )}
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default InterviewerTab;
