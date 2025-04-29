import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

const Footer = () => {
  const { darkMode } = useContext(ThemeContext);

  return (
    <footer style={{
      backgroundColor: darkMode ? '#1a1a1a' : '#fff',
      padding: '40px 0',
      borderTop: `1px solid ${darkMode ? '#333' : '#eee'}`,
      marginTop: '60px',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: darkMode ? '#b0b0b0' : '#666'
      }}>
        <div>
          <p style={{ margin: 0 }}>© 2025 Trading Platform. All rights reserved.</p>
        </div>
        <div>
          <ul style={{
            display: 'flex',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            gap: '15px'
          }}>
            <li>
              <a href="#" style={{
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '24px',
                transition: 'color 0.2s ease'
              }}>
                <i className="fab fa-twitter"></i>
              </a>
            </li>
            <li>
              <a href="#" style={{
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '24px',
                transition: 'color 0.2s ease'
              }}>
                <i className="fab fa-linkedin"></i>
              </a>
            </li>
            <li>
              <a href="#" style={{
                color: darkMode ? '#b0b0b0' : '#666',
                fontSize: '24px',
                transition: 'color 0.2s ease'
              }}>
                <i className="fab fa-github"></i>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;