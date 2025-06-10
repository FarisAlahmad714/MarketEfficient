import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
`;

const ModalContent = styled.div`
  background: ${props => props.$isDarkMode ? '#1e1e1e' : 'white'};
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  max-width: 500px;
  border: 3px solid #d32f2f;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const WarningTitle = styled.h2`
  color: #d32f2f;
  margin-bottom: 15px;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const WarningText = styled.p`
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  margin-bottom: 20px;
  line-height: 1.6;
  font-size: 1.1rem;
`;

const CountdownDisplay = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #d32f2f;
  margin: 20px 0;
  font-family: 'Courier New', monospace;
`;

const ReturnButton = styled.button`
  background: #d32f2f;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #b71c1c;
    transform: translateY(-1px);
  }
`;

const FocusWarningModal = ({ 
  isVisible, 
  onReturn, 
  onTimeout, 
  isDarkMode = false,
  warningSeconds = 60 
}) => {
  const [timeLeft, setTimeLeft] = useState(warningSeconds);

  useEffect(() => {
    if (!isVisible) {
      setTimeLeft(warningSeconds);
      return;
    }

    if (timeLeft <= 0) {
      onTimeout?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, timeLeft, onTimeout, warningSeconds]);

  const handleReturnClick = () => {
    onReturn?.();
  };

  if (!isVisible) return null;

  return (
    <ModalOverlay>
      <ModalContent $isDarkMode={isDarkMode}>
        <WarningTitle>
          ⚠️ Exam Focus Required
        </WarningTitle>
        
        <WarningText $isDarkMode={isDarkMode}>
          You've switched away from the exam tab/browser. 
          <br />
          <strong>Your timer is paused</strong> but you must return within the time limit 
          or your exam progress will be reset.
        </WarningText>
        
        <WarningText $isDarkMode={isDarkMode}>
          <strong>Return to exam within:</strong>
        </WarningText>
        
        <CountdownDisplay>
          {timeLeft}s
        </CountdownDisplay>
        
        <WarningText $isDarkMode={isDarkMode}>
          Click the button below when you're ready to continue.
        </WarningText>
        
        <ReturnButton onClick={handleReturnClick}>
          Return to Exam
        </ReturnButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default FocusWarningModal;