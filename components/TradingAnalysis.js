// components/TradingAnalysis.js
import React, { useState, useContext, useRef } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import html2canvas from 'html2canvas';
import AppModal from './common/AppModal';
import { useModal } from '../lib/useModal';

const TradingAnalysis = ({ chartData, prediction, questionId }) => {
  const [userReasoning, setUserReasoning] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisInput, setShowAnalysisInput] = useState(false);
  const { darkMode } = useContext(ThemeContext);
  const chartRef = useRef(null);
  const { isOpen: modalOpen, modalProps, hideModal, showAlert } = useModal();

  const handleAnalysis = async () => {
    if (!userReasoning.trim()) {
      showAlert('Please explain your reasoning first.', 'Missing Reasoning', 'warning');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Capture chart screenshot if available - this will work with GPT-4o's vision capabilities
      let chartImage = null;
      const chartElement = document.getElementById(`chart-${questionId}`);
      
      if (chartElement) {
        try {
          const canvas = await html2canvas(chartElement);
          chartImage = canvas.toDataURL('image/png');
        } catch (err) {
        }
      }
      
      // Send data to the API
      const response = await fetch('/api/analyze-trading-gpt4o', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chartData: chartData,
          chartImage: chartImage,
          prediction: prediction,
          reasoning: userReasoning
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze trading decision');
      }
      
      const data = await response.json();
      setAiResponse(data.analysis);
    } catch (error) {
      setAiResponse('Sorry, there was an error analyzing your trading decision. Please try again later.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{
      marginTop: '20px',
      padding: '15px',
      backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa',
      borderRadius: '8px',
      transition: 'all 0.3s ease'
    }}>
      {!showAnalysisInput && !aiResponse ? (
        <button
          onClick={() => setShowAnalysisInput(true)}
          style={{
            padding: '10px 15px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 auto'
          }}
        >
          <i className="fas fa-robot"></i>
          Analyze My Decision with AI
        </button>
      ) : null}

      {showAnalysisInput && !aiResponse ? (
        <div>
          <h3 style={{ 
            fontSize: '16px', 
            marginBottom: '10px',
            color: darkMode ? '#e0e0e0' : '#333'
          }}>
            Why did you choose {prediction}?
          </h3>
          
          <textarea
            value={userReasoning}
            onChange={(e) => setUserReasoning(e.target.value)}
            placeholder="Explain your analysis and reasoning..."
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
              backgroundColor: darkMode ? '#333' : 'white',
              color: darkMode ? '#e0e0e0' : '#333',
              height: '100px',
              resize: 'vertical',
              marginBottom: '15px'
            }}
          />
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowAnalysisInput(false)}
              style={{
                padding: '8px 15px',
                backgroundColor: darkMode ? '#555' : '#e0e0e0',
                color: darkMode ? '#e0e0e0' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={handleAnalysis}
              disabled={isAnalyzing}
              style={{
                padding: '8px 15px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isAnalyzing ? 'default' : 'pointer',
                opacity: isAnalyzing ? 0.7 : 1
              }}
            >
              {isAnalyzing ? 'Analyzing...' : 'Get Analysis'}
            </button>
          </div>
        </div>
      ) : null}

      {aiResponse && (
        <div style={{
          backgroundColor: darkMode ? '#262626' : 'white',
          padding: '15px',
          borderRadius: '8px',
          border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`,
          marginTop: '15px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#2196F3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '10px'
            }}>
              <i className="fas fa-robot" style={{ color: 'white' }}></i>
            </div>
            <h3 style={{ 
              margin: 0,
              fontSize: '16px',
              color: darkMode ? '#e0e0e0' : '#333'
            }}>
              Trading Analysis
            </h3>
          </div>
          
          <div style={{
            whiteSpace: 'pre-line',
            lineHeight: '1.5',
            color: darkMode ? '#b0b0b0' : '#555'
          }}>
            {aiResponse}
          </div>
          
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={() => {
                setAiResponse(null);
                setShowAnalysisInput(false);
                setUserReasoning('');
              }}
              style={{
                padding: '8px 15px',
                backgroundColor: darkMode ? '#333' : '#f5f5f5',
                color: darkMode ? '#e0e0e0' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Close Analysis
            </button>
          </div>
        </div>
      )}

      <AppModal
        isOpen={modalOpen}
        onClose={hideModal}
        {...modalProps}
      />
    </div>
  );
};

export default TradingAnalysis;