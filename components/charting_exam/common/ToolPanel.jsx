// components/charting_exam/common/ToolPanel.jsx
import React from 'react';
import styled from 'styled-components';

const Panel = styled.div`
  background-color: ${props => props.$isDarkMode ? '#262626' : 'white'};
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  border: 1px solid ${props => props.$isDarkMode ? '#333' : '#eee'};
`;

const Title = styled.h3`
  margin-top: 0;
  margin-bottom: 10px;
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
`;

const Description = styled.p`
  color: ${props => props.$isDarkMode ? '#b0b0b0' : '#666'};
  margin-bottom: 15px;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const ToolsContainer = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
  align-items: center;
`;

const Tool = styled.button`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid ${props => props.$isDarkMode ? '#444' : '#ddd'};
  background-color: ${props => props.$isSelected 
    ? (props.$isDarkMode ? '#3f51b5' : '#2196F3') 
    : (props.$isDarkMode ? '#333' : '#f5f5f5')};
  color: ${props => props.$isSelected ? 'white' : (props.$isDarkMode ? '#e0e0e0' : '#333')};
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$isSelected 
      ? (props.$isDarkMode ? '#303f9f' : '#1976D2') 
      : (props.$isDarkMode ? '#444' : '#e0e0e0')};
  }
`;

const ClearButton = styled.button`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid ${props => props.$isDarkMode ? '#444' : '#ddd'};
  background-color: ${props => props.$isDarkMode ? '#333' : '#f5f5f5'};
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  cursor: pointer;
  font-size: 0.9rem;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$isDarkMode ? '#444' : '#e0e0e0'};
  }
`;

const NoFvgsButton = styled.button`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid ${props => props.$isDarkMode ? '#444' : '#ddd'};
  background-color: ${props => props.$isDarkMode ? '#333' : '#f5f5f5'};
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  cursor: pointer;
  font-size: 0.9rem;
  margin-right: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$isDarkMode ? '#444' : '#e0e0e0'};
  }
`;

const ToolPanel = ({ 
  title, 
  description, 
  selectedTool, 
  onToolSelect, 
  tools, 
  onClearAll, 
  isDarkMode,
  noFvgsOption = false, 
  onNoFvgsFound = null 
}) => {
  return (
    <Panel $isDarkMode={isDarkMode}>
      <Title $isDarkMode={isDarkMode}>{title}</Title>
      <Description $isDarkMode={isDarkMode}>{description}</Description>
      
      <ToolsContainer>
        {tools.map(tool => (
          <Tool
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            $isSelected={selectedTool === tool.id}
            $isDarkMode={isDarkMode}
          >
            <i className={`fas ${tool.icon}`}></i>
            {tool.label}
          </Tool>
        ))}
        
        <div style={{ flexGrow: 1 }}></div>
        
        {noFvgsOption && onNoFvgsFound && (
          <NoFvgsButton
            onClick={onNoFvgsFound}
            $isDarkMode={isDarkMode}
          >
            <i className="fas fa-times-circle"></i>
            No FVGs Found
          </NoFvgsButton>
        )}
        
        <ClearButton 
          onClick={onClearAll}
          $isDarkMode={isDarkMode}
        >
          <i className="fas fa-trash-alt"></i>
          Clear All
        </ClearButton>
      </ToolsContainer>
    </Panel>
  );
};

export default ToolPanel;