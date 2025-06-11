import React, { useState, useEffect, useRef, memo } from 'react';
import { useRouter } from 'next/router';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBitcoin, FaEthereum, FaApple, FaCar, FaMicrochip, 
  FaCoins, FaChartLine, FaRocket, FaGlobe, FaSatellite 
} from 'react-icons/fa';
import TimeframeModal from './TimeframeModal';

// Keyframes for orbiting animation
const orbit = keyframes`
  from { transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg); }
  to { transform: rotate(360deg) translateX(var(--orbit-radius)) rotate(-360deg); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
`;

const particle = keyframes`
  0% { 
    transform: translateY(0) scale(0); 
    opacity: 0; 
  }
  10% { 
    transform: translateY(-10px) scale(1); 
    opacity: 1; 
  }
  90% { 
    transform: translateY(-200px) scale(0.5); 
    opacity: 0.7; 
  }
  100% { 
    transform: translateY(-220px) scale(0); 
    opacity: 0; 
  }
`;

// Styled Components
const ConstellationContainer = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  background: radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%);
  overflow: hidden;
  perspective: 1000px;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
`;

const StarField = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const Star = styled.div`
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  animation: ${float} ${props => props.duration || '4s'} ease-in-out infinite;
  animation-delay: ${props => props.delay || '0s'};
  opacity: ${props => props.opacity || '0.8'};
`;

const TradingHub = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, #00c4ff 0%, #0077cc 50%, #003d66 100%);
  box-shadow: 
    0 0 60px rgba(0, 196, 255, 0.6),
    inset 0 0 30px rgba(255, 255, 255, 0.2);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${pulse} 3s ease-in-out infinite;
  
  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    border-radius: 50%;
    background: linear-gradient(45deg, transparent, rgba(0, 196, 255, 0.3), transparent);
    animation: ${orbit} 10s linear infinite;
  }
`;

const HubIcon = styled.div`
  font-size: 3rem;
  color: white;
  z-index: 2;
  position: relative;
`;

const HubTitle = styled.div`
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  z-index: 2;
`;

const OrbitContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  z-index: 5;
`;

const AssetOrbit = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  --orbit-radius: ${props => props.radius}px;
  animation: ${orbit} ${props => props.duration}s linear infinite;
  animation-delay: ${props => props.delay}s;
  transform-origin: 0 0;
`;

const AssetPlanet = styled(motion.div)`
  position: relative;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: 50%;
  background: ${props => props.gradient};
  box-shadow: 
    0 0 30px ${props => props.glowColor},
    inset 0 0 20px rgba(255, 255, 255, 0.2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.2);
    box-shadow: 
      0 0 50px ${props => props.glowColor},
      inset 0 0 30px rgba(255, 255, 255, 0.3);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    border-radius: 50%;
    border: 2px solid ${props => props.glowColor};
    opacity: 0.5;
  }
`;

const AssetIcon = styled.div`
  font-size: ${props => props.size / 3}px;
  color: white;
  z-index: 2;
`;

const AssetLabel = styled(motion.div)`
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  background: rgba(0, 0, 0, 0.7);
  padding: 5px 10px;
  border-radius: 15px;
  border: 1px solid ${props => props.borderColor};
  white-space: nowrap;
  opacity: 0;
  
  ${AssetPlanet}:hover & {
    opacity: 1;
  }
`;

const ParticleSystem = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  z-index: 3;
`;

const Particle = styled.div`
  position: absolute;
  width: 3px;
  height: 3px;
  background: ${props => props.color || '#00c4ff'};
  border-radius: 50%;
  animation: ${particle} ${props => props.duration || '3s'} linear infinite;
  animation-delay: ${props => props.delay || '0s'};
  left: ${props => props.x}%;
  top: ${props => props.y}%;
`;

const UIOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 15;
  pointer-events: none;
`;

const Title = styled(motion.h1)`
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #00c4ff 0%, #00ff88 50%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  pointer-events: auto;
  text-shadow: 0 0 30px rgba(0, 196, 255, 0.5);
`;

const Instructions = styled(motion.div)`
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  font-size: 1.1rem;
  pointer-events: auto;
`;

const ZoomOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ZoomedAsset = styled(motion.div)`
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: ${props => props.gradient};
  box-shadow: 
    0 0 100px ${props => props.glowColor},
    inset 0 0 50px rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const ZoomedIcon = styled.div`
  font-size: 4rem;
  color: white;
  margin-bottom: 20px;
`;

const ZoomedName = styled.h2`
  color: white;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 15px;
`;

const ZoomedDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  max-width: 250px;
  margin-bottom: 30px;
  line-height: 1.5;
`;

const StartButton = styled(motion.button)`
  padding: 15px 30px;
  background: linear-gradient(135deg, #00c4ff, #0077cc);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 196, 255, 0.3);
`;

const TradingConstellation = ({ onAssetSelect }) => {
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showTimeframeModal, setShowTimeframeModal] = useState(false);
  const [zoomedAsset, setZoomedAsset] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Asset data with orbital properties
  const assets = [
    {
      id: 1,
      symbol: 'btc',
      name: 'Bitcoin',
      type: 'crypto',
      radius: 300,
      size: 80,
      duration: 20,
      delay: 0,
      gradient: 'linear-gradient(135deg, #F7931A, #FF9900)',
      glowColor: '#F7931A',
      icon: <FaBitcoin />,
      description: 'The world\'s first cryptocurrency'
    },
    {
      id: 2,
      symbol: 'eth',
      name: 'Ethereum',
      type: 'crypto',
      radius: 250,
      size: 70,
      duration: 15,
      delay: 3,
      gradient: 'linear-gradient(135deg, #627EEA, #829FFF)',
      glowColor: '#627EEA',
      icon: <FaEthereum />,
      description: 'Smart contracts and DeFi platform'
    },
    {
      id: 3,
      symbol: 'aapl',
      name: 'Apple',
      type: 'equity',
      radius: 380,
      size: 75,
      duration: 25,
      delay: 7,
      gradient: 'linear-gradient(135deg, #A2AAAD, #000000)',
      glowColor: '#A2AAAD',
      icon: <FaApple />,
      description: 'Technology giant and innovation leader'
    },
    {
      id: 4,
      symbol: 'tsla',
      name: 'Tesla',
      type: 'equity',
      radius: 320,
      size: 65,
      duration: 18,
      delay: 12,
      gradient: 'linear-gradient(135deg, #E82127, #8B0000)',
      glowColor: '#E82127',
      icon: <FaCar />,
      description: 'Electric vehicles and clean energy'
    },
    {
      id: 5,
      symbol: 'nvda',
      name: 'Nvidia',
      type: 'equity',
      radius: 280,
      size: 68,
      duration: 22,
      delay: 5,
      gradient: 'linear-gradient(135deg, #76B900, #1A5200)',
      glowColor: '#76B900',
      icon: <FaMicrochip />,
      description: 'AI and GPU technology leader'
    },
    {
      id: 6,
      symbol: 'sol',
      name: 'Solana',
      type: 'crypto',
      radius: 220,
      size: 60,
      duration: 12,
      delay: 8,
      gradient: 'linear-gradient(135deg, #00FFA3, #DC1FFF)',
      glowColor: '#00FFA3',
      icon: <FaCoins />,
      description: 'High-performance blockchain'
    },
    {
      id: 7,
      symbol: 'bnb',
      name: 'Binance Coin',
      type: 'crypto',
      radius: 350,
      size: 65,
      duration: 28,
      delay: 15,
      gradient: 'linear-gradient(135deg, #f0b90b, #d4a017)',
      glowColor: '#f0b90b',
      icon: <FaCoins />,
      description: 'World\'s largest crypto exchange token'
    },
    {
      id: 8,
      symbol: 'gld',
      name: 'Gold',
      type: 'equity',
      radius: 400,
      size: 70,
      duration: 30,
      delay: 20,
      gradient: 'linear-gradient(135deg, #FFD700, #B8860B)',
      glowColor: '#FFD700',
      icon: <FaCoins />,
      description: 'Precious metal store of value'
    },
    {
      id: 9,
      symbol: 'random',
      name: 'Random Mix',
      type: 'mixed',
      radius: 450,
      size: 85,
      duration: 35,
      delay: 25,
      gradient: 'linear-gradient(135deg, #cc33ff, #9933cc, #ff6b6b)',
      glowColor: '#cc33ff',
      icon: <FaRocket />,
      description: 'Ultimate challenge with mixed assets'
    }
  ];

  // Generate stars
  const generateStars = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: Math.random() * 0.8 + 0.2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5
    }));
  };

  // Generate particles
  const generateParticles = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: ['#00c4ff', '#00ff88', '#ff6b6b'][Math.floor(Math.random() * 3)],
      duration: Math.random() * 2 + 2,
      delay: Math.random() * 10
    }));
  };

  const [stars] = useState(() => generateStars(200));
  const [particles] = useState(() => generateParticles(50));

  const handleAssetClick = (asset) => {
    setZoomedAsset(asset);
  };

  const handleStartTest = () => {
    if (zoomedAsset) {
      setSelectedAsset(zoomedAsset);
      setShowTimeframeModal(true);
      setZoomedAsset(null);
    }
  };

  const handleTimeframeSelect = (timeframe) => {
    if (selectedAsset) {
      router.push(
        `/bias-test/${selectedAsset.symbol}?timeframe=${timeframe}&random=${Math.random()}`
      );
    }
  };

  const handleCloseModal = () => {
    setShowTimeframeModal(false);
    setZoomedAsset(null);
  };

  // Mouse drag to rotate view
  useEffect(() => {
    const handleMouseDown = (e) => {
      setIsDragging(true);
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        setRotation(prev => prev + e.movementX * 0.5);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousedown', handleMouseDown);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <ConstellationContainer ref={containerRef}>
      {/* Star Field */}
      <StarField>
        {stars.map(star => (
          <Star
            key={star.id}
            style={{ left: `${star.x}%`, top: `${star.y}%` }}
            opacity={star.opacity}
            duration={`${star.duration}s`}
            delay={`${star.delay}s`}
          />
        ))}
      </StarField>

      {/* Particle System */}
      <ParticleSystem>
        {particles.map(particle => (
          <Particle
            key={particle.id}
            x={particle.x}
            y={particle.y}
            color={particle.color}
            duration={`${particle.duration}s`}
            delay={`${particle.delay}s`}
          />
        ))}
      </ParticleSystem>

      {/* Central Trading Hub */}
      <TradingHub
        style={{ transform: `translate(-50%, -50%) rotateY(${rotation}deg)` }}
        whileHover={{ scale: 1.1 }}
      >
        <HubIcon>
          <FaGlobe />
        </HubIcon>
        <HubTitle>Trading Hub</HubTitle>
      </TradingHub>

      {/* Orbiting Assets */}
      <OrbitContainer style={{ transform: `translate(-50%, -50%) rotateY(${rotation}deg)` }}>
        {assets.map(asset => (
          <AssetOrbit
            key={asset.id}
            radius={asset.radius}
            duration={asset.duration}
            delay={asset.delay}
          >
            <AssetPlanet
              size={asset.size}
              gradient={asset.gradient}
              glowColor={asset.glowColor}
              onClick={() => handleAssetClick(asset)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <AssetIcon size={asset.size}>
                {asset.icon}
              </AssetIcon>
              <AssetLabel borderColor={asset.glowColor}>
                {asset.name}
              </AssetLabel>
            </AssetPlanet>
          </AssetOrbit>
        ))}
      </OrbitContainer>

      {/* UI Overlay */}
      <UIOverlay>
        <Title
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          Trading Constellation
        </Title>
        <Instructions
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          🚀 Click on any asset planet to begin your trading journey<br />
          🌌 Drag to rotate the constellation view
        </Instructions>
      </UIOverlay>

      {/* Zoomed Asset View */}
      <AnimatePresence>
        {zoomedAsset && (
          <ZoomOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <ZoomedAsset
              gradient={zoomedAsset.gradient}
              glowColor={zoomedAsset.glowColor}
              initial={{ scale: 0, rotateY: -180 }}
              animate={{ scale: 1, rotateY: 0 }}
              exit={{ scale: 0, rotateY: 180 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <ZoomedIcon>{zoomedAsset.icon}</ZoomedIcon>
              <ZoomedName>{zoomedAsset.name}</ZoomedName>
              <ZoomedDescription>{zoomedAsset.description}</ZoomedDescription>
              <StartButton
                onClick={handleStartTest}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Begin Test 🚀
              </StartButton>
            </ZoomedAsset>
          </ZoomOverlay>
        )}
      </AnimatePresence>

      {/* Timeframe Modal */}
      {showTimeframeModal && (
        <TimeframeModal
          assetName={selectedAsset?.name}
          onSelect={handleTimeframeSelect}
          onClose={handleCloseModal}
        />
      )}
    </ConstellationContainer>
  );
};

export default memo(TradingConstellation);