import React, { useState, useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaChartLine, FaDrawPolygon, FaRulerVertical } from 'react-icons/fa';

// Styled Components - Using your existing styling approach
const Container = styled.div`
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 50px;
`;

const Title = styled.h1`
  font-size: 2.8rem;
  margin-bottom: 15px;
  background: linear-gradient(90deg, #00c4ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Highlight = styled.span`
  color: rgb(193, 182, 63);
  position: relative;
  z-index: 1;
  -webkit-background-clip: initial;
  -webkit-text-fill-color: initial;
  background: none;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.darkMode ? '#b0b0b0' : '#555'};
  font-size: 1.2rem;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.7;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
`;

const Card = styled(motion.div)`
  height: 400px;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  background-color: ${props => props.theme.darkMode ? '#262626' : 'white'};
`;

const CardContent = styled.div`
  padding: 25px;
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const IconWrapper = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: white;
  margin-bottom: 20px;
  background: ${props => props.gradient};
`;

const ExamName = styled.h3`
  font-size: 1.6rem;
  color: ${props => props.theme.darkMode ? 'white' : '#333'};
  margin-bottom: 15px;
`;

const ExamType = styled.div`
  display: inline-block;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.15);
  background-color: ${props => props.theme.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
  border-radius: 25px;
  font-size: 0.9rem;
  color: ${props => props.theme.darkMode ? '#e0e0e0' : '#555'};
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
`;

const Description = styled.p`
  color: ${props => props.theme.darkMode ? '#b0b0b0' : '#666'};
  margin-bottom: 20px;
  line-height: 1.5;
  flex-grow: 1;
`;

const StartButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 25px;
  color: white;
  border-radius: 50px;
  text-decoration: none;
  font-weight: bold;
  border: none;
  cursor: pointer;
  width: 100%;
  margin-top: auto;
  background: ${props => props.gradient};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  }
`;

const ExamSelector = () => {
  const { darkMode } = useContext(ThemeContext);
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState(null);

  // Exam types definition
  const examTypes = [
    {
      id: 'swing-analysis',
      name: 'Swing Analysis',
      type: 'pattern recognition',
      description: 'Practice identifying significant swing highs and lows. These key pivot points form the foundation of market structure analysis.',
      difficulty: 'Beginner',
      icon: <FaChartLine />,
      gradient: 'linear-gradient(135deg, #4CAF50, #8BC34A)'
    },
    {
      id: 'fibonacci-retracement',
      name: 'Fibonacci Retracement',
      type: 'technical tool',
      description: 'Learn to apply Fibonacci retracement levels to identify potential support and resistance areas based on natural mathematical ratios.',
      difficulty: 'Intermediate',
      icon: <FaRulerVertical />,
      gradient: 'linear-gradient(135deg, #3F51B5, #2196F3)'
    },
    {
      id: 'fair-value-gaps',
      name: 'Fair Value Gaps',
      type: 'advanced concept',
      description: 'Discover how to spot Fair Value Gaps - areas where price makes significant moves, creating imbalances that often get filled later.',
      difficulty: 'Advanced',
      icon: <FaDrawPolygon />,
      gradient: 'linear-gradient(135deg, #FF9800, #F44336)'
    }
  ];

  const handleExamSelect = (exam) => {
    setSelectedExam(exam);
  };

  const handleStartExam = () => {
    if (selectedExam) {
      router.push(`/chart-exam/${selectedExam.id}`);
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          Chart <Highlight>Analysis</Highlight> Exams
        </Title>
        <Subtitle>
          Test and improve your technical analysis skills with interactive charting exercises
        </Subtitle>
      </Header>

      <Grid>
        {examTypes.map((exam) => (
          <Card
            key={exam.id}
            onClick={() => handleExamSelect(exam)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{
              border: selectedExam?.id === exam.id ? '2px solid #4CAF50' : '2px solid transparent'
            }}
          >
            <CardContent>
              <IconWrapper gradient={exam.gradient}>
                {exam.icon}
              </IconWrapper>
              
              <ExamName>{exam.name}</ExamName>
              
              <ExamType>
                {exam.type}
              </ExamType>
              
              <Description>{exam.description}</Description>
              
              <div style={{
                backgroundColor: exam.difficulty === 'Beginner' 
                  ? '#4CAF50' 
                  : exam.difficulty === 'Intermediate'
                    ? '#FF9800'
                    : '#F44336',
                color: 'white',
                padding: '5px 10px',
                borderRadius: '4px',
                display: 'inline-block',
                fontSize: '0.8rem',
                marginBottom: '20px'
              }}>
                {exam.difficulty}
              </div>
              
              <StartButton
                gradient={exam.gradient}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/chart-exam/${exam.id}`);
                }}
              >
                Start Exam
              </StartButton>
            </CardContent>
          </Card>
        ))}
      </Grid>
    </Container>
  );
};

export default ExamSelector;