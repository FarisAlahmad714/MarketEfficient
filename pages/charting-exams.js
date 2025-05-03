import ExamSelector from '../components/charting_exam/ExamSelector';
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
const { darkMode } = useContext(ThemeContext);

const PageContainer = styled.div`
  background-color: ${props => props.theme.darkMode ? '#121212' : '#f5f5f5'};
  min-height: 100vh;
  transition: background-color 0.3s ease;
`;

const ChartingExams = () => {
    const { darkMode } = useContext(ThemeContext);  
  return (
    <PageContainer>
      <ExamSelector />
    </PageContainer>
  );
};

export default ChartingExams;