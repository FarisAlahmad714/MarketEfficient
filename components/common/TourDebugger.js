// Debug utility for guided tours
export const debugTour = (stepData, element) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🎯 Tour Debug - Step: ${stepData.title}`);
    console.log('Target Selector:', stepData.targetSelector);
    console.log('Element Found:', !!element);
    if (element) {
      console.log('Element:', element);
      console.log('Element Rect:', element.getBoundingClientRect());
      console.log('Element Classes:', element.className);
      console.log('Element Styles:', window.getComputedStyle(element));
    } else if (stepData.targetSelector) {
      console.warn('❌ Element not found with selector:', stepData.targetSelector);
      console.log('Available elements with similar classes:', 
        document.querySelectorAll(`[class*="${stepData.targetSelector.replace('.', '')}"]`)
      );
    }
    console.groupEnd();
  }
};

export const listAvailableElements = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 Available Tour Target Elements');
    const selectors = [
      '.help-button',
      '.chart-container', 
      '.prediction-buttons',
      '.reasoning-textarea',
      '.confidence-slider', 
      '.submit-button'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`${selector}: ${elements.length} found`, elements);
    });
    console.groupEnd();
  }
};