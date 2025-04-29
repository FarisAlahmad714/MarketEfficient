import React, { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import Image from 'next/image';
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
} from 'react-icons/fa';
import TimeframeModal from './TimeframeModal';

// Styled Components
const Container = styled.div`
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 50px;
`;

const Title = styled.h1`
  font-size: 2.8rem;
  margin-bottom: 15px;
  background: linear-gradient(90deg, #00c4ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
  font-size: 1.2rem;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.7;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  max-width: 500px;
  margin: 20px auto;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
`;

const Card = styled(motion.div)`
  height: 450px;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  cursor: pointer;
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(10, 10, 10, 0.7), rgba(10, 10, 10, 0.9));
  z-index: 1;
  transition: transform 0.5s ease;

  ${Card}:hover & {
    transform: scale(1.1);
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
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: white;
  margin-bottom: 20px;
`;

const AssetName = styled.h3`
  font-size: 1.6rem;
  color: white;
  margin-bottom: 15px;
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
  justify-content: space-between;
  padding: 12px 25px;
  color: white;
  border-radius: 50px;
  text-decoration: none;
  font-weight: bold;
  border: none;
  cursor: pointer;
  width: 100%;
  margin-top: auto;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  }

  & i {
    margin-left: 10px;
    transition: transform 0.3s ease;
  }

  &:hover i {
    transform: translateX(5px);
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
  const router = useRouter();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/assets');
        setAssets(response.data);
        setFilteredAssets(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError('Failed to load assets. Please try again later.');
      } finally {
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
    }
    return '#cc33ff';
  };

  const getDescription = (asset) => {
    if (asset.type === 'crypto') {
      return `Challenge yourself with ${asset.name} price predictions across various timeframes.`;
    } else if (asset.type === 'equity') {
      return `Predict ${asset.name} stock trends and test your market analysis skills.`;
    }
    return `Dive into a diverse asset mix with ${asset.name} and sharpen your forecasting abilities.`;
  };

  if (loading) {
    return (
      <Loader>
        <Spinner />
        <p style={{ fontSize: '1.2rem' }}>Loading assets...</p>
      </Loader>
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

  return (
    <Container>
      <Header>
        <Title>
          Select Your <Highlight>Asset</Highlight>
        </Title>
        <Subtitle>
          Hone your market prediction skills by analyzing price charts and
          forecasting trends.
        </Subtitle>
        <SearchBar>
          <FaSearch style={{ color: '#a0a0a0', marginRight: '10px' }} />
          <SearchInput
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search assets"
          />
        </SearchBar>
      </Header>

      <Grid>
        <AnimatePresence>
          {filteredAssets.map((asset) => (
            <Card
              key={asset.id}
              onClick={() => handleAssetSelect(asset)}
              whileHover={{ scale: 1.05, rotateX: 2, rotateY: 2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300 }}
              aria-label={`Select ${asset.name} for testing`}
            >
              <Image
                src={getImageSrc(asset.type, asset.symbol)}
                alt={`${asset.name} background`}
                fill
                sizes="100%"
                style={{ objectFit: 'cover' }}
                quality={80}
                priority={false}
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
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
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
      </Grid>

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