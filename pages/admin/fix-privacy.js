// pages/admin/fix-privacy.js
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function FixPrivacy() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const router = useRouter();

  const updateUserPrivacy = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/update-user-privacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Admin: Fix User Privacy Settings</h1>
      <p>This will update all users to have public profiles and share results.</p>
      
      <button 
        onClick={updateUserPrivacy}
        disabled={loading}
        style={{
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {loading ? 'Updating...' : 'Update All Users'}
      </button>

      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: result.error ? '#ffebee' : '#e8f5e8',
          borderRadius: '6px'
        }}>
          <h3>{result.error ? 'Error' : 'Success'}</h3>
          {result.error ? (
            <p>{result.error}</p>
          ) : (
            <>
              <p>{result.message}</p>
              <p>Modified {result.modifiedCount} users</p>
              {result.sampleUsers && (
                <div>
                  <h4>Sample users:</h4>
                  <ul>
                    {result.sampleUsers.map((user, index) => (
                      <li key={index}>
                        {user.username}: profileVisibility={user.profileVisibility}, shareResults={String(user.shareResults)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <button 
        onClick={() => router.push('/')} 
        style={{ 
          marginTop: '20px', 
          backgroundColor: '#666', 
          color: 'white', 
          border: 'none', 
          padding: '8px 16px', 
          borderRadius: '4px' 
        }}
      >
        Back to Home
      </button>
    </div>
  );
}