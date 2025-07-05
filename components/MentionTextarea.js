import React, { useState, useRef, useEffect } from 'react';
import storage from '../lib/storage';

const MentionTextarea = ({ 
  value, 
  onChange, 
  onMentionsChange,
  placeholder = 'Write a comment...',
  style = {},
  darkMode = false
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentions, setMentions] = useState([]);
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);

  const handleTextChange = (e) => {
    const text = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(text);
    
    // Check for @ mentions
    const lastAtIndex = text.lastIndexOf('@', cursorPosition - 1);
    
    if (lastAtIndex !== -1) {
      const textAfterAt = text.substring(lastAtIndex + 1, cursorPosition);
      const hasSpaceAfterAt = textAfterAt.includes(' ');
      
      if (!hasSpaceAfterAt && textAfterAt.length >= 0) {
        setMentionStart(lastAtIndex);
        setMentionQuery(textAfterAt);
        setSelectedIndex(0);
        
        if (textAfterAt.length >= 1) {
          searchUsers(textAfterAt);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const searchUsers = async (query) => {
    try {
      const token = await storage.getItem('auth_token');
      
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.users || []);
        setShowSuggestions(data.users && data.users.length > 0);
      }
    } catch (error) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const insertMention = (user) => {
    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(textareaRef.current.selectionStart);
    const newText = `${beforeMention}@${user.username} ${afterMention}`;
    
    onChange(newText);
    
    // Add to mentions array
    const newMentions = [...mentions];
    const existingMentionIndex = newMentions.findIndex(m => m.userId === user._id);
    
    if (existingMentionIndex === -1) {
      newMentions.push({
        userId: user._id,
        username: user.username
      });
      setMentions(newMentions);
      onMentionsChange && onMentionsChange(newMentions);
    }
    
    setShowSuggestions(false);
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStart + user.username.length + 2; // +2 for @ and space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev === 0 ? suggestions.length - 1 : prev - 1);
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (suggestions[selectedIndex]) {
            insertMention(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    }
  };

  // Clear mentions when text changes to remove deleted mentions
  useEffect(() => {
    const currentMentions = mentions.filter(mention => 
      value.includes(`@${mention.username}`)
    );
    
    if (currentMentions.length !== mentions.length) {
      setMentions(currentMentions);
      onMentionsChange && onMentionsChange(currentMentions);
    }
  }, [value]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
          borderRadius: '8px',
          fontSize: '14px',
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          color: darkMode ? '#e0e0e0' : '#333',
          resize: 'vertical',
          minHeight: '60px',
          outline: 'none',
          ...style
        }}
      />
      
      {/* Mention Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
            borderRadius: '8px',
            boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          {suggestions.map((user, index) => (
            <div
              key={user._id}
              onClick={() => insertMention(user)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: index === selectedIndex 
                  ? (darkMode ? '#333' : '#f0f0f0') 
                  : 'transparent',
                borderBottom: index < suggestions.length - 1 
                  ? `1px solid ${darkMode ? '#333' : '#f0f0f0'}` 
                  : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: darkMode ? '#444' : '#ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{
                  fontWeight: '600',
                  fontSize: '14px',
                  color: darkMode ? '#e0e0e0' : '#333'
                }}>
                  {user.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: darkMode ? '#888' : '#666'
                }}>
                  @{user.username}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Show current mentions */}
      {mentions.length > 0 && (
        <div style={{
          marginTop: '8px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px'
        }}>
          {mentions.map(mention => (
            <span
              key={mention.userId}
              style={{
                backgroundColor: darkMode ? '#333' : '#e3f2fd',
                color: darkMode ? '#90CAF9' : '#1976D2',
                padding: '2px 6px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              @{mention.username}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionTextarea;