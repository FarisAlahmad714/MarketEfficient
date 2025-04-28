// pages/bias-test.js
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BiasTestPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/assets');
        const data = await response.json();
        setAssets(data);
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading assets...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Select an Asset for Testing</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
        {assets.map(asset => (
          <div key={asset.id} style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3>{asset.name}</h3>
            <p>{asset.symbol.toUpperCase()}</p>
            <Link 
              href={`/bias-test/${asset.symbol}`} 
              style={{ display: 'inline-block', padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', textDecoration: 'none', borderRadius: '4px', marginTop: '10px' }}
            >
              Start Test
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}