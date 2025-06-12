import { useContext } from 'react';
import dynamic from 'next/dynamic';
import { ThemeContext } from '../contexts/ThemeContext';
import TrackedPage from '../components/TrackedPage';
import CryptoLoader from '../components/CryptoLoader';

// Dynamically import AssetSelector to reduce initial bundle size
const AssetSelector = dynamic(() => import('../components/AssetSelector'), {
  ssr: false,
  loading: () => <CryptoLoader height="400px" message="Loading asset selector..." />
});

export default function BiasTestPage() {
  const { darkMode } = useContext(ThemeContext);

  return (
    <TrackedPage>
    <div style={{
      minHeight: '100vh',
      background: darkMode 
        ? 'linear-gradient(135deg, #121212 0%, #1a1a1a 100%)' 
        : 'linear-gradient(135deg, #f5f7fa 0%, #e4efe9 100%)',
      transition: 'background 0.3s ease'
    }}>
      <main>
        <AssetSelector />
      </main>
    </div>
    </TrackedPage>
  );
} 