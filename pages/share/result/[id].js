// pages/share/result/[id].js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const SharedResultPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    if (router.isReady && id) {
      // Decode the shared result data from URL
      try {
        const decodedData = JSON.parse(decodeURIComponent(id));
        setResultData(decodedData);
      } catch (error) {
        console.error('Error parsing shared result data:', error);
        // Redirect to home if invalid data
        router.push('/');
      }
    }
  }, [router.isReady, id]);

  if (!resultData) {
    return <div>Loading...</div>;
  }

  const baseUrl = 'https://chartsense.trade';
  const ogImageUrl = `${baseUrl}/api/og-simple?testType=${encodeURIComponent(resultData.testType)}&percentage=${resultData.percentage}&title=${encodeURIComponent(pageTitle)}`;

  const pageTitle = `${resultData.percentage}% on ${resultData.testType} - MarketEfficient`;
  const pageDescription = `Check out this ${resultData.testType} result: ${resultData.percentage}% (${resultData.score}/${resultData.totalPoints} points) on MarketEfficient!`;
  const pageUrl = `${baseUrl}/share/result/${id}`;

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
        <meta property="og:image:alt" content={`${resultData.testType} result: ${resultData.percentage}%`} />
        
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
        textAlign: 'center'
      }}>
        <h1>🎯 Test Result Shared</h1>
        
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '30px',
          margin: '30px 0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>
            {resultData.testType === 'Bias Test' ? '🧠' : '📈'}
          </div>
          <h2>{resultData.testType}</h2>
          <div style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: resultData.percentage >= 80 ? '#4CAF50' : '#2196F3',
            margin: '20px 0'
          }}>
            {resultData.percentage}%
          </div>
          <p>Score: {resultData.score}/{resultData.totalPoints} points</p>
          {resultData.asset && (
            <p>Asset: {resultData.asset.toUpperCase()}</p>
          )}
        </div>

        <p>
          <a href="/" style={{ color: '#2196F3', textDecoration: 'none' }}>
            Take your own tests on MarketEfficient →
          </a>
        </p>
      </div>
    </>
  );
};

export default SharedResultPage;