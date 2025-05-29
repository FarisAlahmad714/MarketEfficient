
// pages/checkout/error.js
import React, { useContext } from 'react';
import { useRouter } from 'next/router';
import CheckoutErrorRecovery from '../../components/CheckoutErrorRecovery';
import Head from 'next/head';

const CheckoutError = () => {
  const router = useRouter();
  const { error, session_id } = router.query;
  
  return (
    <>
      <Head>
        <title>Payment Error - MarketEfficient</title>
      </Head>
      
      <CheckoutErrorRecovery 
        error={error || 'processing_error'}
        sessionId={session_id}
        onRetry={() => router.push('/pricing')}
      />
    </>
  );
};

export default CheckoutError;