import React, { useState, useEffect, memo, useRef, useCallback, useContext } from 'react'; // Added useRef and useCallback here
import { ThemeContext } from '../contexts/ThemeContext';

import { useRouter } from 'next/router';
import axios from 'axios';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import Image from 'next/image';
import CryptoLoader from './CryptoLoader'; 
import {
  FaBitcoin,
  FaEthereum,
  FaApple,
  FaCar,
  FaMicrochip,
  FaCoins,
  FaChartLine,
  FaArrowRight,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaPause,
  FaPlay,
  FaOilCan,
  FaGem,
  FaFire,
} from 'react-icons/fa';
import TimeframeModal from './TimeframeModal';

// Styled Components
const Container = styled.div`
  padding: 60px 20px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  position: relative;
  overflow: hidden;
`;

const FloatingElement = styled.div`
  position: absolute;
  width: ${props => props.size || '20px'};
  height: ${props => props.size || '20px'};
  background: ${props => props.color || 'rgba(0, 196, 255, 0.1)'};
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
  animation-delay: ${props => props.delay || '0s'};
  opacity: 0.6;
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    25% { transform: translateY(-20px) rotate(90deg); }
    50% { transform: translateY(-10px) rotate(180deg); }
    75% { transform: translateY(-15px) rotate(270deg); }
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 80px;
  position: relative;
  z-index: 2;
`;

const Title = styled.h1`
  font-size: 3.5rem;
  margin-bottom: 25px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  position: relative;
  color: ${({ darkMode }) => (darkMode ? '#FFFFFF' : '#1A1A1A')};
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 4px;
    background: ${({ darkMode }) => (darkMode ? 'linear-gradient(90deg, #00c4ff, #00ff88)' : 'linear-gradient(90deg, #4f46e5, #14b8a6)')};
    border-radius: 2px;
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.6; transform: translateX(-50%) scaleX(1); }
    50% { opacity: 1; transform: translateX(-50%) scaleX(1.2); }
  }
`;

const Highlight = styled.span`
  color:rgb(193, 182, 63);
  position: relative;
  z-index: 1;
  -webkit-background-clip: initial;
  -webkit-text-fill-color: initial;
  background: none;
`;

const Subtitle = styled.p`
  color: #b0b0b0;
  font-size: 1.3rem;
  max-width: 800px;
  margin: 0 auto 40px;
  line-height: 1.8;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(0, 196, 255, 0.3);
    box-shadow: 0 8px 25px rgba(0, 196, 255, 0.1);
  }
  
  &:focus-within {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(0, 196, 255, 0.5);
    box-shadow: 0 8px 25px rgba(0, 196, 255, 0.2);
  }
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 1rem;
  outline: none;
  &::placeholder {
    color: #a0a0a0;
  }
`;

const CategorySection = styled.div`
  margin-bottom: 80px;
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    top: 50%;
    z-index: 1;
  }
`;

const CategoryTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  padding: 0 40px;
  position: relative;
  z-index: 2;
  text-align: center;
  letter-spacing: -0.02em;
  color: ${({ darkMode }) => (darkMode ? '#e0e0e0' : '#1a1a1a')};
  background: none;
  
  &.crypto {
    background: linear-gradient(135deg, #F7931A, #FF9900);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  &.equity {
    background: linear-gradient(135deg, #3366cc, #1a3399);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  @media (max-width: 768px) {
    font-size: 2rem;
    padding: 0 20px;
  }
`;

const CarouselContainer = styled.div`
  position: relative;
  overflow: hidden;
  margin: 0 -20px;
  
  @media (max-width: 768px) {
    margin: 0 -10px;
  }
`;

const CarouselTrack = styled(motion.div)`
  display: flex;
  gap: 30px;
  padding: 0 20px;
  will-change: transform;
  
  @media (max-width: 768px) {
    gap: 20px;
    padding: 0 10px;
  }
`;

const CarouselControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  
  @media (max-width: 768px) {
    gap: 15px;
  }
`;

const CarouselButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.1);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: scale(1);
  }
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
`;

const CarouselIndicators = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const CarouselIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)'};
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.6);
    transform: scale(1.2);
  }
`;

const AutoPlayIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const Card = styled(motion.div)`
  height: 400px;
  width: 320px;
  min-width: 320px;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-8px) scale(1.03);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.6s;
    z-index: 3;
  }
  
  &:hover::before {
    transform: translateX(100%);
  }
  
  @media (max-width: 768px) {
    width: 280px;
    min-width: 280px;
    height: 360px;
  }
  
  @media (max-width: 480px) {
    width: 260px;
    min-width: 260px;
    height: 340px;
  }
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
  z-index: 1;
  transition: all 0.4s ease;

  ${Card}:hover & {
    background: linear-gradient(
      135deg,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(0, 0, 0, 0.2) 50%,
      rgba(0, 0, 0, 0.5) 100%
    );
  }
`;

const CardContent = styled.div`
  position: relative;
  z-index: 2;
  padding: 1px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.2), transparent, rgba(255, 255, 255, 0.2));
    border-radius: 50%;
    z-index: -1;
  }
  
  ${Card}:hover & {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  }
`;

const AssetName = styled.h3`
  font-size: 1.8rem;
  color: white;
  margin-bottom: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  
  ${Card}:hover & {
    color: #fff;
    text-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
  }
`;

const AssetType = styled.div`
  display: inline-block;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 25px;
  font-size: 0.9rem;
  color: #fff;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
`;

const AssetTypeIcon = styled.span`
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 5px;
`;

const Description = styled.p`
  color: #b0b0b0;
  margin-bottom: 20px;
  line-height: 1.5;
  flex-grow: 0.5;
`;

const TimeframeIcon = styled(FaChartLine)`
  margin-right: 8px;
`;

const TimeframeNote = styled.div`
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
`;

const StartButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 32px;
  color: white;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  width: 100%;
  margin-top: auto;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover::before {
    left: 100%;
  }

  &:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(-1px) scale(0.98);
  }

  & svg {
    transition: all 0.3s ease;
    font-size: 1.2rem;
  }

  &:hover svg {
    transform: translateX(3px) scale(1.1);
  }
`;

const Loader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #a0a0a0;
`;

const Spinner = styled.div`
  width: 70px;
  height: 70px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #00c4ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 25px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  text-align: center;
  color: #ff4d4d;
  min-height: 400px;
`;

const ErrorIcon = styled.div`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgba(255, 77, 77, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 25px;
`;

const RetryButton = styled.button`
  margin-top: 25px;
  padding: 14px 30px;
  background: #00c4ff;
  color: #fff;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
`;

// AssetSelector Component
const AssetSelector = () => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTimeframeModal, setShowTimeframeModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // Carousel state
  const [cryptoCurrentIndex, setCryptoCurrentIndex] = useState(0);
  const [equityCurrentIndex, setEquityCurrentIndex] = useState(0);
  const [commodityCurrentIndex, setCommodityCurrentIndex] = useState(0);
  const [cryptoAutoPlay, setCryptoAutoPlay] = useState(false);
  const [equityAutoPlay, setEquityAutoPlay] = useState(false);
  const [commodityAutoPlay, setCommodityAutoPlay] = useState(false);
  
  const router = useRouter();
  const cryptoLoaderRef = useRef(null);
  const cryptoIntervalRef = useRef(null);
  const equityIntervalRef = useRef(null);
  const commodityIntervalRef = useRef(null); 

  const { darkMode } = useContext(ThemeContext);

 useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/assets');
        setAssets(response.data);
        setFilteredAssets(response.data);
        setError(null);
        
        // Add a small delay to make the loading animation more noticeable
        setTimeout(() => {
          setLoading(false);
          if (cryptoLoaderRef.current) {
            cryptoLoaderRef.current.hideLoader();
          }
        }, 1500);
      } catch (err) {
        setError('Failed to load assets. Please try again later.');
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);


  useEffect(() => {
    const filtered = assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAssets(filtered);
  }, [searchQuery, assets]);

  // Separate assets by type
  const cryptoAssets = filteredAssets.filter(asset => asset.type === 'crypto');
  const equityAssets = filteredAssets.filter(asset => asset.type === 'equity');
  const commodityAssets = filteredAssets.filter(asset => asset.type === 'commodity');
  
  // Carousel logic
  const ITEMS_PER_VIEW = {
    desktop: 3,
    tablet: 2,
    mobile: 1
  };
  
  const getItemsPerView = useCallback(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth <= 480) return ITEMS_PER_VIEW.mobile;
      if (window.innerWidth <= 768) return ITEMS_PER_VIEW.tablet;
    }
    return ITEMS_PER_VIEW.desktop;
  }, []);
  
  const [itemsPerView, setItemsPerView] = useState(getItemsPerView());
  
  // Ensure carousel auto-plays on mobile view only
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const MOBILE_MAX_WIDTH = 480;

    const applyAutoPlaySetting = () => {
      const isMobile = window.innerWidth <= MOBILE_MAX_WIDTH;
      setCryptoAutoPlay(isMobile);
      setEquityAutoPlay(isMobile);
      setCommodityAutoPlay(isMobile);
    };

    applyAutoPlaySetting();

    // Update on resize so behaviour follows viewport changes
    window.addEventListener('resize', applyAutoPlaySetting);
    return () => window.removeEventListener('resize', applyAutoPlaySetting);
  }, []);
  
  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getItemsPerView]);
  
  // Auto-play functionality
  useEffect(() => {
    if (cryptoAutoPlay && cryptoAssets.length > itemsPerView) {
      cryptoIntervalRef.current = setInterval(() => {
        setCryptoCurrentIndex(prev => 
          prev >= cryptoAssets.length - itemsPerView ? 0 : prev + 1
        );
      }, 3000);
    }
    return () => clearInterval(cryptoIntervalRef.current);
  }, [cryptoAutoPlay, cryptoAssets.length, itemsPerView]);
  
  useEffect(() => {
    if (equityAutoPlay && equityAssets.length > itemsPerView) {
      equityIntervalRef.current = setInterval(() => {
        setEquityCurrentIndex(prev => 
          prev >= equityAssets.length - itemsPerView ? 0 : prev + 1
        );
      }, 3500); // Slightly different timing for variety
    }
    return () => clearInterval(equityIntervalRef.current);
  }, [equityAutoPlay, equityAssets.length, itemsPerView]);
  
  useEffect(() => {
    if (commodityAutoPlay && commodityAssets.length > itemsPerView) {
      commodityIntervalRef.current = setInterval(() => {
        setCommodityCurrentIndex(prev => 
          prev >= commodityAssets.length - itemsPerView ? 0 : prev + 1
        );
      }, 4000); // Different timing for commodities
    }
    return () => clearInterval(commodityIntervalRef.current);
  }, [commodityAutoPlay, commodityAssets.length, itemsPerView]);
  
  // Carousel navigation functions
  const navigateCrypto = useCallback((direction) => {
    setCryptoCurrentIndex(prev => {
      if (direction === 'prev') {
        return prev === 0 ? Math.max(0, cryptoAssets.length - itemsPerView) : prev - 1;
      } else {
        return prev >= cryptoAssets.length - itemsPerView ? 0 : prev + 1;
      }
    });
  }, [cryptoAssets.length, itemsPerView]);
  
  const navigateEquity = useCallback((direction) => {
    setEquityCurrentIndex(prev => {
      if (direction === 'prev') {
        return prev === 0 ? Math.max(0, equityAssets.length - itemsPerView) : prev - 1;
      } else {
        return prev >= equityAssets.length - itemsPerView ? 0 : prev + 1;
      }
    });
  }, [equityAssets.length, itemsPerView]);
  
  const goToCryptoSlide = useCallback((index) => {
    setCryptoCurrentIndex(index);
  }, []);
  
  const goToEquitySlide = useCallback((index) => {
    setEquityCurrentIndex(index);
  }, []);
  
  const navigateCommodity = useCallback((direction) => {
    setCommodityCurrentIndex(prev => {
      if (direction === 'prev') {
        return prev === 0 ? Math.max(0, commodityAssets.length - itemsPerView) : prev - 1;
      } else {
        return prev >= commodityAssets.length - itemsPerView ? 0 : prev + 1;
      }
    });
  }, [commodityAssets.length, itemsPerView]);
  
  const goToCommoditySlide = useCallback((index) => {
    setCommodityCurrentIndex(index);
  }, []);

  const handleAssetSelect = (asset) => {
    setSelectedAsset(asset);
    setShowTimeframeModal(true);
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
  };

  const getGradient = (type, symbol) => {
    if (type === 'crypto') {
      if (symbol === 'btc') return 'linear-gradient(135deg, #F7931A, #FF9900)';
      if (symbol === 'eth') return 'linear-gradient(135deg, #627EEA, #829FFF)';
      if (symbol === 'sol') return 'linear-gradient(135deg, #00FFA3, #DC1FFF)';
      if (symbol === 'bnb') return 'linear-gradient(135deg, #f0b90b, #d4a017)';
      return 'linear-gradient(135deg, #00c4ff, #0077cc)';
    } else if (type === 'equity') {
      if (symbol === 'aapl') return 'linear-gradient(135deg, #A2AAAD, #000000)';
      if (symbol === 'tsla') return 'linear-gradient(135deg, #E82127, #8B0000)';
      if (symbol === 'nvda') return 'linear-gradient(135deg, #76B900, #1A5200)';
      if (symbol === 'gld') return 'linear-gradient(135deg, #FFD700, #B8860B)';
      return 'linear-gradient(135deg, #3366cc, #1a3399)';
    } else if (type === 'commodity') {
      if (symbol === 'xau') return 'linear-gradient(135deg, #FFD700, #B8860B)';
      if (symbol === 'crude') return 'linear-gradient(135deg, #2C1810, #8B4513)';
      if (symbol === 'silver') return 'linear-gradient(135deg, #C0C0C0, #808080)';
      if (symbol === 'gas') return 'linear-gradient(135deg, #4169E1, #1E90FF)';
      return 'linear-gradient(135deg, #8B4513, #654321)';
    }
    return 'linear-gradient(135deg, #cc33ff, #9933cc)';
  };

  const getImageSrc = (type, symbol) => {
    let imageUrl = '';

    if (type === 'crypto') {
      if (symbol === 'btc') {
        imageUrl = 'https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&w=800&q=60';
        // For production: imageUrl = '/images/assets/bitcoin-coin.webp';
      } else if (symbol === 'eth') {
        imageUrl = 'https://imageio.forbes.com/specials-images/imageserve/66f508976bb31223eca58524/An-image-of-an-Ethereum-crypto-coin-to-represent-the-question-what-is-Ethereum-/960x0.jpg?format=jpg&width=960';
        // For production: imageUrl = '/images/assets/ethereum-coin.webp';
      } else if (symbol === 'sol') {
        imageUrl = 'https://www.chainalysis.com/wp-content/uploads/2023/03/solana-min-scaled-1.jpg';
        // For production: imageUrl = '/images/assets/solana-blockchain.webp';
      } else if (symbol === 'bnb') {
        imageUrl = 'https://images.unsplash.com/photo-1639322537504-6427a16b0a28?auto=format&w=800&q=60';
        // For production: imageUrl = '/images/assets/bnb-logo.webp';
      }
    } else if (type === 'equity') {
      if (symbol === 'aapl') {
        imageUrl = 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&w=800&q=60';
        // For production: imageUrl = '/images/assets/apple-product.webp';
      } else if (symbol === 'tsla') {
        imageUrl = 'https://images.unsplash.com/photo-1617704548623-340376564e68?auto=format&w=800&q=60';
        // For production: imageUrl = '/images/assets/tesla-car.webp';
      } else if (symbol === 'nvda') {
        imageUrl = 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&w=800&q=60';
        // For production: imageUrl = '/images/assets/nvidia-tech.webp';
      } else if (symbol === 'gld') {
        imageUrl = 'https://images.unsplash.com/photo-1610375461369-d613b564f4c4?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Z29sZHxlbnwwfHwwfHx8MA%3D%3D';
        // For production: imageUrl = '/images/assets/gold-bars.webp';
      }
    } else if (type === 'commodity') {
      if (symbol === 'xau') {
        imageUrl = 'https://images.unsplash.com/photo-1610375461369-d613b564f4c4?w=1200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Z29sZHxlbnwwfHwwfHx8MA%3D%3D';
        // For production: imageUrl = '/images/assets/gold-spot.webp';
      } else if (symbol === 'crude') {
        imageUrl = 'https://images.unsplash.com/photo-1615796153287-98eacf0abb13?auto=format&w=800&q=60';
        // For production: imageUrl = '/images/assets/crude-oil.webp';
      } else if (symbol === 'silver') {
        imageUrl = 'https://images.unsplash.com/photo-1609792858289-1bb1c2ce8ead?auto=format&w=800&q=60';
        // For production: imageUrl = '/images/assets/silver-bars.webp';
      } else if (symbol === 'gas') {
        imageUrl = 'https://images.unsplash.com/photo-1617704548623-340376564e68?auto=format&w=800&q=60';
        // For production: imageUrl = '/images/assets/natural-gas.webp';
      }
    } else if (type === 'mixed') {
      imageUrl = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&w=800&q=60';
      // For production: imageUrl = '/images/assets/mixed-financial.webp';
    }

    if (!imageUrl) {
      if (type === 'crypto') {
        imageUrl = 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&w=800&q=60';
        // For production: imageUrl = '/images/assets/generic-crypto.webp';
      } else if (type === 'equity') {
        imageUrl = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&w=800&q=60';
        // For production: imageUrl = '/images/assets/stock-market.webp';
      } else {
        imageUrl = 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&w=800&q=60';
        // For production: imageUrl = '/images/assets/financial-dashboard.webp';
      }
    }

    return imageUrl;
  };

  const getIcon = (type, symbol) => {
    if (type === 'crypto') {
      if (symbol === 'btc') return <FaBitcoin />;
      if (symbol === 'eth') return <FaEthereum />;
      if (symbol === 'sol') return <FaCoins />;
      if (symbol === 'bnb') return <FaCoins />;
      return <FaCoins />;
    } else if (type === 'equity') {
      if (symbol === 'aapl') return <FaApple />;
      if (symbol === 'tsla') return <FaCar />;
      if (symbol === 'nvda') return <FaMicrochip />;
      if (symbol === 'gld') return <FaCoins />;
      return <FaChartLine />;
    } else if (type === 'commodity') {
      if (symbol === 'xau') return <FaCoins />;
      if (symbol === 'crude') return <FaOilCan />;
      if (symbol === 'silver') return <FaGem />;
      if (symbol === 'gas') return <FaFire />;
      return <FaCoins />;
    }
    return <FaChartLine />;
  };

  const getToolBlogInfoColor = (type, symbol) => {
    if (type === 'crypto') {
      if (symbol === 'btc') return '#F7931A';
      if (symbol === 'eth') return '#627EEA';
      if (symbol === 'sol') return '#00FFA3';
      if (symbol === 'bnb') return '#f0b90b';
      return '#00c4ff';
    } else if (type === 'equity') {
      if (symbol === 'aapl') return '#A2AAAD';
      if (symbol === 'tsla') return '#E82127';
      if (symbol === 'nvda') return '#76B900';
      if (symbol === 'gld') return '#FFD700';
      return '#3366cc';
    } else if (type === 'commodity') {
      if (symbol === 'xau') return '#FFD700';
      if (symbol === 'crude') return '#8B4513';
      if (symbol === 'silver') return '#C0C0C0';
      if (symbol === 'gas') return '#4169E1';
      return '#8B4513';
    }
    return '#cc33ff';
  };

  const getDescription = (asset) => {
    if (asset.type === 'crypto') {
      return `Challenge yourself with ${asset.name} price predictions across various timeframes.`;
    } else if (asset.type === 'equity') {
      return `Predict ${asset.name} stock trends and test your market analysis skills.`;
    } else if (asset.type === 'commodity') {
      return `Test your commodity market insights with ${asset.name} price movements.`;
    }
    return `Dive into a diverse asset mix with ${asset.name} and sharpen your forecasting abilities.`;
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', minHeight: '400px' }}>
        <CryptoLoader 
          ref={cryptoLoaderRef} 
          message="Loading available assets..." 
          height="400px" 
          minDisplayTime={1500} 
        />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <ErrorIcon>
          <FaCoins style={{ fontSize: '2.5rem', color: '#ff4d4d' }} />
        </ErrorIcon>
        <h3 style={{ marginBottom: '15px', fontSize: '1.5rem' }}>
          Error Loading Assets
        </h3>
        <p>{error}</p>
        <RetryButton onClick={() => window.location.reload()}>
          <FaChartLine style={{ marginRight: '10px' }} />
          Retry
        </RetryButton>
      </ErrorContainer>
    );
  }

  const renderCarousel = (assets, currentIndex, navigate, goToSlide, autoPlay, setAutoPlay, categoryName) => {
    if (assets.length === 0) return null;
    
    const maxIndex = Math.max(0, assets.length - itemsPerView);
    const canNavigate = assets.length > itemsPerView;
    
    return (
      <CategorySection>
        <CategoryHeader>
          <CategoryTitle darkMode={darkMode} className={categoryName.toLowerCase()}>
            {categoryName}
          </CategoryTitle>
        </CategoryHeader>
        
        <CarouselContainer>
          <CarouselTrack
            animate={{
              x: -(currentIndex * (320 + 30)) // card width + gap
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            <AnimatePresence>
              {assets.map((asset, index) => (
                <Card
                  key={asset.id}
                  onClick={() => handleAssetSelect(asset)}
                  initial={{ opacity: 0, y: 50, rotateX: -10 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  exit={{ opacity: 0, y: -50, scale: 0.9 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.05,
                    ease: "easeOut" 
                  }}
                  whileHover={{ 
                    rotateX: 3, 
                    rotateY: 3,
                    transition: { duration: 0.3 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  aria-label={`Select ${asset.name} for testing`}
                >
                  <Image
                    src={getImageSrc(asset.type, asset.symbol)}
                    alt={`${asset.name} background`}
                    fill
                    sizes="320px"
                    style={{ objectFit: 'cover' }}
                    quality={80}
                    priority={index < 3}
                  />
                  <Overlay />
                  <CardContent>
                    <div>
                      <IconWrapper style={{ background: getGradient(asset.type, asset.symbol) }}>
                        {getIcon(asset.type, asset.symbol)}
                      </IconWrapper>
                      <AssetName>{asset.name}</AssetName>
                      <AssetType>
                        <AssetTypeIcon as={() => getIcon(asset.type, asset.symbol)} />
                        {asset.type}
                      </AssetType>
                      <Description>{getDescription(asset)}</Description>
                    </div>
                    <div>
                      <TimeframeNote>
                        <TimeframeIcon style={{ color: getToolBlogInfoColor(asset.type, asset.symbol) }} />
                        Available on multiple timeframes
                      </TimeframeNote>
                      <StartButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssetSelect(asset);
                        }}
                        style={{ background: getGradient(asset.type, asset.symbol) }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={`Start test for ${asset.name}`}
                      >
                        Start Test
                        <FaArrowRight />
                      </StartButton>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </AnimatePresence>
          </CarouselTrack>
        </CarouselContainer>
        
        {canNavigate && (
          <CarouselControls>
            <CarouselButton 
              onClick={() => navigate('prev')}
              disabled={currentIndex === 0}
              aria-label="Previous assets"
            >
              <FaChevronLeft />
            </CarouselButton>
            
            <CarouselIndicators>
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <CarouselIndicator
                  key={index}
                  active={index === currentIndex}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </CarouselIndicators>
            
            <CarouselButton 
              onClick={() => setAutoPlay(!autoPlay)}
              aria-label={autoPlay ? 'Pause auto-play' : 'Start auto-play'}
            >
              {autoPlay ? <FaPause /> : <FaPlay />}
            </CarouselButton>
            
            <CarouselButton 
              onClick={() => navigate('next')}
              disabled={currentIndex >= maxIndex}
              aria-label="Next assets"
            >
              <FaChevronRight />
            </CarouselButton>
          </CarouselControls>
        )}
        
      </CategorySection>
    );
  };

  return (
    <Container>
      {/* Floating Elements */}
      <FloatingElement 
        size="30px" 
        color="rgba(0, 196, 255, 0.1)" 
        delay="0s"
        style={{ top: '10%', left: '5%' }}
      />
      <FloatingElement 
        size="20px" 
        color="rgba(0, 255, 136, 0.1)" 
        delay="2s"
        style={{ top: '20%', right: '10%' }}
      />
      <FloatingElement 
        size="25px" 
        color="rgba(255, 107, 107, 0.1)" 
        delay="4s"
        style={{ bottom: '30%', left: '8%' }}
      />
      <FloatingElement 
        size="35px" 
        color="rgba(0, 196, 255, 0.08)" 
        delay="1s"
        style={{ top: '60%', right: '5%' }}
      />
      <FloatingElement 
        size="18px" 
        color="rgba(0, 255, 136, 0.12)" 
        delay="3s"
        style={{ bottom: '10%', right: '15%' }}
      />

      <Header>
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Title darkMode={darkMode}>
            Select Your <Highlight>Asset</Highlight>
          </Title>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        >
          <Subtitle>
            Challenge your market prediction skills by analyzing real-time price charts and
            forecasting market trends across multiple asset classes.
          </Subtitle>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        >
          <SearchBar>
            <FaSearch style={{ color: '#a0a0a0', marginRight: '12px', fontSize: '1.1rem' }} />
            <SearchInput
              type="text"
              placeholder="Search assets... (More assets coming soon)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search assets"
            />
          </SearchBar>
        </motion.div>
      </Header>

      <div style={{ marginTop: '80px' }}>
        {/* Crypto Assets Carousel */}
        {renderCarousel(
          cryptoAssets, 
          cryptoCurrentIndex, 
          navigateCrypto, 
          goToCryptoSlide, 
          cryptoAutoPlay, 
          setCryptoAutoPlay,
          'Cryptocurrency'
        )}
        
        {/* Equity Assets Carousel */}
        {renderCarousel(
          equityAssets, 
          equityCurrentIndex, 
          navigateEquity, 
          goToEquitySlide, 
          equityAutoPlay, 
          setEquityAutoPlay,
          'Equities'
        )}
        
        {/* Commodity Assets Carousel */}
        {renderCarousel(
          commodityAssets, 
          commodityCurrentIndex, 
          navigateCommodity, 
          goToCommoditySlide, 
          commodityAutoPlay, 
          setCommodityAutoPlay,
          'Commodities'
        )}
      </div>

      {showTimeframeModal && (
        <TimeframeModal
          assetName={selectedAsset?.name}
          onSelect={handleTimeframeSelect}
          onClose={handleCloseModal}
        />
      )}
    </Container>
  );
};

AssetSelector.propTypes = {};

export default memo(AssetSelector);