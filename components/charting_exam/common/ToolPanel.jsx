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
  padding: 6px 10px;
  border-radius: 3px;
  border: 1px solid ${props => props.$isDarkMode ? '#444' : '#eee'};
  background-color: ${props => props.$isSelected 
    ? (props.$isDarkMode ? '#2196F3' : '#4CAF50')
    : (props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')};
  color: ${props => props.$isSelected ? 'white' : (props.$isDarkMode ? '#e0e0e0' : '#333')};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 0.8rem;
  font-weight: ${props => props.$isSelected ? 'bold' : 'normal'};
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  
  &:hover {
    background-color: ${props => props.$isSelected 
      ? (props.$isDarkMode ? '#1e88e5' : '#43a047')
      : (props.$isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)')};
    color: ${props => props.$isDarkMode ? '#fff' : '#000'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ActionButton = styled.button`
  padding: 6px 10px;
  border-radius: 3px;
  border: 1px solid ${props => props.$isDarkMode ? '#444' : '#eee'};
  background-color: ${props => props.$primary 
    ? (props.$isDarkMode ? '#2196F3' : '#4CAF50') 
    : (props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')};
  color: ${props => props.$primary ? 'white' : (props.$isDarkMode ? '#e0e0e0' : '#333')};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  
  &:hover {
    background-color: ${props => props.$primary 
      ? (props.$isDarkMode ? '#1e88e5' : '#43a047') 
      : (props.$isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)')};
    color: ${props => props.$isDarkMode ? '#fff' : '#000'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ClearButton = styled.button`
  padding: 6px 10px;
  border-radius: 3px;
  border: 1px solid ${props => props.$isDarkMode ? '#444' : '#eee'};
  background-color: ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  
  &:hover {
    background-color: ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
    color: ${props => props.$isDarkMode ? '#fff' : '#000'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NoFvgsButton = styled.button`
  padding: 6px 10px;
  border-radius: 3px;
  border: 1px solid ${props => props.$isDarkMode ? '#444' : '#eee'};
  background-color: ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  
  &:hover {
    background-color: ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
    color: ${props => props.$isDarkMode ? '#fff' : '#000'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  onNoFvgsFound = null,
  actions = []
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
            disabled={tool.disabled || false}
          >
            {tool.label}
          </Tool>
        ))}
        
        {actions.map(action => (
          <ActionButton
            key={action.id}
            onClick={action.onClick}
            $primary={action.primary || false}
            $isDarkMode={isDarkMode}
            disabled={action.disabled || false}
          >
            {action.label}
          </ActionButton>
        ))}
        
        <div style={{ flexGrow: 1 }}></div>
        
        {noFvgsOption && onNoFvgsFound && (
          <NoFvgsButton
            onClick={onNoFvgsFound}
            $isDarkMode={isDarkMode}
          >
            No FVGs Found
          </NoFvgsButton>
        )}
        
        {onClearAll && (
          <ClearButton 
            onClick={onClearAll}
            $isDarkMode={isDarkMode}
          >
            Clear All
          </ClearButton>
        )}
      </ToolsContainer>
    </Panel>
  );
};

export default ToolPanel;