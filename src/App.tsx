import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { store, persistor } from './store/store';
import Layout from './components/Layout';
import IntervieweeTab from './components/IntervieweeTab';
import InterviewerTab from './components/InterviewerTab';
import WelcomeBackModal from './components/WelcomeBackModal';
import { logOfflineModeStatus } from './utils/offlineMode';
import './App.css';

function App() {
  // Log offline mode status on app start
  logOfflineModeStatus();
  
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1890ff',
            },
          }}
        >
          <Router>
            <div className="App">
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/interviewee" replace />} />
                  <Route path="/interviewee" element={<IntervieweeTab />} />
                  <Route path="/interviewer" element={<InterviewerTab />} />
                </Routes>
              </Layout>
              <WelcomeBackModal />
            </div>
          </Router>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
