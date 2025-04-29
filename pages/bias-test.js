// pages/bias-test.js
import { useState, useEffect } from 'react';
import AssetSelector from '../components/AssetSelector';

export default function BiasTestPage() {
  useEffect(() => {
    // Add FontAwesome script if it's not already present
    if (!document.querySelector('#fontawesome-script')) {
      const script = document.createElement('script');
      script.id = 'fontawesome-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js';
      script.integrity = 'sha512-Tn2m0TIpgVyTzzvmxLNuqbSJH3JP8jm+Cy3hvHrW7ndTDcJ1w5mBiksqDBb8GpE2ksktFvDB/ykZ0mDpsZj20w==';
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4efe9 100%)'
    }}>
      <header style={{
        background: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        padding: '20px 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <a href="/" style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #4CAF50, #2196F3)',
              borderRadius: '8px',
              marginRight: '10px'
            }}></span>
            Trading Platform
          </a>

          <nav>
            <ul style={{
              display: 'flex',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              gap: '20px'
            }}>
              <li>
                <a href="/" style={{
                  color: '#555',
                  textDecoration: 'none',
                  fontWeight: '500',
                  padding: '8px 0',
                  transition: 'color 0.2s ease'
                }}>
                  Home
                </a>
              </li>
              <li>
                <a href="/bias-test" style={{
                  color: '#2196F3',
                  textDecoration: 'none',
                  fontWeight: '600',
                  padding: '8px 0',
                  borderBottom: '2px solid #2196F3'
                }}>
                  Bias Test
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <AssetSelector />
      </main>

      <footer style={{
        backgroundColor: '#fff',
        padding: '40px 0',
        borderTop: '1px solid #eee',
        marginTop: '60px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#666'
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
                  color: '#666',
                  fontSize: '24px',
                  transition: 'color 0.2s ease'
                }}>
                  <i className="fab fa-twitter"></i>
                </a>
              </li>
              <li>
                <a href="#" style={{
                  color: '#666',
                  fontSize: '24px',
                  transition: 'color 0.2s ease'
                }}>
                  <i className="fab fa-linkedin"></i>
                </a>
              </li>
              <li>
                <a href="#" style={{
                  color: '#666',
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
    </div>
  );
}