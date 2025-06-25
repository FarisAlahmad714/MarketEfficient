// pages/share/[id].js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const SharedPage = () => {
  const router = useRouter();
  const { id } = router.query;

  // Simple test data - we'll expand this later
  const testData = {
    testType: 'Bias Test',
    percentage: 85,
    score: 17,
    totalPoints: 20,
    asset: 'BTC'
  };

  const baseUrl = 'https://chartsense.trade';
  const ogImageUrl = `${baseUrl}/api/og-image?type=test_result&testType=${encodeURIComponent(testData.testType)}&percentage=${testData.percentage}&score=${testData.score}`;
  
  const pageTitle = `${testData.percentage}% on ${testData.testType} - MarketEfficient`;
  const pageDescription = `Check out this ${testData.testType} result: ${testData.percentage}% (${testData.score}/${testData.totalPoints} points) on MarketEfficient!`;
  const pageUrl = `${baseUrl}/share/${id}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* Open Graph meta tags */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:site_name" content="MarketEfficient" />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="675" />
        <meta property="og:image:alt" content={`${testData.testType} result: ${testData.percentage}%`} />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@MarketEfficient" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Head>

      <div style={{
        maxWidth: '800px',
        margin: '40px auto',
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h1>🎯 Test Result Shared</h1>
        
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '30px',
          margin: '30px 0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>🧠</div>
          <h2>{testData.testType}</h2>
          <div style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: testData.percentage >= 80 ? '#4CAF50' : '#2196F3',
            margin: '20px 0'
          }}>
            {testData.percentage}%
          </div>
          <p>Score: {testData.score}/{testData.totalPoints} points</p>
          <p>Asset: {testData.asset}</p>
        </div>

        <p>
          <a href="https://chartsense.trade" style={{ color: '#2196F3', textDecoration: 'none' }}>
            Take your own tests on MarketEfficient →
          </a>
        </p>

        <div style={{ marginTop: '40px', fontSize: '14px', color: '#666' }}>
          <p>Test URL: {pageUrl}</p>
          <p>OG Image: <a href={ogImageUrl} target="_blank" rel="noopener">{ogImageUrl}</a></p>
        </div>
      </div>
    </>
  );
};

export default SharedPage;