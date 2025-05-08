// pages/auth/register.js
import React from 'react';
import Head from 'next/head';
import RegisterForm from '../../components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <>
      <Head>
        <title>Register - Trading Platform</title>
        <meta name="description" content="Create a new Trading Platform account" />
      </Head>
      <RegisterForm />
    </>
  );
};

export default RegisterPage;

