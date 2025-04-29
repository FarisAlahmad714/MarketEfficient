// pages/index.js
import Link from 'next/link';
import { useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../contexts/ThemeContext';
import { FaChartLine, FaLaptopCode } from 'react-icons/fa';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 50px;
  font-size: 2.8rem;
  background: linear-gradient(90deg, #00c4ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
`;

const Card = styled.div`
  background-color: ${props => props.isDarkMode ? '#242438' : '#f8f9fa'};
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, ${props => props.isDarkMode ? '0.3' : '0.1'});
  transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, ${props => props.isDarkMode ? '0.4' : '0.15'});
  }
`;

const CardTitle = styled.h2`
  color: ${props => props.isDarkMode ? '#e1e1e1' : '#333'};
  margin-bottom: 15px;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: color 0.3s ease;
`;

const CardDescription = styled.p`
  color: ${props => props.isDarkMode ? '#b0b0b0' : '#555'};
  margin-bottom: 25px;
  line-height: 1.6;
  font-size: 1.1rem;
  transition: color 0.3s ease;
`;

const StyledLink = styled.a`
  display: inline-block;
  padding: 12px 24px;
  background: ${props => props.color};
  color: white;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
    filter: brightness(1.1);
  }
`;

const IconWrapper = styled.div`
  background: ${props => props.color};
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  font-size: 1.8rem;
  color: white;
  box-shadow: 0 5px 15px ${props => `${props.color}50`};
`;

export default function HomePage() {
  const { isDarkMode } = useTheme();

  return (
    <Container>
      <Title>Trading Analysis Platform</Title>

      <Grid>
        <Card isDarkMode={isDarkMode}>
          <IconWrapper color="#4CAF50">
            <FaChartLine />
          </IconWrapper>
          <CardTitle isDarkMode={isDarkMode}>
            Daily Bias Test
          </CardTitle>
          <CardDescription isDarkMode={isDarkMode}>
            Test your ability to predict market direction based on historical price data. Improve your trading intuition with regular practice.
          </CardDescription>
          <Link href="/bias-test" passHref>
            <StyledLink color="linear-gradient(135deg, #4CAF50, #2E7D32)">
              Start Testing
            </StyledLink>
          </Link>
        </Card>

        <Card isDarkMode={isDarkMode}>
          <IconWrapper color="#2196F3">
            <FaLaptopCode />
          </IconWrapper>
          <CardTitle isDarkMode={isDarkMode}>
            Charting Exams
          </CardTitle>
          <CardDescription isDarkMode={isDarkMode}>
            Practice technical analysis with interactive charting exercises. Learn to identify patterns and improve your analysis skills.
          </CardDescription>
          <Link href="/charting-exam" passHref>
            <StyledLink color="linear-gradient(135deg, #2196F3, #0D47A1)">
              Start Learning
            </StyledLink>
          </Link>
        </Card>
      </Grid>
    </Container>
  );
}