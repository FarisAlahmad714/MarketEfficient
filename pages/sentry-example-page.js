import { useState } from 'react';
import Layout from '../components/Layout';
import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  const [errorTriggered, setErrorTriggered] = useState(false);

  const triggerError = () => {
    setErrorTriggered(true);
    
    // Send a test message to Sentry
    Sentry.captureMessage("Test error from Sentry button!", "error");
    
    // Also send an exception
    const testError = new Error("This is a test error for Sentry verification");
    Sentry.captureException(testError);
    
    console.log("Sentry test events sent!");
    
    // Still trigger the undefined function for browser error
    setTimeout(() => {
      myUndefinedFunction();
    }, 100);
  };

  return (
    <Layout>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Sentry Test Page</h1>
        <p>Click the button below to trigger a test error and verify Sentry is working.</p>
        
        <button 
          onClick={triggerError}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '2rem'
          }}
        >
          Trigger Test Error
        </button>
        
        {errorTriggered && (
          <div style={{ marginTop: '2rem', color: '#dc2626' }}>
            <p>Error triggered! Check your Sentry dashboard.</p>
          </div>
        )}
        
        <div style={{ marginTop: '3rem', fontSize: '0.9rem', color: '#666' }}>
          <p>This page should only be used for testing. Remove it before production deployment.</p>
        </div>
      </div>
    </Layout>
  );
}