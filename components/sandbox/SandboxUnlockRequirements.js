import React, { useContext } from 'react';
import Link from 'next/link';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaLock, FaCheckCircle, FaClock, FaArrowRight, FaChartLine, FaScale } from 'react-icons/fa';

const SandboxUnlockRequirements = ({ sandboxStatus, onRetryCheck }) => {
  const { darkMode } = useContext(ThemeContext);

  if (!sandboxStatus) {
    return (
      <div className={`unlock-container ${darkMode ? 'dark' : 'light'}`}>
        <div className="loading-requirements">
          <div className="spinner"></div>
          <p>Checking your progress...</p>
        </div>
        
        <style jsx>{`
          .unlock-container {
            min-height: calc(100vh - 140px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
          }
          
          .loading-requirements {
            text-align: center;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(59, 130, 246, 0.3);
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .loading-requirements p {
            color: rgba(255, 255, 255, 0.7);
            font-size: 1rem;
          }
          
          .light .loading-requirements p {
            color: rgba(0, 0, 0, 0.7);
          }
        `}</style>
      </div>
    );
  }

  const { requirements, progressPercentage, nextSteps } = sandboxStatus;

  return (
    <div className={`unlock-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="unlock-content">
        <div className="unlock-header">
          <div className="lock-icon">
            <FaLock />
          </div>
          <h1>🎯 Unlock Sandbox Trading</h1>
          <p>Complete your trading education foundation to access safe practice trading</p>
        </div>

        <div className="progress-overview">
          <div className="progress-circle-container">
            <svg width="120" height="120" className="progress-circle-large">
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                stroke="rgba(59, 130, 246, 0.2)" 
                strokeWidth="4" 
                fill="none"
              />
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                stroke="#3b82f6" 
                strokeWidth="4" 
                fill="none"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPercentage / 100)}`}
                className="progress-circle-fill"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="progress-text">
              <span className="progress-percentage">{Math.round(progressPercentage)}%</span>
              <span className="progress-label">Complete</span>
            </div>
          </div>
        </div>

        <div className="requirements-grid">
          <div className="requirement-card">
            <div className="card-header">
              <FaScale className="card-icon" />
              <h3>Bias Tests</h3>
            </div>
            <div className="card-content">
              <div className="requirement-status">
                <span className="completed-count">
                  {requirements.biasTests.completed}
                </span>
                <span className="separator">/</span>
                <span className="required-count">
                  {requirements.biasTests.required}
                </span>
                <span className="status-label">completed</span>
                {requirements.biasTests.completed >= requirements.biasTests.required ? (
                  <FaCheckCircle className="status-icon complete" />
                ) : (
                  <FaClock className="status-icon pending" />
                )}
              </div>
              
              {requirements.biasTests.averageScore > 0 && (
                <div className="average-score">
                  Average Score: {requirements.biasTests.averageScore.toFixed(1)}%
                </div>
              )}
              
              {requirements.biasTests.recentTests?.length > 0 && (
                <div className="recent-tests">
                  <h4>Recent Tests:</h4>
                  {requirements.biasTests.recentTests.map((test, index) => (
                    <div key={index} className="test-item">
                      <span className="test-type">{test.type}</span>
                      <span className="test-score">{test.score}%</span>
                    </div>
                  ))}
                </div>
              )}
              
              {requirements.biasTests.completed < requirements.biasTests.required && (
                <Link href="/bias-test" className="action-button">
                  Take Bias Test <FaArrowRight />
                </Link>
              )}
            </div>
          </div>

          <div className="requirement-card">
            <div className="card-header">
              <FaChartLine className="card-icon" />
              <h3>Chart Exams</h3>
            </div>
            <div className="card-content">
              <div className="requirement-status">
                <span className="completed-count">
                  {requirements.chartExams.completed}
                </span>
                <span className="separator">/</span>
                <span className="required-count">
                  {requirements.chartExams.required}
                </span>
                <span className="status-label">completed</span>
                {requirements.chartExams.completed >= requirements.chartExams.required ? (
                  <FaCheckCircle className="status-icon complete" />
                ) : (
                  <FaClock className="status-icon pending" />
                )}
              </div>
              
              {requirements.chartExams.averageScore > 0 && (
                <div className="average-score">
                  Average Score: {requirements.chartExams.averageScore.toFixed(1)}%
                </div>
              )}
              
              {requirements.chartExams.recentExams?.length > 0 && (
                <div className="recent-tests">
                  <h4>Recent Exams:</h4>
                  {requirements.chartExams.recentExams.map((exam, index) => (
                    <div key={index} className="test-item">
                      <span className="test-type">{exam.type}</span>
                      <span className="test-score">{exam.score}%</span>
                    </div>
                  ))}
                </div>
              )}
              
              {requirements.chartExams.completed < requirements.chartExams.required && (
                <Link href="/chart-exam" className="action-button">
                  Take Chart Exam <FaArrowRight />
                </Link>
              )}
            </div>
          </div>
        </div>

        {nextSteps && nextSteps.length > 0 && (
          <div className="next-steps">
            <h3>Next Steps</h3>
            <div className="steps-list">
              {nextSteps.map((step, index) => (
                <div key={index} className={`step-item ${step.priority}`}>
                  <div className="step-content">
                    <span className="step-action">{step.action}</span>
                    {step.link && step.link !== '/sandbox' && (
                      <Link href={step.link} className="step-link">
                        {step.type === 'bias-test' ? 'Start Test' : 'Start Exam'}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="unlock-footer">
          <button onClick={onRetryCheck} className="refresh-button">
            Refresh Progress
          </button>
          <div className="footer-text">
            <p>Complete the requirements above to unlock sandbox trading with 10,000 SENSE$</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .unlock-container {
          min-height: calc(100vh - 140px);
          padding: 40px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .unlock-content {
          max-width: 800px;
          width: 100%;
          text-align: center;
        }
        
        .unlock-header {
          margin-bottom: 40px;
        }
        
        .lock-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }
        
        .dark .lock-icon {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 2px solid rgba(59, 130, 246, 0.2);
        }
        
        .light .lock-icon {
          background: rgba(59, 130, 246, 0.05);
          color: #3b82f6;
          border: 2px solid rgba(59, 130, 246, 0.1);
        }
        
        .unlock-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 16px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .unlock-header p {
          font-size: 1.125rem;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .dark .unlock-header p {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .unlock-header p {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .progress-overview {
          margin-bottom: 48px;
        }
        
        .progress-circle-container {
          position: relative;
          display: inline-block;
        }
        
        .progress-circle-large {
          transform: rotate(-90deg);
        }
        
        .progress-circle-fill {
          transition: stroke-dashoffset 1s ease;
        }
        
        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .progress-percentage {
          font-size: 2rem;
          font-weight: 800;
          color: #3b82f6;
        }
        
        .progress-label {
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .dark .progress-label {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .progress-label {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .requirements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }
        
        .requirement-card {
          border-radius: 16px;
          padding: 24px;
          text-align: left;
          transition: all 0.3s ease;
        }
        
        .dark .requirement-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light .requirement-card {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .requirement-card:hover {
          transform: translateY(-4px);
        }
        
        .dark .requirement-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(59, 130, 246, 0.3);
        }
        
        .light .requirement-card:hover {
          background: rgba(0, 0, 0, 0.04);
          border-color: rgba(59, 130, 246, 0.2);
        }
        
        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .card-icon {
          font-size: 1.5rem;
          color: #3b82f6;
        }
        
        .card-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }
        
        .dark .card-header h3 {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .card-header h3 {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .requirement-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        
        .completed-count {
          font-size: 2rem;
          font-weight: 800;
          color: #3b82f6;
        }
        
        .separator {
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .dark .separator {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .light .separator {
          color: rgba(0, 0, 0, 0.5);
        }
        
        .required-count {
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .dark .required-count {
          color: rgba(255, 255, 255, 0.7);
        }
        
        .light .required-count {
          color: rgba(0, 0, 0, 0.7);
        }
        
        .status-label {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .dark .status-label {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .status-label {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .status-icon {
          font-size: 1.25rem;
          margin-left: auto;
        }
        
        .status-icon.complete {
          color: #10b981;
        }
        
        .status-icon.pending {
          color: #f59e0b;
        }
        
        .average-score {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 16px;
        }
        
        .dark .average-score {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .average-score {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .recent-tests h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .dark .recent-tests h4 {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .recent-tests h4 {
          color: rgba(0, 0, 0, 0.6);
        }
        
        .test-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid;
        }
        
        .dark .test-item {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .light .test-item {
          border-color: rgba(0, 0, 0, 0.1);
        }
        
        .test-item:last-child {
          border-bottom: none;
        }
        
        .test-type {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .dark .test-type {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .light .test-type {
          color: rgba(0, 0, 0, 0.8);
        }
        
        .test-score {
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
          color: #3b82f6;
        }
        
        .action-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.3s ease;
          margin-top: 16px;
        }
        
        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }
        
        .next-steps {
          margin-bottom: 40px;
        }
        
        .next-steps h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 20px;
        }
        
        .dark .next-steps h3 {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .next-steps h3 {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .step-item {
          padding: 16px 20px;
          border-radius: 12px;
          border-left: 4px solid;
        }
        
        .step-item.high {
          border-color: #f59e0b;
        }
        
        .dark .step-item.high {
          background: rgba(245, 158, 11, 0.1);
        }
        
        .light .step-item.high {
          background: rgba(245, 158, 11, 0.05);
        }
        
        .step-item.success {
          border-color: #10b981;
        }
        
        .dark .step-item.success {
          background: rgba(16, 185, 129, 0.1);
        }
        
        .light .step-item.success {
          background: rgba(16, 185, 129, 0.05);
        }
        
        .step-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        
        .step-action {
          font-weight: 600;
        }
        
        .dark .step-action {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .light .step-action {
          color: rgba(0, 0, 0, 0.9);
        }
        
        .step-link {
          background: #3b82f6;
          color: white;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .step-link:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }
        
        .unlock-footer {
          text-align: center;
        }
        
        .refresh-button {
          background: transparent;
          border: 2px solid #3b82f6;
          color: #3b82f6;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 20px;
        }
        
        .refresh-button:hover {
          background: #3b82f6;
          color: white;
          transform: translateY(-2px);
        }
        
        .footer-text p {
          font-size: 0.875rem;
          line-height: 1.6;
        }
        
        .dark .footer-text p {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .light .footer-text p {
          color: rgba(0, 0, 0, 0.6);
        }
        
        @media (max-width: 768px) {
          .unlock-container {
            padding: 20px 16px;
          }
          
          .unlock-header h1 {
            font-size: 2rem;
          }
          
          .requirements-grid {
            grid-template-columns: 1fr;
          }
          
          .requirement-status {
            justify-content: center;
          }
          
          .step-content {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default SandboxUnlockRequirements;