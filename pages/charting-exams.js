import ExamSelector from '../components/charting-exam/ExamSelector';
import { useTheme } from '../contexts/ThemeContext';
import styled from 'styled-components';

const PageContainer = styled.div`
  background-color: ${props => props.theme.darkMode ? '#121212' : '#f5f5f5'};
  min-height: 100vh;
  transition: background-color 0.3s ease;
`;

const ChartingExams = () => {
  const { darkMode } = useTheme();
  
  return (
    <PageContainer>
      <ExamSelector />
    </PageContainer>
  );
};

export default ChartingExams;