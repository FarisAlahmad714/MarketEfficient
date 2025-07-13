# Guided Tour System

A comprehensive, accessible layered modal guide system for bias tests and charting exams with video/GIF support and interactive overlays.

## Features

### 🎯 **Interactive Step-by-Step Guidance**
- **Targeted highlighting** of UI elements with automatic positioning
- **Progressive disclosure** guiding users through complex workflows
- **Context-aware positioning** that adapts to highlighted elements
- **Mobile-responsive** design with touch-friendly interactions

### 🎬 **Rich Media Support**
- **Video demonstrations** with poster images and playback controls
- **Animated GIFs** for step-by-step visual guidance
- **Smart placeholders** with gradients and icons when media isn't available
- **Analytics tracking** for media engagement and user interaction

### ♿ **Accessibility First**
- **Keyboard navigation** (Arrow keys, Enter, Space, Escape)
- **Screen reader support** with proper ARIA labels and roles
- **Focus management** and outline indicators
- **Progressive enhancement** that works without JavaScript

### 🎨 **Theme Integration**
- **Automatic theme detection** using existing ThemeContext
- **Consistent styling** that matches your application's design
- **Smooth animations** and transitions
- **Backdrop blur effects** for modern visual appeal

## Components

### `GuidedTour`
Main tour component that orchestrates the entire experience.

**Props:**
- `steps` - Array of tour step objects
- `isOpen` - Boolean to control tour visibility
- `onComplete` - Callback when tour is completed
- `onSkip` - Callback when tour is skipped
- `tourId` - Unique identifier for localStorage tracking

### `tourSteps.js`
Pre-configured tour definitions for different exam types.

**Available Tours:**
- `bias-test` - 10-step walkthrough of bias test functionality
- `chart-exam` with subtypes:
  - `swing-analysis` - 6-step swing point identification guide
  - `fibonacci-retracement` - 6-step Fibonacci drawing tutorial
  - `fair-value-gaps` - 7-step FVG identification course

### `tourMedia.js`
Media management system with placeholder generation and analytics.

**Features:**
- Placeholder generation with themed backgrounds
- Media preloading for critical tour content
- Interaction tracking for analytics
- Fallback support for missing media files

## Usage

### Basic Implementation

```jsx
import GuidedTour from './components/common/GuidedTour';
import { getTourSteps } from './lib/tourSteps';

function MyComponent() {
  const [showTour, setShowTour] = useState(false);
  const [tourSteps] = useState(getTourSteps('bias-test'));

  const handleTourComplete = () => {
    localStorage.setItem('tour-completed-bias-test', 'true');
    setShowTour(false);
  };

  return (
    <>
      <button onClick={() => setShowTour(true)}>Start Tour</button>
      
      <GuidedTour
        steps={tourSteps}
        isOpen={showTour}
        onComplete={handleTourComplete}
        onSkip={() => setShowTour(false)}
        tourId="bias-test"
      />
    </>
  );
}
```

### Custom Tour Steps

```jsx
const customSteps = [
  {
    title: "Welcome to Feature X",
    description: "This feature helps you analyze market trends more effectively.",
    targetSelector: ".feature-x-button", // CSS selector to highlight
    media: {
      type: "video",
      src: "/videos/feature-x-demo.mp4",
      poster: "/images/feature-x-poster.jpg"
    }
  },
  {
    title: "Configure Settings",
    description: "Adjust these settings to match your trading style.",
    targetSelector: ".settings-panel",
    media: {
      type: "gif",
      src: "/gifs/settings-demo.gif"
    }
  }
];
```

## CSS Classes for Targeting

Add these classes to your components to enable tour highlighting:

```jsx
// Bias Test
<div className="asset-selector-container">
<div className="asset-search-bar">
<div className="crypto-assets-section">
<div className="equity-assets-section">
<div className="commodity-assets-section">

// Chart Exam
<div className="exam-selection-carousel">
<div className="exam-difficulty-badge">
<div className="start-exam-button">
```

## Media Organization

Organize tour media files in the following structure:

```
public/
├── videos/tours/
│   ├── bias-test/
│   │   ├── intro.mp4
│   │   ├── chart-analysis.mp4
│   │   └── ai-feedback.mp4
│   └── chart-exam/
│       ├── swing-analysis-intro.mp4
│       ├── fibonacci-intro.mp4
│       └── fvg-intro.mp4
├── gifs/tours/
│   ├── bias-test/
│   │   ├── asset-selection.gif
│   │   ├── make-prediction.gif
│   │   └── submit-analysis.gif
│   └── chart-exam/
│       ├── swing-highs-demo.gif
│       ├── fibonacci-trend.gif
│       └── fvg-definition.gif
└── images/tours/
    ├── bias-test/
    │   ├── intro-poster.jpg
    │   └── chart-analysis-poster.jpg
    └── chart-exam/
        ├── swing-analysis-intro-poster.jpg
        └── fibonacci-intro-poster.jpg
```

## Keyboard Shortcuts

- **Right Arrow / Enter / Space** - Next step
- **Left Arrow** - Previous step
- **Escape** - Skip tour

## Analytics Events

The system automatically tracks:
- `tour_started` - When a tour begins
- `tour_completed` - When a tour is finished
- `tour_skipped` - When a tour is abandoned
- `tour_media_interaction` - Video/GIF engagement

## Browser Support

- **Modern browsers** with CSS Grid and Flexbox support
- **Mobile browsers** with touch event support
- **Screen readers** with ARIA support
- **Keyboard-only navigation** support

## Performance Features

- **Lazy loading** of media content
- **Preloading** of critical tour assets
- **Efficient re-renders** with React.memo
- **Minimal bundle impact** with dynamic imports

## Customization

### Styling
The tour system uses styled-components and integrates with your existing theme. Customize by:
1. Modifying the styled components in `GuidedTour.js`
2. Adjusting theme variables in your ThemeContext
3. Overriding CSS classes for specific tour elements

### Behavior
Customize tour behavior by:
1. Modifying step timing and transitions
2. Adding custom validation logic
3. Implementing progress persistence
4. Creating conditional step flows

## Future Enhancements

- **Multi-language support** for international users
- **Tour branching** based on user selections
- **Adaptive tours** that adjust based on user behavior
- **Integration with help documentation**
- **Real-time tour analytics dashboard**