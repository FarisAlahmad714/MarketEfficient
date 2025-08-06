// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Essential meta tags that MUST be in server-rendered HTML */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Default meta tags for home page - always server-rendered */}
        <title>ChartSense - Trading Smarter, Together</title>
        <meta name="description" content="Master trading psychology, technical analysis, and market knowledge with AI-powered tools. Join thousands of traders improving their skills on ChartSense." />
        
        {/* Open Graph / Facebook - MUST be in server HTML */}
        <meta property="og:url" content="https://www.chartsense.trade/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="ChartSense - Trading Smarter, Together" />
        <meta property="og:description" content="Master trading psychology, technical analysis, and market knowledge with AI-powered tools. Join thousands of traders improving their skills on ChartSense." />
        <meta property="og:image" content="https://www.chartsense.trade/images/banner.png?v=2" />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:image:alt" content="ChartSense - Master Trading Skills" />
        <meta property="og:site_name" content="ChartSense by Mithril Labs LLC" />
        
        {/* Twitter Card - MUST be in server HTML */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@chartsense" />
        <meta name="twitter:title" content="ChartSense - Trading Smarter, Together" />
        <meta name="twitter:description" content="Master trading psychology, technical analysis, and market knowledge with AI-powered tools. Join thousands of traders improving their skills on ChartSense." />
        <meta name="twitter:image" content="https://www.chartsense.trade/images/banner.png?v=2" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://www.chartsense.trade" />
        <link rel="preconnect" href="https://storage.googleapis.com" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}