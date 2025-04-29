import React from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <ThemeProvider>
      <div id="app-container">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        
        body.dark-mode {
          background-color: #121212;
          color: #e0e0e0;
        }
        
        body.light-mode {
          background-color: #f5f7fa;
          color: #333;
        }
        
        #app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        main {
          flex: 1;
        }
        
        * {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        /* Additional theme-specific styles */
        body.dark-mode button {
          color: #e0e0e0;
        }
        
        body.dark-mode input,
        body.dark-mode textarea,
        body.dark-mode select {
          background-color: #333;
          color: #e0e0e0;
          border-color: #555;
        }
        
        body.dark-mode input::placeholder,
        body.dark-mode textarea::placeholder {
          color: #888;
        }
        
        body.dark-mode a {
          color: #90caf9;
        }
        
        body.dark-mode a:hover {
          color: #bbdefb;
        }
        
        body.dark-mode code {
          background-color: #333;
          color: #f06292;
        }
        
        body.dark-mode table {
          border-color: #555;
        }
        
        body.dark-mode th,
        body.dark-mode td {
          border-color: #555;
        }
        
        body.dark-mode hr {
          border-color: #555;
        }
        
        .dark-mode-transition {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
      `}</style>
    </ThemeProvider>
  );
};

export default Layout;