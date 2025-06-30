// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Base meta tags - will be overridden by page-specific ones */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        
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