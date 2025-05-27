import { useContext } from 'react';
import AssetSelector from '../components/AssetSelector';
import { ThemeContext } from '../contexts/ThemeContext';

export default function BiasTestPage() {
  const { darkMode } = useContext(ThemeContext);

  return (
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
  );
} 