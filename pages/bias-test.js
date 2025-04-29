// pages/bias-test.js
import { useState, useEffect } from 'react';
import AssetSelector from '../components/AssetSelector';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
`;

const Main = styled.main``;

export default function BiasTestPage() {
  useEffect(() => {
    // Add FontAwesome script if it's not already present
    if (!document.querySelector('#fontawesome-script')) {
      const script = document.createElement('script');
      script.id = 'fontawesome-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/js/all.min.js';
      script.integrity = 'sha512-Tn2m0TIpgVyTzzvmxLNuqbSJH3JP8jm+Cy3hvHrW7ndTDcJ1w5mBiksqDBb8GpE2ksktFvDB/ykZ0mDpsZj20w==';
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <Container>
      <Main>
        <AssetSelector />
      </Main>
    </Container>
  );
}