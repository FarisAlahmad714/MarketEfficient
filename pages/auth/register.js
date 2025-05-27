// pages/auth/register.js
import React from 'react';
import Head from 'next/head';
import RegisterWithPricing from '../../components/auth/RegisterWithPricing';

const RegisterPage = () => {
  return (
    <>
      <Head>
        <title>Register - MarketEfficient</title>
        <meta name="description" content="Create your MarketEfficient account and choose your plan" />
      </Head>
      <RegisterWithPricing />
    </>
  );
};

export default RegisterPage;

