import Link from 'next/link';
import { useEffect, useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export default function HomePage() {
  const { darkMode } = useContext(ThemeContext);
  
  useEffect(() => {
    console.log('Home page loaded');
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        color: darkMode ? '#e0e0e0' : '#333' 
      }}>
        Trading Analysis Platform
      </h1>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '20px' 
      }}>
        <div style={{ 
          backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Daily Bias Test</h2>
          <p style={{ color: darkMode ? '#b0b0b0' : '#555' }}>
            Test your ability to predict market direction based on historical price data.
          </p>
          <Link href="/bias-test" style={{ 
            display: 'inline-block', 
            padding: '8px 16px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '4px', 
            marginTop: '10px' 
          }}>
            Start Testing
          </Link>
        </div>

        <div style={{ 
          backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: darkMode ? '#e0e0e0' : '#333' }}>Charting Exams</h2>
          <p style={{ color: darkMode ? '#b0b0b0' : '#555' }}>
            Practice technical analysis with interactive charting exercises.
          </p>
          <Link href="/chart-exam" style={{ 
            display: 'inline-block', 
            padding: '8px 16px', 
            backgroundColor: '#2196F3', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '4px', 
            marginTop: '10px' 
          }}>
            Start Learning
          </Link>
        </div>
      </div>
    </div>
  );
}