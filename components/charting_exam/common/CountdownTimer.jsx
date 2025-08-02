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
  const [hasPlayed1MinuteSound, setHasPlayed1MinuteSound] = useState(false);
  const [hasPlayed30SecondSound, setHasPlayed30SecondSound] = useState(false);

  useEffect(() => {
    setTimeLeft(timeRemaining);
    setHasPlayed1MinuteSound(false); // Reset 1 minute sound when time resets
    setHasPlayed30SecondSound(false); // Reset 30 second sound when time resets
  }, [timeRemaining]);

  // Sound notification function
  const playWarningSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const playBeep = (frequency, duration, delay = 0) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        }, delay);
      };
      
      // Play warning sound pattern (three beeps)
      playBeep(800, 0.2, 0);    // High beep
      playBeep(800, 0.2, 300);  // High beep
      playBeep(800, 0.3, 600);  // High beep (longer)
      
    } catch (error) {
      console.log('Audio not supported, trying vibration fallback');
      // Fallback: try to vibrate on mobile
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }
    }
  };

  // Handle timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || isPaused) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);
  
  // Call onTimeExpired when timeLeft reaches 0
  useEffect(() => {
    if (timeLeft === 0 && onTimeExpired) {
      onTimeExpired();
    }
  }, [timeLeft, onTimeExpired]);

  // Handle warnings and sounds separately
  useEffect(() => {
    if (timeLeft <= 0) {
      return;
    }

    // Set expiring warning at 30 seconds
    setIsExpiring(timeLeft <= 30);

    // Play warning sound at 1 minute (60 seconds) remaining
    if (timeLeft === 60 && !hasPlayed1MinuteSound && !isPaused) {
      playWarningSound();
      setHasPlayed1MinuteSound(true);
    }

    // Play warning sound at 30 seconds remaining
    if (timeLeft === 30 && !hasPlayed30SecondSound && !isPaused) {
      playWarningSound();
      setHasPlayed30SecondSound(true);
    }
  }, [timeLeft, isPaused, hasPlayed1MinuteSound, hasPlayed30SecondSound]);

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