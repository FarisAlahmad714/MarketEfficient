// pages/share/[id].js
import Head from 'next/head';

export async function getStaticPaths() {
  return {
    paths: [
      { params: { id: 'test123' } },
      { params: { id: 'test456' } },
      { params: { id: 'test789' } }
    ],
    fallback: 'blocking'
  };
}

export async function getStaticProps({ params }) {
  const { id } = params;
  
  const testData = {
    testType: 'Bias Test',
    percentage: 85,
    score: 17,
    totalPoints: 20,
    asset: 'BTC'
  };

  const pageTitle = `${testData.percentage}% on ${testData.testType} - MarketEfficient`;
  const pageDescription = `Check out this ${testData.testType} result: ${testData.percentage}% (${testData.score}/${testData.totalPoints} points)`;
  const imageUrl = `https://chartsense.trade/api/og-simple`;

  return {
    props: {
      id,
      testData,
      pageTitle,
      pageDescription,
      imageUrl
    }
  };
}

const SharedPage = ({ id, testData, pageTitle, pageDescription, imageUrl }) => {
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        <meta property="og:url" content={`https://chartsense.trade/share/${id}`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={imageUrl} />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={imageUrl} />
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
      </div>
    </>
  );
};

export default SharedPage;