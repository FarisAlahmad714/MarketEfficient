// components/dashboard/DashboardCharts.js
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell, Pie, PieChart
} from 'recharts';

// Constants for chart colors
const COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#795548', '#607D8B'];

// Helper functions for chart data processing
const generateScoreRanges = (results) => {
  const ranges = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  };

  results.forEach(test => {
    const score = test.score;
    if (score <= 20) ranges['0-20']++;
    else if (score <= 40) ranges['21-40']++;
    else if (score <= 60) ranges['41-60']++;
    else if (score <= 80) ranges['61-80']++;
    else ranges['81-100']++;
  });

  return Object.entries(ranges).map(([range, count]) => ({ range, count }));
};

const getScoreRangeColor = (range) => {
  const colorMap = {
    '0-20': '#F44336',
    '21-40': '#FF9800',
    '41-60': '#FFC107',
    '61-80': '#8BC34A',
    '81-100': '#4CAF50'
  };
  return colorMap[range] || '#2196F3';
};

const formatTestType = (type) => {
  switch (type) {
    case 'bias-test':
      return 'Bias Test';
    case 'chart-exam':
      return 'Chart Exam';
    case 'swing-analysis':
      return 'Swing Analysis';
    case 'fibonacci-retracement':
      return 'Fibonacci Retracement';
    case 'fair-value-gaps':
      return 'Fair Value Gaps';
    default:
      return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

const generateDailyProgressData = (period) => {
  if (period === 'week') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      name: day,
      value: Math.random() > 0.3 ? 1 : 0 // Simulated data
    }));
  } else {
    const days = [];
    for (let i = 0; i < 30; i++) {
      days.push({
        name: `Day ${i + 1}`,
        value: Math.random() > 0.4 ? 1 : 0 // Simulated data
      });
    }
    return days;
  }
};

const DashboardCharts = ({ 
  metrics, 
  darkMode, 
  period, 
  goalTimeframe, 
  goal 
}) => {
  if (!metrics) {
    return <div>Loading charts...</div>;
  }

  return (
    <>
      {/* Performance Trends Chart */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ 
          color: darkMode ? '#e0e0e0' : '#333',
          marginTop: 0,
          marginBottom: '20px',
          fontSize: '1.5rem'
        }}>
          Performance Trends ({period === 'week' ? 'Daily' : 'Weekly'})
        </h2>
        
        {metrics.summary.totalTests === 0 ? (
          <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
            No test data available.
          </p>
        ) : (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart
                data={period === 'week' ? metrics.trends.daily : metrics.trends.weekly}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#eee'} />
                <XAxis 
                  dataKey={period === 'week' ? 'date' : 'week'} 
                  tick={{ fill: darkMode ? '#b0b0b0' : '#666' }}
                />
                <YAxis 
                  tick={{ fill: darkMode ? '#b0b0b0' : '#666' }}
                  domain={[0, 100]}
                  label={{ 
                    value: 'Score (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: darkMode ? '#b0b0b0' : '#666', textAnchor: 'middle' } 
                  }}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#262626' : 'white',
                    borderColor: darkMode ? '#333' : '#eee',
                    color: darkMode ? '#e0e0e0' : '#333'
                  }}
                  labelStyle={{ color: darkMode ? '#e0e0e0' : '#333' }}
                />
                <Legend wrapperStyle={{ color: darkMode ? '#e0e0e0' : '#333' }} />
                <Line 
                  type="monotone" 
                  dataKey="averageScore" 
                  name="Average Score" 
                  stroke="#2196F3" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Number of Tests" 
                  stroke="#4CAF50" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '30px',
        marginBottom: '30px'
      }}>
        
        {/* Test Type Distribution */}
        <div>
          <h2 style={{ 
            color: darkMode ? '#e0e0e0' : '#333',
            marginTop: 0,
            marginBottom: '20px',
            fontSize: '1.5rem'
          }}>
            Test Type Distribution
          </h2>
          
          {metrics.summary.totalTests === 0 ? (
            <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
              No test data available.
            </p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={Object.entries(metrics.summary.testsByType).map(([type, data]) => ({
                      name: formatTestType(type),
                      value: data.count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.entries(metrics.summary.testsByType).map(([type, data], index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#262626' : 'white',
                      borderColor: darkMode ? '#333' : '#eee',
                      color: darkMode ? '#e0e0e0' : '#333'
                    }}
                    formatter={(value, name) => [value, name]}
                    labelStyle={{ color: darkMode ? '#e0e0e0' : '#333' }}
                  />
                  <Legend wrapperStyle={{ color: darkMode ? '#e0e0e0' : '#333' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        {/* Performance by Score Range */}
        <div>
          <h2 style={{ 
            color: darkMode ? '#e0e0e0' : '#333',
            marginTop: 0,
            marginBottom: '20px',
            fontSize: '1.5rem'
          }}>
            Performance by Score Range
          </h2>
          
          {metrics.summary.totalTests === 0 ? (
            <p style={{ color: darkMode ? '#b0b0b0' : '#666' }}>
              No test data available.
            </p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={generateScoreRanges(metrics.recentActivity)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#eee'} />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fill: darkMode ? '#b0b0b0' : '#666' }}
                  />
                  <YAxis 
                    tick={{ fill: darkMode ? '#b0b0b0' : '#666' }}
                    label={{ 
                      value: 'Number of Tests', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: darkMode ? '#b0b0b0' : '#666', textAnchor: 'middle' } 
                    }}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#262626' : 'white',
                      borderColor: darkMode ? '#333' : '#eee',
                      color: darkMode ? '#e0e0e0' : '#333'
                    }}
                    labelStyle={{ color: darkMode ? '#e0e0e0' : '#333' }}
                  />
                  <Legend wrapperStyle={{ color: darkMode ? '#e0e0e0' : '#333' }} />
                  <Bar 
                    dataKey="count" 
                    name="Number of Tests" 
                    fill="#2196F3" 
                  >
                    {generateScoreRanges(metrics.recentActivity).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getScoreRangeColor(entry.range)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Goal Progress Mini Chart */}
      {goal && (
        <div style={{ marginTop: '15px', height: '40px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={generateDailyProgressData(goalTimeframe)}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 0 }} 
              />
              <Bar dataKey="value" barSize={goalTimeframe === 'week' ? 8 : 4}>
                {generateDailyProgressData(goalTimeframe).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.value > 0 ? goal.color : darkMode ? '#333' : '#f0f0f0'} 
                    opacity={entry.value > 0 ? 1 : 0.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
};

export default DashboardCharts;