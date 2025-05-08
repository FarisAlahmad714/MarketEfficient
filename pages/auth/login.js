// pages/auth/login.js
import React from 'react';
import Head from 'next/head';
import LoginForm from '../../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <>
      <Head>
        <title>Login - Trading Platform</title>
        <meta name="description" content="Login to your Trading Platform account" />
      </Head>
      <LoginForm />
    </>
  );
};

export default LoginPage;

