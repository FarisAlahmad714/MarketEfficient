import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const TimerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px 15px;
  border-radius: 8px;
  background: ${props => props.$isDarkMode ? 
    (props.$isExpiring ? '#2d1b1b' : '#1e1e1e') : 
    (props.$isExpiring ? '#fff5f5' : '#f5f5f5')};
  border: 2px solid ${props => props.$isDarkMode ?
    (props.$isExpiring ? '#d32f2f' : '#333') :
    (props.$isExpiring ? '#d32f2f' : '#ddd')};
`;

const TimerLabel = styled.span`
  font-weight: 600;
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
`;

const TimerDisplay = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  font-weight: bold;
  color: ${props => props.$isExpiring ? '#d32f2f' : 
    (props.$isDarkMode ? '#4caf50' : '#2e7d32')};
`;

const WarningText = styled.span`
  font-size: 0.9rem;
  color: #d32f2f;
  font-weight: 500;
`;

const CountdownTimer = ({ 
  timeRemaining, 
  examType, 
  onTimeExpired, 
  isDarkMode = false,
  isPaused = false  // New prop to pause timer
}) => {
  const [timeLeft, setTimeLeft] = useState(timeRemaining);
  const [isExpiring, setIsExpiring] = useState(false);

  useEffect(() => {
    setTimeLeft(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeExpired?.();
      return;
    }

    // Don't countdown if paused
    if (isPaused) {
      return;
    }

    // Set expiring warning at 30 seconds
    setIsExpiring(timeLeft <= 30);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeExpired?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeExpired, isPaused]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getExamTypeLabel = () => {
    switch (examType) {
      case 'swing': return 'Swing Analysis';
      case 'fibonacci': return 'Fibonacci';
      case 'fvg': return 'Fair Value Gaps';
      default: return 'Chart Exam';
    }
  };

  if (timeLeft <= 0) {
    return (
      <TimerContainer $isDarkMode={isDarkMode} $isExpiring={true}>
        <TimerLabel $isDarkMode={isDarkMode}>⏰ Time Expired</TimerLabel>
        <WarningText>Chart locked - moving to next chart...</WarningText>
      </TimerContainer>
    );
  }

  return (
    <TimerContainer $isDarkMode={isDarkMode} $isExpiring={isExpiring}>
      <TimerLabel $isDarkMode={isDarkMode}>
        {isPaused ? '⏸️' : '⏱️'} {getExamTypeLabel()} Time:
      </TimerLabel>
      <TimerDisplay $isDarkMode={isDarkMode} $isExpiring={isExpiring}>
        {formatTime(timeLeft)} {isPaused && '(PAUSED)'}
      </TimerDisplay>
      {isExpiring && !isPaused && (
        <WarningText>⚠️ Less than 30 seconds remaining!</WarningText>
      )}
      {isPaused && (
        <WarningText>⏸️ Timer paused - return to exam tab</WarningText>
      )}
    </TimerContainer>
  );
};

export default CountdownTimer;