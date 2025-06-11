import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import ChartExam from '../../components/charting_exam/ChartExam';
import { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import CryptoLoader from '../../components/CryptoLoader';
import logger from '../../lib/logger'; // Adjust path to your logger utility
const ChartExamPage = () => {
  const router = useRouter();
  const { type, assetType } = router.query;
  const { darkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (type) {
      setLoading(false);
    }
  }, [type]);
  
  if (!type) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        padding: '20px'
      }}>
        <div style={{
          width: '400px',
          maxWidth: '100%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <CryptoLoader 
            message="Loading exam..."
            minDisplayTime={1500}
            height="350px"
          />
        </div>
      </div>
    );
  }
  
  // Changed to match the IDs you're using in chart-exam.js
  const validTypes = ['swing-analysis', 'fibonacci-retracement', 'fair-value-gaps'];
  
  logger.log("Current type:", type); // Debug to see what value is coming in
  
  if (!validTypes.includes(type)) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        backgroundColor: darkMode ? '#121212' : '#f5f5f5',
        color: darkMode ? '#e0e0e0' : '#333',
        minHeight: '100vh'
      }}>
        <h1>Invalid Exam Type</h1>
        <p>The requested exam type does not exist.</p>
        <button
          onClick={() => router.push('/chart-exam')}
          style={{
            padding: '10px 20px',
            backgroundColor: darkMode ? '#3f51b5' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Return to Exam Selection
        </button>
      </div>
    );
  }
  
  return <ChartExam examType={type} assetType={assetType} />;
};

export default ChartExamPage;