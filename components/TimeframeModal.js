// components/TimeframeModal.js
import React from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: ${props => props.isDarkMode ? '#1a1a2e' : 'white'};
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 5px 25px rgba(0, 0, 0, ${props => props.isDarkMode ? '0.4' : '0.25'});
  transition: background-color 0.3s ease;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid ${props => props.isDarkMode ? '#2a2a3a' : '#eee'};
  transition: border-color 0.3s ease;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.isDarkMode ? '#e1e1e1' : 'inherit'};
  transition: color 0.3s ease;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: ${props => props.isDarkMode ? '#b0b0b0' : '#666'};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: background 0.2s ease, color 0.3s ease;

  &:hover {
    background: ${props => props.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5'};
    color: ${props => props.isDarkMode ? '#fff' : '#333'};
  }
`;

const TimeframeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 25px;
`;

const TimeframeCard = styled.div`
  background: ${props => props.isDarkMode ? '#242438' : '#f9f9fa'};
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  
  &:hover {
    background: ${props => props.isDarkMode ? '#2e2e48' : '#f0f4fa'};
    transform: translateY(-3px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, ${props => props.isDarkMode ? '0.2' : '0.08'});
    border-color: #2196F3;
  }
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.2) 100%);
  border-radius: 50%;
  margin: 0 auto 20px;
`;

const TimeframeTitle = styled.h3`
  margin: 0 0 12px 0;
  font-weight: 600;
  color: ${props => props.isDarkMode ? '#e1e1e1' : '#333'};
  transition: color 0.3s ease;
`;

const TimeframeDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${props => props.isDarkMode ? '#b0b0b0' : '#666'};
  line-height: 1.5;
  transition: color 0.3s ease;
`;

const TimeframeModal = ({ assetName, onSelect, onClose, isDarkMode }) => {
  const timeframes = [
    {
      id: 'random',
      name: 'Mixed Timeframes',
      description: 'Test across different timeframes',
      icon: 'fa-random'
    },
    {
      id: '4h',
      name: '4-Hour Charts',
      description: 'Short-term price action',
      icon: 'fa-clock'
    },
    {
      id: 'daily',
      name: 'Daily Charts',
      description: 'Standard daily price action',
      icon: 'fa-calendar-day'
    },
    {
      id: 'weekly',
      name: 'Weekly Charts',
      description: 'Medium-term price action',
      icon: 'fa-calendar-week'
    },
    {
      id: 'monthly',
      name: 'Monthly Charts',
      description: 'Long-term price action',
      icon: 'fa-calendar-alt'
    }
  ];

  return (
    <ModalOverlay>
      <ModalContainer isDarkMode={isDarkMode}>
        <ModalHeader isDarkMode={isDarkMode}>
          <ModalTitle isDarkMode={isDarkMode}>
            Select Timeframe for {assetName}
          </ModalTitle>
          <CloseButton 
            onClick={onClose}
            isDarkMode={isDarkMode}
            aria-label="Close modal"
          >
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        <TimeframeGrid>
          {timeframes.map(timeframe => (
            <TimeframeCard 
              key={timeframe.id}
              onClick={() => onSelect(timeframe.id)}
              isDarkMode={isDarkMode}
            >
              <IconContainer>
                <i 
                  className={`fas ${timeframe.icon}`} 
                  style={{ 
                    fontSize: '28px', 
                    color: '#2196F3',
                    filter: 'drop-shadow(0 2px 3px rgba(33, 150, 243, 0.3))'
                  }}
                ></i>
              </IconContainer>
              <TimeframeTitle isDarkMode={isDarkMode}>
                {timeframe.name}
              </TimeframeTitle>
              <TimeframeDescription isDarkMode={isDarkMode}>
                {timeframe.description}
              </TimeframeDescription>
            </TimeframeCard>
          ))}
        </TimeframeGrid>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default TimeframeModal;