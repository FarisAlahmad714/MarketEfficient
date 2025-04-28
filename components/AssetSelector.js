// components/AssetSelector.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const AssetSelector = () => {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('daily');
  const router = useRouter();

  useEffect(() => {
    const fetchAssets = async () => {
      const response = await axios.get('/api/assets');
      setAssets(response.data);
    };
    fetchAssets();
  }, []);

  const handleStartTest = () => {
    if (selectedAsset) {
      router.push(`/test/${selectedAsset}?timeframe=${selectedTimeframe}`);
    }
  };

  return (
    <div>
      <h1>Select Asset and Timeframe</h1>
      <select value={selectedAsset} onChange={(e) => setSelectedAsset(e.target.value)}>
        <option value="">Select an asset</option>
        {assets.map(asset => (
          <option key={asset.id} value={asset.symbol}>{asset.name}</option>
        ))}
      </select>
      <select value={selectedTimeframe} onChange={(e) => setSelectedTimeframe(e.target.value)}>
        <option value="4h">4-Hour</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="random">Mixed</option>
      </select>
      <button onClick={handleStartTest}>Start Test</button>
    </div>
  );
};

export default AssetSelector;