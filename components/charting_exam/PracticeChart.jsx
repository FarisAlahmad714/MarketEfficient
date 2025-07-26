import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import SwingAnalysis from './SwingAnalysis';
import FibonacciRetracement from './FibonacciRetracement';
import FairValueGaps from './FairValueGaps';

const ChartWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const PracticeChart = React.forwardRef(({ 
  chartData, 
  activeTool, 
  activePart = 1,
  onDrawingUpdate, 
  existingDrawings, 
  validationResults,
  darkMode,
  height = 600
}, ref) => {
  const [currentDrawings, setCurrentDrawings] = useState({
    swings: [],
    fibonacci: [],
    fvg: []
  });
  const swingRef = useRef(null);
  
  // Forward ref methods
  React.useImperativeHandle(ref, () => ({
    clearAll: () => {
      console.log('=== PracticeChart clearAll called ===');
      console.log('Active tool in PracticeChart:', activeTool);
      console.log('SwingRef current:', swingRef.current);
      
      if (activeTool === 'swings' && swingRef.current) {
        console.log('Calling clearAll on swingRef');
        swingRef.current.clearAll();
      }
      console.log('Clearing currentDrawings state');
      setCurrentDrawings({
        swings: [],
        fibonacci: [],
        fvg: []
      });
    },
    clearFeedbackMarkers: () => {
      console.log('=== PracticeChart clearFeedbackMarkers called ===');
      if (activeTool === 'swings' && swingRef.current) {
        swingRef.current.clearFeedbackMarkers();
      }
    }
  }));

  // Handle drawing updates from child components
  const handleDrawingUpdate = (toolType, drawings) => {
    const updatedDrawings = {
      ...currentDrawings,
      [toolType]: drawings
    };
    setCurrentDrawings(updatedDrawings);
    
    if (onDrawingUpdate) {
      onDrawingUpdate(updatedDrawings[activeTool]);
    }
  };

  // Initialize with existing drawings
  useEffect(() => {
    if (existingDrawings) {
      setCurrentDrawings(prev => ({
        ...prev,
        [activeTool]: existingDrawings
      }));
    }
  }, [existingDrawings, activeTool]);

  return (
    <ChartWrapper>
      {/* Render the appropriate chart based on active tool */}
      {activeTool === 'swings' && (
        <SwingAnalysis
          ref={swingRef}
          chartData={chartData}
          onDrawingsUpdate={(drawings) => handleDrawingUpdate('swings', drawings)}
          isDarkMode={darkMode}
          chartCount={1}
          validationResults={validationResults}
          isPracticeMode={true}
        />
      )}
      
      {activeTool === 'fibonacci' && (
        <FibonacciRetracement
          chartData={chartData}
          onDrawingsUpdate={(drawings) => handleDrawingUpdate('fibonacci', drawings)}
          isDarkMode={darkMode}
          chartCount={1}
          part={activePart}
          validationResults={validationResults}
          isPracticeMode={true}
        />
      )}
      
      {activeTool === 'fvg' && (
        <FairValueGaps
          chartData={chartData}
          onDrawingsUpdate={(drawings) => handleDrawingUpdate('fvg', drawings)}
          isDarkMode={darkMode}
          chartCount={1}
          part={activePart}
          validationResults={validationResults}
          isPracticeMode={true}
          existingDrawings={existingDrawings}
        />
      )}

    </ChartWrapper>
  );
});

PracticeChart.displayName = 'PracticeChart';

export default PracticeChart;