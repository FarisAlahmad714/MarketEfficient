import ExamSelector from '../components/charting_exam/ExamSelector';
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import styled from 'styled-components';

// Define styled components with proper props handling
const PageContainer = styled.div`
  background-color: ${props => props.$darkMode ? '#121212' : '#f5f5f5'};
  min-height: 100vh;
  transition: background-color 0.3s ease;
`;

const ChartingExams = () => {
  // Only use hooks inside the function component
  const { darkMode } = useContext(ThemeContext);  
  
  return (
    <PageContainer $darkMode={darkMode}>
      <ExamSelector />
    </PageContainer>
  );
};

export default ChartingExams;