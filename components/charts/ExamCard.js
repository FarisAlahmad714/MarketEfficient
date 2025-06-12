// components/charts/ExamCard.js
import React from 'react';
import Image from 'next/image';

const ExamCard = ({ 
  exam, 
  darkMode, 
  onExamStart, 
  index, 
  currentIndex, 
  isTransitioning,
  style = {} 
}) => {
  return (
    <div
      style={{
        ...style,
        backgroundColor: darkMode ? '#2c2c2c' : 'white',
        borderRadius: '12px',
        boxShadow: darkMode 
          ? '0 8px 30px rgba(0,0,0,0.3)' 
          : '0 8px 30px rgba(0,0,0,0.15)',
        border: `2px solid transparent`,
        cursor: 'pointer',
        height: '100%',
        transform: `scale(${index === currentIndex ? 1 : 0.95})`,
        transition: isTransitioning 
          ? 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)' 
          : 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        opacity: index === currentIndex ? 1 : 0.8,
        animation: isTransitioning && index === currentIndex ? 'cardFlip 0.8s ease-in-out' : 'none',
        overflow: 'hidden'
      }}
    >
      {/* Image Header */}
      <div style={{
        height: '200px',
        position: 'relative',
        backgroundColor: darkMode ? '#333' : '#f5f5f5'
      }}>
        <Image
          src={exam.image}
          alt={`${exam.title} preview`}
          fill
          style={{
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={index === currentIndex}
        />
        
        {/* Difficulty Badge */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '4px 8px',
          backgroundColor: exam.difficulty === 'Beginner' 
            ? '#4CAF50' 
            : exam.difficulty === 'Intermediate'
              ? '#FF9800'
              : '#F44336',
          color: 'white',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          zIndex: 1
        }}>
          {exam.difficulty}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ 
          marginBottom: '12px',
          color: darkMode ? '#e0e0e0' : '#333',
          fontSize: '1.2rem'
        }}>
          {exam.title}
        </h3>
        <p style={{ 
          marginBottom: '15px',
          color: darkMode ? '#b0b0b0' : '#666',
          fontSize: '0.95rem',
          lineHeight: '1.5'
        }}>
          {exam.description}
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => onExamStart(exam.id)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              transform: 'scale(1)',
              boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.3)';
            }}
          >
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamCard;