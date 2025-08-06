import React, { useState } from 'react';
import styled from 'styled-components';

// Styled components
const SettingsContainer = styled.div`
  margin-top: 20px;
  background-color: ${props => props.$isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(245, 245, 245, 0.95)'};
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  padding-bottom: 10px;
`;

const SettingsTitle = styled.h4`
  margin: 0;
  font-size: 1.1rem;
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LevelsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
`;

const LevelItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)'};
  border-radius: 4px;
  border: 1px solid ${props => props.$isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
  
  &:hover {
    background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.9)'};
  }
`;

const Checkbox = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 3px;
  border: 1px solid ${props => props.$isDarkMode ? '#666' : '#ccc'};
  background-color: ${props => props.checked 
    ? (props.$isDarkMode ? '#3f51b5' : '#2196F3')
    : 'transparent'
  };
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  svg {
    color: white;
    font-size: 12px;
  }
`;

const LevelLabel = styled.span`
  font-size: 0.9rem;
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  flex-grow: 1;
`;

const LevelValue = styled.span`
  font-size: 0.9rem;
  font-family: 'Roboto Mono', monospace;
  color: ${props => props.$isKey 
    ? '#F0B90B' 
    : (props.$isDarkMode ? '#b0b0b0' : '#666')
  };
  font-weight: ${props => props.$isKey ? 'bold' : 'normal'};
`;

const ColorIndicator = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: ${props => props.color};
  margin-left: 8px;
  border: 1px solid ${props => props.$isDarkMode ? '#444' : '#ddd'};
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
`;

const Button = styled.button`
  padding: 8px 15px;
  background-color: ${props => props.$primary 
    ? (props.$isDarkMode ? '#3f51b5' : '#2196F3')
    : (props.$isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)')
  };
  color: ${props => props.$primary 
    ? 'white' 
    : (props.$isDarkMode ? '#e0e0e0' : '#333')
  };
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  
  &:hover {
    background-color: ${props => props.$primary 
      ? (props.$isDarkMode ? '#303f9f' : '#1976D2')
      : (props.$isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)')
    };
  }
`;

const AddCustomForm = styled.div`
  display: ${props => props.$visible ? 'flex' : 'none'};
  margin-top: 10px;
  gap: 10px;
  align-items: center;
  background-color: ${props => props.$isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)'};
  padding: 10px;
  border-radius: 4px;
`;

const Input = styled.input`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid ${props => props.$isDarkMode ? '#444' : '#ddd'};
  background-color: ${props => props.$isDarkMode ? '#333' : '#fff'};
  color: ${props => props.$isDarkMode ? '#e0e0e0' : '#333'};
  font-size: 0.9rem;
  width: 100px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.$isDarkMode ? '#3f51b5' : '#2196F3'};
  }
  
  &::placeholder {
    color: ${props => props.$isDarkMode ? '#666' : '#aaa'};
  }
`;

// Default Fibonacci levels to match TradingView's options
const DEFAULT_FIBONACCI_LEVELS = [
  { level: 0, label: "0", visible: true, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 0.236, label: "0.236", visible: true, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 0.382, label: "0.382", visible: true, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 0.5, label: "0.5", visible: true, color: '#F0B90B', isKey: true },
  { level: 0.618, label: "0.618", visible: true, color: '#F0B90B', isKey: true },
  { level: 0.65, label: "0.65", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 0.705, label: "0.705", visible: true, color: '#F0B90B', isKey: true },
  { level: 0.786, label: "0.786", visible: true, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 1, label: "1", visible: true, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 1.27, label: "1.27", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 1.414, label: "1.414", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 1.618, label: "1.618", visible: true, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 2, label: "2", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 2.618, label: "2.618", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 3.618, label: "3.618", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false },
  { level: 4.236, label: "4.236", visible: false, color: 'rgba(255, 255, 255, 0.5)', isKey: false }
];

const FibonacciSettings = ({ isDarkMode, levels, onLevelsChange }) => {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customLevel, setCustomLevel] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  
  // Toggle level visibility
  const toggleLevel = (index) => {
    const newLevels = [...levels];
    newLevels[index] = { ...newLevels[index], visible: !newLevels[index].visible };
    onLevelsChange(newLevels);
  };
  
  // Reset to defaults
  const resetToDefaults = () => {
    onLevelsChange(DEFAULT_FIBONACCI_LEVELS);
  };
  
  // Add custom level
  const addCustomLevel = () => {
    const levelValue = parseFloat(customLevel);
    if (isNaN(levelValue) || levelValue < 0) {
      alert('Please enter a valid positive number');
      return;
    }
    
    // Check if already exists
    const exists = levels.some(level => level.level === levelValue);
    if (exists) {
      alert('This level already exists');
      return;
    }
    
    const newLevel = {
      level: levelValue,
      label: customLabel || levelValue.toString(),
      visible: true,
      color: 'rgba(255, 255, 255, 0.5)',
      isKey: false
    };
    
    // Add and sort levels
    const newLevels = [...levels, newLevel].sort((a, b) => a.level - b.level);
    onLevelsChange(newLevels);
    
    // Reset form
    setCustomLevel('');
    setCustomLabel('');
    setShowAddCustom(false);
  };
  
  return (
    <SettingsContainer $isDarkMode={isDarkMode}>
      <SettingsHeader $isDarkMode={isDarkMode}>
        <SettingsTitle $isDarkMode={isDarkMode}>
          Fibonacci Levels
        </SettingsTitle>
      </SettingsHeader>
      
      <LevelsList>
        {levels.map((level, index) => (
          <LevelItem key={index} $isDarkMode={isDarkMode}>
            <Checkbox 
              checked={level.visible} 
              $isDarkMode={isDarkMode}
              onClick={() => toggleLevel(index)}
            >
              {level.visible && '✓'}
            </Checkbox>
            <LevelLabel $isDarkMode={isDarkMode}>{level.label}</LevelLabel>
            <LevelValue 
              $isDarkMode={isDarkMode} 
              $isKey={level.isKey}
            >
              {level.level}
            </LevelValue>
            <ColorIndicator 
              color={level.color} 
              $isDarkMode={isDarkMode}
            />
          </LevelItem>
        ))}
      </LevelsList>
      
      <ButtonRow>
        <Button 
          onClick={() => setShowAddCustom(!showAddCustom)} 
          $isDarkMode={isDarkMode}
        >
          + Add Custom Level
        </Button>
        <Button 
          onClick={resetToDefaults} 
          $isDarkMode={isDarkMode}
        >
          Reset to Defaults
        </Button>
      </ButtonRow>
      
      <AddCustomForm $visible={showAddCustom} $isDarkMode={isDarkMode}>
        <Input 
          type="text" 
          placeholder="Level (e.g. 1.5)" 
          value={customLevel}
          onChange={(e) => setCustomLevel(e.target.value)}
          $isDarkMode={isDarkMode}
        />
        <Input 
          type="text" 
          placeholder="Label (optional)" 
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          $isDarkMode={isDarkMode}
        />
        <Button 
          onClick={addCustomLevel} 
          $primary 
          $isDarkMode={isDarkMode}
        >
          Add
        </Button>
        <Button 
          onClick={() => setShowAddCustom(false)} 
          $isDarkMode={isDarkMode}
        >
          ×
        </Button>
      </AddCustomForm>
    </SettingsContainer>
  );
};

export default FibonacciSettings;