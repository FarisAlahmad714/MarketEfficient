// components/charts/DynamicVolumeChart.js
import dynamic from 'next/dynamic';
import React from 'react';

// Loading component for volume chart
const VolumeChartLoading = ({ height = 120 }) => {
  return (
    <div style={{ 
      height: `${height}px`, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#1e1e1e',
      color: '#888',
      fontSize: '14px',
      borderRadius: '4px'
    }}>
      Loading volume data...
    </div>
  );
};

// Dynamic import with loading state
const DynamicVolumeChart = dynamic(
  () => import('./VolumeChart'),
  { 
    ssr: false,
    loading: VolumeChartLoading
  }
);

export default DynamicVolumeChart;