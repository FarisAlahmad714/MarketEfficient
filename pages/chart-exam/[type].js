import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ChartExam from '../../components/charting-exam/ChartExam';
import { useTheme } from '../../contexts/ThemeContext';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: ${props => props.theme.darkMode ? '#121212' : '#f5f5f5'};
  color: ${props => props.theme.darkMode ? '#e0e0e0' : '#333'};
`;

const Spinner = styled.div`
  border: 4px solid ${props => props.theme.darkMode ? '#333' : '#f3f3f3'};
  border-top: 4px solid ${props => props.theme.darkMode ? '#3f51b5' : '#2196F3'};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-right: 15px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ChartExamPage = () => {
  const router = useRouter();
  const { type } = router.query;
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (type) {
      setLoading(false);
    }
  }, [type]);
  
  if (loading) {
    return (
      <LoadingContainer>
        <Spinner />
        <div>Loading exam...</div>
      </LoadingContainer>
    );
  }
  
  // Valid exam types
  const validTypes = ['swing-analysis', 'fibonacci-retracement', 'fair-value-gaps'];
  
  if (!validTypes.includes(type)) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: darkMode ? '#121212' : '#f5f5f5',
        color: darkMode ? '#e0e0e0' : '#333',
        minHeight: '100vh'
      }}>
        <h1>Invalid Exam Type</h1>
        <p>The requested exam type does not exist.</p>
        <button
          onClick={() => router.push('/charting-exams')}
          style={{
            padding: '10px 20px',
            backgroundColor: darkMode ? '#3f51b5' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Return to Exam Selection
        </button>
      </div>
    );
  }
  
  return <ChartExam examType={type} />;
};

export default ChartExamPage;