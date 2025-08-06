import React, { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { useTheme } from '../../contexts/ThemeContext';
import { createMediaPlaceholder, trackMediaInteraction, checkMediaExists } from '../../lib/tourMedia';
import { debugTour, listAvailableElements } from './TourDebugger';

const GlobalOverlayStyle = createGlobalStyle`
  .guided-tour-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.75);
    z-index: 2147483645 !important;
    pointer-events: none;
  }
  
  .guided-tour-highlight {
    position: absolute;
    border-radius: 8px;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.8),
                0 0 0 9999px rgba(0, 0, 0, 0.75);
    pointer-events: auto;
    z-index: 2147483646 !important;
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const TourModal = styled.div`
  position: fixed;
  z-index: 2147483647 !important; /* Maximum z-index value */
  background: ${({ $darkMode }) => $darkMode ? '#1a1a1a' : '#ffffff'};
  border: 1px solid ${({ $darkMode }) => $darkMode ? '#333' : '#e0e0e0'};
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90vw;
  max-height: 60vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 
              0 10px 10px -5px rgba(0, 0, 0, 0.3);
  animation: ${slideIn} 0.3s ease-out;
  backdrop-filter: blur(16px);
  
  ${props => props.$position && `
    top: ${props.$position.top}px !important;
    left: ${props.$position.left}px !important;
    transform: none !important;
  `}

  /* Accessibility improvements */
  &:focus-within {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  
  @media (max-width: 768px) {
    max-width: 350px;
    padding: 20px;
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    max-height: 90vh;
    overflow-y: auto;
  }
`;

const TourHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const TourTitle = styled.h3`
  color: ${({ $darkMode }) => $darkMode ? '#ffffff' : '#1a1a1a'};
  font-size: 18px;
  font-weight: 600;
  margin: 0;
`;

const StepCounter = styled.span`
  color: ${({ $darkMode }) => $darkMode ? '#b0b0b0' : '#666'};
  font-size: 14px;
  background: ${({ $darkMode }) => $darkMode ? '#333' : '#f5f5f5'};
  padding: 4px 8px;
  border-radius: 4px;
`;

const TourContent = styled.div`
  margin-bottom: 20px;
`;

const TourDescription = styled.p`
  color: ${({ $darkMode }) => $darkMode ? '#e0e0e0' : '#333'};
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 16px 0;
`;

const MediaContainer = styled.div`
  width: 100%;
  height: ${({ $hasMedia }) => $hasMedia ? '200px' : '0'};
  background: ${({ $darkMode }) => $darkMode ? '#2a2a2a' : '#f5f5f5'};
  border-radius: 8px;
  display: ${({ $hasMedia }) => $hasMedia ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ $hasMedia }) => $hasMedia ? '16px' : '0'};
  overflow: hidden;
  position: relative;
`;

const MediaPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: ${({ $darkMode }) => $darkMode ? '#b0b0b0' : '#666'};
  text-align: center;
`;

const MediaElement = styled.div`
  width: 100%;
  height: 100%;
  
  img, video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }
  
  video {
    cursor: pointer;
  }
`;

const PlayButton = styled.button`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: translate(-50%, -50%) scale(1.1);
  }
  
  &::after {
    content: '';
    width: 0;
    height: 0;
    border-left: 12px solid white;
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
    margin-left: 2px;
  }
`;

const TourActions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
`;

const TourButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'primary' ? `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  ` : props.$variant === 'secondary' ? `
    background: ${props.$darkMode ? '#333' : '#f5f5f5'};
    color: ${props.$darkMode ? '#ffffff' : '#1a1a1a'};
    
    &:hover {
      background: ${props.$darkMode ? '#404040' : '#e5e5e5'};
    }
  ` : `
    background: transparent;
    color: ${props.$darkMode ? '#b0b0b0' : '#666'};
    
    &:hover {
      color: ${props.$darkMode ? '#ffffff' : '#1a1a1a'};
    }
  `}
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: ${({ $darkMode }) => $darkMode ? '#333' : '#e0e0e0'};
  border-radius: 2px;
  margin-bottom: 16px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.3s ease;
  width: ${props => props.$progress}%;
`;

export const GuidedTour = ({ 
  steps, 
  isOpen, 
  onComplete, 
  onSkip,
  tourId = 'default-tour'
}) => {
  const { darkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [modalPosition, setModalPosition] = useState({ top: 100, left: 100 });
  const tourRef = useRef();

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    if (!isOpen || !currentStepData) return;

    const updateHighlight = () => {
      if (currentStepData.targetSelector) {
        // Try to find the element, with fallback selectors for common cases
        let element = document.querySelector(currentStepData.targetSelector);
        
        // Fallback selectors for known problematic elements
        if (!element && currentStepData.targetSelector === '.prediction-buttons') {
          element = document.querySelector('div[class*="prediction-buttons"]');
        }
        
        if (!element && currentStepData.targetSelector === '.chart-container') {
          element = document.querySelector('div[class*="chart-container"]');
        }
        
        // Debug logging
        debugTour(currentStepData, element);
        
        if (element) {
          // Only scroll into view if NOT forcing center positioning
          if (!currentStepData.forceCenter) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }
          
          // Small delay to allow scroll to complete (if any), then position everything
          setTimeout(() => {
            const rect = element.getBoundingClientRect();
            setHighlightedElement({
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width,
              height: rect.height
            });
            
            // Position modal relative to highlighted element
            const modalWidth = 400;
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const modalHeight = Math.min(450, viewportHeight * 0.6); // Max 60% of viewport height for better visibility
            const scrollTop = window.scrollY;
            const padding = 20;
            
            // Calculate available space in each direction
            const spaceBelow = viewportHeight - (rect.bottom - scrollTop);
            const spaceAbove = rect.top - scrollTop;
            const spaceRight = viewportWidth - rect.right;
            const spaceLeft = rect.left;
            
            // Check if we're on mobile
            const isMobile = viewportWidth <= 768;
            
            let modalTop, modalLeft;
            
            // For mobile or forceCenter flag, always center the modal
            if (isMobile || currentStepData.forceCenter) {
              // Get CURRENT scroll position (not after scrollIntoView)
              const currentScroll = window.scrollY;
              
              // More conservative centering - place modal in upper third of viewport
              // This ensures it's always visible even on smaller viewports
              modalTop = currentScroll + (viewportHeight * 0.2); // 20% from top
              modalLeft = (viewportWidth / 2) - (modalWidth / 2);
              
              // Ensure it's within bounds
              modalTop = Math.max(currentScroll + padding, modalTop);
              modalLeft = Math.max(padding, modalLeft);
              
              // Debug logging
              console.log('Force center modal position:', {
                step: currentStep,
                title: currentStepData.title,
                modalTop,
                modalLeft,
                currentScroll,
                viewportHeight,
                modalHeight,
                windowInnerHeight: window.innerHeight,
                documentHeight: document.documentElement.clientHeight
              });
            } else {
              // Determine vertical position for desktop
              if (spaceBelow >= modalHeight + padding) {
                // Enough space below
                modalTop = rect.bottom + window.scrollY + 16;
              } else if (spaceAbove >= modalHeight + padding) {
                // Enough space above
                modalTop = rect.top + window.scrollY - modalHeight - 16;
              } else {
                // Not enough space above or below, center in viewport
                modalTop = scrollTop + (viewportHeight - modalHeight) / 2;
              }
              
              // Determine horizontal position for desktop
              if (rect.left + modalWidth + padding <= viewportWidth) {
                // Align with left edge of target
                modalLeft = rect.left + window.scrollX;
              } else if (rect.right - modalWidth >= padding) {
                // Align with right edge of target
                modalLeft = rect.right + window.scrollX - modalWidth;
              } else {
                // Center horizontally
                modalLeft = (viewportWidth - modalWidth) / 2;
              }
              
              // Final boundary checks for desktop
              modalTop = Math.max(scrollTop + padding, Math.min(modalTop, scrollTop + viewportHeight - modalHeight - padding));
              modalLeft = Math.max(padding, Math.min(modalLeft, viewportWidth - modalWidth - padding));
            }
            
            setModalPosition({ top: modalTop, left: modalLeft });
          }, currentStepData.forceCenter ? 100 : 500); // Shorter delay for forceCenter
        } else {
          // Element not found, try again after a short delay (for dynamic content)
          setTimeout(() => {
            let retryElement = document.querySelector(currentStepData.targetSelector);
            if (retryElement) {
              updateHighlight();
            } else {
              // Still no element, center the modal
              setModalPosition({ 
                top: window.scrollY + 100, 
                left: Math.max(16, (window.innerWidth - 400) / 2) 
              });
            }
          }, 1000);
        }
      } else {
        // No target selector, center the modal
        setModalPosition({ 
          top: window.scrollY + 100, 
          left: Math.max(16, (window.innerWidth - 400) / 2) 
        });
      }
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [currentStep, currentStepData, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          handleSkip();
          break;
        case 'ArrowRight':
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Save skip preference
    localStorage.setItem(`tour-skipped-${tourId}`, 'true');
    onSkip();
  };

  const renderMedia = () => {
    if (!currentStepData.media) {
      const placeholder = createMediaPlaceholder('video', currentStepData.title, 'Interactive demonstration');
      return (
        <MediaPlaceholder $darkMode={darkMode} style={{ background: placeholder.bgColor }}>
          <div style={{ fontSize: '32px' }}>{placeholder.icon}</div>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>{placeholder.title}</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>{placeholder.description}</div>
        </MediaPlaceholder>
      );
    }

    const { type, src, poster } = currentStepData.media;

    if (type === 'video') {
      return (
        <MediaElement>
          <video 
            poster={poster} 
            controls
            onPlay={() => trackMediaInteraction(tourId, currentStep, 'video', 'play')}
            onPause={() => trackMediaInteraction(tourId, currentStep, 'video', 'pause')}
            onEnded={() => {
              trackMediaInteraction(tourId, currentStep, 'video', 'complete');
              // Auto-advance to next step if this step has autoAdvance flag
              if (currentStepData.autoAdvance && currentStep < steps.length - 1) {
                handleNext();
              }
            }}
          >
            <source src={src} type="video/mp4" />
            Your browser does not support video playback.
          </video>
        </MediaElement>
      );
    }

    if (type === 'gif') {
      return (
        <MediaElement>
          <img 
            src={src} 
            alt={currentStepData.title}
            onLoad={() => trackMediaInteraction(tourId, currentStep, 'gif', 'load')}
          />
        </MediaElement>
      );
    }

    if (type === 'image') {
      return (
        <MediaElement>
          <img 
            src={src} 
            alt={currentStepData.title}
            onLoad={() => trackMediaInteraction(tourId, currentStep, 'image', 'load')}
          />
        </MediaElement>
      );
    }

    // Fallback with enhanced placeholder
    const placeholder = createMediaPlaceholder(type || 'video', currentStepData.title);
    return (
      <MediaPlaceholder $darkMode={darkMode} style={{ background: placeholder.bgColor }}>
        <div style={{ fontSize: '32px' }}>{placeholder.icon}</div>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{placeholder.title}</div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>{placeholder.description}</div>
      </MediaPlaceholder>
    );
  };

  if (!isOpen || !currentStepData) return null;

  return (
    <>
      <GlobalOverlayStyle />
      <div className="guided-tour-overlay" />
      
      {highlightedElement && (
        <div
          className="guided-tour-highlight"
          style={{
            top: highlightedElement.top,
            left: highlightedElement.left,
            width: highlightedElement.width,
            height: highlightedElement.height,
          }}
        />
      )}

      <TourModal 
        ref={tourRef} 
        $darkMode={darkMode} 
        $position={modalPosition}
        role="dialog"
        aria-label="Guided tour"
        aria-describedby="tour-description"
        tabIndex={-1}
      >
        <ProgressBar $darkMode={darkMode} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <ProgressFill $progress={progress} />
        </ProgressBar>
        
        <TourHeader>
          <TourTitle $darkMode={darkMode} id="tour-title">{currentStepData.title}</TourTitle>
          <StepCounter $darkMode={darkMode} aria-label={`Step ${currentStep + 1} of ${steps.length}`}>
            {currentStep + 1} of {steps.length}
          </StepCounter>
        </TourHeader>

        <TourContent>
          <TourDescription $darkMode={darkMode} id="tour-description">
            {currentStepData.description}
          </TourDescription>
          
          <MediaContainer $darkMode={darkMode} $hasMedia={!!currentStepData.media}>
            {renderMedia()}
          </MediaContainer>
        </TourContent>

        <TourActions>
          <div style={{ display: 'flex', gap: '8px' }}>
            {currentStep > 0 && (
              <TourButton 
                $variant="outline" 
                onClick={handlePrevious}
                $darkMode={darkMode}
              >
                Previous
              </TourButton>
            )}
            <TourButton 
              $variant="outline" 
              onClick={handleSkip}
              $darkMode={darkMode}
            >
              Skip Tour
            </TourButton>
          </div>
          
          <TourButton 
            $variant="primary" 
            onClick={handleNext}
            $darkMode={darkMode}
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </TourButton>
        </TourActions>
      </TourModal>
    </>
  );
};

export default GuidedTour;