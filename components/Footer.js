import React, { useContext } from 'react';
import Image from 'next/image';
import { ThemeContext } from '../contexts/ThemeContext';
import { FaTwitter, FaLinkedinIn, FaGithub, FaDiscord } from 'react-icons/fa';

const Footer = () => {
  const { darkMode } = useContext(ThemeContext);

  return (
    <footer style={{
      position: 'relative',
      marginTop: '100px',
    }}>
      {/* Angled background with gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        transform: 'skewY(-3deg)',
        transformOrigin: 'top right',
        backgroundColor: darkMode ? '#1a1a1a' : '#f8f9fa',
        zIndex: -1,
        overflow: 'hidden',
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '5%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0) 70%)',
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0) 70%)',
        }}></div>
        
        {/* Subtle grid pattern overlay */}
        {darkMode && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}></div>
        )}
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 20px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '30px',
        }}>
          {/* Logo and tagline area */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            flex: '1 1 300px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
            }}>
              <div style={{
                position: 'relative',
                width: '45px',
                height: '45px',
              }}>
                <Image 
                  src="/images/logo.webp" 
                  alt="ChartSense Logo" 
                  fill
                  style={{
                    borderRadius: '10px',
                    objectFit: 'cover',
                  }}
                />
                {/* Decorative glow effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '10px',
                  boxShadow: darkMode 
                    ? '0 0 20px rgba(33, 150, 243, 0.3), 0 0 40px rgba(33, 150, 243, 0.1)' 
                    : '0 0 15px rgba(33, 150, 243, 0.2)',
                  opacity: 0.8,
                }}></div>
              </div>
              <div style={{
                marginLeft: '15px',
              }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '28px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #4CAF50, #2196F3)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                }}>
                  ChartSense
                </h2>
                <p style={{
                  margin: '5px 0 0',
                  fontSize: '14px',
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontStyle: 'italic',
                }}>
                  Trading smarter, together
                </p>
              </div>
            </div>
          </div>

          {/* Social media icons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
          }}>
            {[
              { icon: <FaTwitter />, color: '#1DA1F2', label: 'Twitter' },
              { icon: <FaLinkedinIn />, color: '#0A66C2', label: 'LinkedIn' },
              { icon: <FaGithub />, color: '#333', label: 'GitHub' },
              { icon: <FaDiscord />, color: '#5865F2', label: 'Discord' }
            ].map((item, index) => (
              <a 
                key={index}
                href="#" 
                aria-label={item.label}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: darkMode ? '#b0b0b0' : '#666',
                  fontSize: '18px',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = item.color;
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = `0 5px 15px rgba(0, 0, 0, 0.1)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                  e.currentTarget.style.color = darkMode ? '#b0b0b0' : '#666';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {item.icon}
                {/* Ripple effect on hover */}
                <span style={{
                  position: 'absolute',
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${item.color}33 10%, transparent 10.01%)`,
                  transform: 'scale(0)',
                  transition: 'transform 0.5s, opacity 1s',
                  pointerEvents: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(3)';
                  e.currentTarget.style.opacity = '0';
                }}
                ></span>
              </a>
            ))}
          </div>
        </div>

        {/* Animated divider */}
        <div style={{
          margin: '30px 0',
          height: '2px',
          background: darkMode 
            ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1) 50%, transparent 100%)'
            : 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.05) 50%, transparent 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            width: '100px',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, #2196F3, transparent)',
            animation: 'shimmer 3s infinite',
            left: '-100px',
          }}></div>
        </div>

        {/* Bottom area with copyright and made with love */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
          marginTop: '20px',
        }}>
          <p style={{ 
            margin: 0,
            color: darkMode ? '#b0b0b0' : '#666',
            fontSize: '15px',
          }}>
            © 2025 ChartSense. All rights reserved.
          </p>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}>
            <a href="#" style={{
              color: darkMode ? '#b0b0b0' : '#666',
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#2196F3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = darkMode ? '#b0b0b0' : '#666';
            }}>
              Privacy Policy
            </a>
            <a href="#" style={{
              color: darkMode ? '#b0b0b0' : '#666',
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#2196F3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = darkMode ? '#b0b0b0' : '#666';
            }}>
              Terms of Service
            </a>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: darkMode ? '#b0b0b0' : '#666',
              fontSize: '14px',
            }}>
              Made with 
              <div style={{ 
                position: 'relative',
                width: '18px',
                height: '16px',
                margin: '0 2px',
              }}>
                {/* Candle body - animates between bullish and bearish */}
                <div style={{
                  position: 'absolute',
                  width: '8px',
                  height: '10px',
                  left: '5px',
                  animation: 'candle-body 3s ease-in-out infinite',
                  transformOrigin: 'center',
                }}></div>
                {/* Candle wick */}
                <div style={{
                  position: 'absolute',
                  width: '1.5px',
                  height: '16px',
                  backgroundColor: darkMode ? '#b0b0b0' : '#666',
                  left: '8.25px',
                  top: '0',
                }}></div>
                {/* Upper shadow - animates height */}
                <div style={{
                  position: 'absolute',
                  width: '1.5px',
                  height: '4px',
                  left: '8.25px',
                  top: '0',
                  animation: 'upper-shadow 3s ease-in-out infinite',
                  transformOrigin: 'bottom',
                }}></div>
                {/* Lower shadow - animates height */}
                <div style={{
                  position: 'absolute',
                  width: '1.5px',
                  left: '8.25px',
                  bottom: '0',
                  animation: 'lower-shadow 3s ease-in-out infinite',
                  transformOrigin: 'top',
                }}></div>
              </div> 
              in CA
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            left: -100px;
          }
          100% {
            left: 100%;
          }
        }
        
        @keyframes candle-body {
          0%, 100% {
            background-color: #4CAF50;
            top: 2px;
            height: 10px;
            transform: scaleY(1);
          }
          25% {
            background-color: #4CAF50;
            transform: scaleY(1.3);
          }
          50% {
            background-color: #FF5252;
            top: 4px;
            height: 10px;
            transform: scaleY(1);
          }
          75% {
            background-color: #FF5252;
            transform: scaleY(1.3);
          }
        }
        
        @keyframes upper-shadow {
          0% {
            height: 2px;
            background-color: #4CAF50;
          }
          25% {
            height: 4px;
            background-color: #4CAF50;
          }
          50% {
            height: 4px;
            background-color: #FF5252;
          }
          75% {
            height: 6px;
            background-color: #FF5252;
          }
          100% {
            height: 2px;
            background-color: #4CAF50;
          }
        }
        
        @keyframes lower-shadow {
          0% {
            height: 2px;
            background-color: #4CAF50;
          }
          25% {
            height: 3px;
            background-color: #4CAF50;
          }
          50% {
            height: 2px;
            background-color: #FF5252;
          }
          75% {
            height: 1px;
            background-color: #FF5252;
          }
          100% {
            height: 2px;
            background-color: #4CAF50;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;