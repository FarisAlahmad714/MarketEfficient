import React from 'react';
import styled from 'styled-components';

const ProgressContainer = styled.div`
  margin-bottom: 20px;
`;

const ChartIndicator = styled.span`
  font-size: 1.2rem;
  margin-right: 10px;
  color: ${props => props.theme.darkMode ? '#e0e0e0' : '#333'};
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 10px;
  background: ${props => props.theme.darkMode ? '#333' : '#ddd'};
  border-radius: 5px;
  overflow: hidden;
  margin-top: 5px;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: #4CAF50;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

const PartIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  margin-left: 15px;
  background: ${props => props.active
    ? (props.theme.darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)')
    : (props.theme.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')
  };
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.9rem;
  color: ${props => props.active
    ? '#4CAF50'
    : (props.theme.darkMode ? '#b0b0b0' : '#666')
  };
`;

const ExamProgress = ({ chartCount, maxCharts = 5, part = 1, hasParts = false }) => {
  const progress = (chartCount / maxCharts) * 100;
  
  return (
    <ProgressContainer>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <ChartIndicator>
          Chart {chartCount}/{maxCharts}
        </ChartIndicator>
        
        {hasParts && (
          <>
            <PartIndicator active={part === 1}>
              Part 1
            </PartIndicator>
            <PartIndicator active={part === 2}>
              Part 2
            </PartIndicator>
          </>
        )}
      </div>
      
      <ProgressBarContainer>
        <ProgressBar progress={progress} />
      </ProgressBarContainer>
    </ProgressContainer>
  );
};

export default ExamProgress;