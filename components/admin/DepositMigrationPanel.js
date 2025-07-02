import React, { useState } from 'react';
import { FaPlay, FaEye, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const DepositMigrationPanel = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runMigration = async (dryRun = false) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/migrate-deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: dryRun ? 'preview' : 'migrate',
          dryRun: dryRun
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Migration failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="migration-panel">
      <div className="panel-header">
        <h3>📊 Historical Deposit Migration</h3>
        <p>Backfill transaction history for users' previous quarterly deposits</p>
      </div>

      <div className="migration-info">
        <div className="info-card">
          <h4>⚠️ What This Does</h4>
          <ul>
            <li>Creates SandboxTransaction records for all historical quarterly deposits</li>
            <li>Users will see their complete deposit history in trading panel</li>
            <li>Calculates deposit dates based on topUpCount and lastTopUpDate</li>
            <li>Safe to run multiple times (skips existing records)</li>
          </ul>
        </div>
      </div>

      <div className="migration-actions">
        <button
          onClick={() => runMigration(true)}
          disabled={loading}
          className="btn btn-secondary"
        >
          {loading ? <FaSpinner className="spin" /> : <FaEye />}
          Preview Migration (Dry Run)
        </button>

        <button
          onClick={() => runMigration(false)}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? <FaSpinner className="spin" /> : <FaPlay />}
          Run Migration
        </button>
      </div>

      {loading && (
        <div className="migration-status">
          <FaSpinner className="spin" />
          <span>Running migration... This may take a few minutes.</span>
        </div>
      )}

      {error && (
        <div className="migration-result error">
          <FaExclamationTriangle />
          <div>
            <h4>Migration Failed</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="migration-result success">
          <FaCheckCircle />
          <div>
            <h4>
              {result.type === 'preview' ? 'Migration Preview' : 'Migration Completed'}
            </h4>
            
            {result.type === 'migration' && (
              <div className="result-stats">
                <div className="stat">
                  <strong>{result.result.totalMigrated}</strong>
                  <span>Transactions Created</span>
                </div>
                <div className="stat">
                  <strong>{result.result.totalSkipped}</strong>
                  <span>Portfolios Skipped</span>
                </div>
                <div className="stat">
                  <strong>{result.result.errorCount}</strong>
                  <span>Errors</span>
                </div>
              </div>
            )}

            {result.result?.errors?.length > 0 && (
              <div className="migration-errors">
                <h5>Errors:</h5>
                <ul>
                  {result.result.errors.map((error, index) => (
                    <li key={index}>
                      <strong>{error.username}:</strong> {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="result-message">{result.message}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .migration-panel {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin: 20px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .panel-header h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 20px;
        }

        .panel-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .migration-info {
          margin: 20px 0;
        }

        .info-card {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 16px;
        }

        .info-card h4 {
          margin: 0 0 12px 0;
          color: #495057;
          font-size: 16px;
        }

        .info-card ul {
          margin: 0;
          padding-left: 20px;
        }

        .info-card li {
          margin-bottom: 8px;
          color: #666;
          font-size: 14px;
        }

        .migration-actions {
          display: flex;
          gap: 12px;
          margin: 20px 0;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .migration-status {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #e7f1ff;
          border: 1px solid #b3d7ff;
          border-radius: 8px;
          color: #004085;
          font-size: 14px;
        }

        .migration-result {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          margin-top: 16px;
        }

        .migration-result.success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .migration-result.error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .migration-result h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
        }

        .migration-result p {
          margin: 0;
          font-size: 14px;
        }

        .result-stats {
          display: flex;
          gap: 20px;
          margin: 12px 0;
        }

        .stat {
          text-align: center;
        }

        .stat strong {
          display: block;
          font-size: 24px;
          color: #28a745;
        }

        .stat span {
          font-size: 12px;
          color: #666;
        }

        .migration-errors {
          margin-top: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 6px;
        }

        .migration-errors h5 {
          margin: 0 0 8px 0;
          font-size: 14px;
        }

        .migration-errors ul {
          margin: 0;
          padding-left: 16px;
        }

        .migration-errors li {
          font-size: 12px;
          margin-bottom: 4px;
        }

        .result-message {
          margin-top: 8px !important;
          font-weight: 500;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DepositMigrationPanel;