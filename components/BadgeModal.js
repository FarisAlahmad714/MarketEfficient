// components/BadgeModal.js
import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { X, Trophy, Lock, Star, Share2 } from 'lucide-react';
import SocialShareModal from './profile/SocialShareModal';

const BadgeModal = ({ isOpen, onClose, userBadges = [], isOwnProfile = false, profileUrl = '' }) => {
  const { darkMode } = useContext(ThemeContext);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState(null);
  

  // Share badge functionality using SocialShareModal
  const shareBadge = (badge) => {
    setShareData({
      type: 'badge',
      id: badge.id,
      title: badge.title,
      description: badge.description,
      rarity: badge.rarity,
      icon: badge.icon,
      color: badge.color,
      category: badge.category
    });
    setShowShareModal(true);
  };

  // All possible badges in the system
  const allBadges = [
    // Initiation
    {
      id: 'market_awakening',
      title: 'Market Awakening',
      description: 'Taken your first step into the trading matrix',
      icon: '🌅',
      color: '#FF6B35',
      rarity: 'common',
      category: 'initiation',
      requirement: '1+ test completed'
    },

    // Technical Mastery
    {
      id: 'chart_sensei',
      title: 'Chart Sensei',
      description: '98%+ across ALL assets with 150+ tests - The ultimate master who reads market souls',
      icon: '🥋',
      color: '#8B0000',
      rarity: 'mythic',
      category: 'mastery',
      requirement: '98%+ avg across all assets with 150+ tests + 25+ perfect scores'
    },
    {
      id: 'chart_whisperer',
      title: 'Chart Whisperer',
      description: '95%+ average with 50+ tests - You see what others miss',
      icon: '🔮',
      color: '#8E44AD',
      rarity: 'mythic',
      category: 'mastery',
      requirement: '95%+ avg score with 50+ tests'
    },
    {
      id: 'chart_seeker',
      title: 'Chart Seeker',
      description: '88%+ across 5+ assets with 75+ tests - Hunting patterns across all markets',
      icon: '🗺️',
      color: '#FFD700',
      rarity: 'legendary',
      category: 'mastery',
      requirement: '88%+ avg with 75+ tests across 5+ different assets'
    },
    {
      id: 'pattern_prophet',
      title: 'Pattern Prophet',
      description: '90%+ average with 30+ tests - Predicting market moves',
      icon: '🧙‍♂️',
      color: '#FFD700',
      rarity: 'legendary',
      category: 'mastery',
      requirement: '90%+ avg score with 30+ tests'
    },
    {
      id: 'technical_sage',
      title: 'Technical Sage',
      description: '85%+ average with 20+ tests - True understanding',
      icon: '📜',
      color: '#2ECC71',
      rarity: 'epic',
      category: 'mastery',
      requirement: '85%+ avg score with 20+ tests'
    },
    {
      id: 'trend_hunter',
      title: 'Trend Hunter',
      description: '75%+ average with 15+ tests - Tracking the flow',
      icon: '🎯',
      color: '#3498DB',
      rarity: 'rare',
      category: 'mastery',
      requirement: '75%+ avg score with 15+ tests'
    },

    // Crypto Asset Mastery
    {
      id: 'bitcoin_wizard',
      title: 'Bitcoin Wizard',
      description: '95%+ on Bitcoin with 50+ tests - Master of digital gold spells',
      icon: '🧙‍♂️',
      color: '#F7931A',
      rarity: 'mythic',
      category: 'mastery',
      requirement: '95%+ avg on Bitcoin tests with 50+ tests'
    },
    {
      id: 'bitcoin_bull',
      title: 'Bitcoin Bull',
      description: '85%+ with 25+ Bitcoin tests - Charging through volatility',
      icon: '🐂',
      color: '#F7931A',
      rarity: 'legendary',
      category: 'mastery',
      requirement: '85%+ avg with 25+ Bitcoin tests'
    },
    {
      id: 'bitcoin_buster',
      title: 'Bitcoin Buster',
      description: '75%+ with 15+ Bitcoin tests - Breaking through resistance',
      icon: '💥',
      color: '#F7931A',
      rarity: 'epic',
      category: 'mastery',
      requirement: '75%+ avg with 15+ Bitcoin tests'
    },
    {
      id: 'ethereum_enchanter',
      title: 'Ethereum Enchanter',
      description: '85%+ with 25+ Ethereum tests - Weaving smart contract magic',
      icon: '🔮',
      color: '#627EEA',
      rarity: 'legendary',
      category: 'mastery',
      requirement: '85%+ avg with 25+ Ethereum tests'
    },
    {
      id: 'ethereum_dapper',
      title: 'Ethereum dApper',
      description: '75%+ with 15+ Ethereum tests - Smooth moves in DeFi',
      icon: '🎩',
      color: '#627EEA',
      rarity: 'epic',
      category: 'mastery',
      requirement: '75%+ avg with 15+ Ethereum tests'
    },
    {
      id: 'solana_strategist',
      title: 'Solana Strategist',
      description: '80%+ with 20+ Solana tests - Lightning-fast blockchain tactics',
      icon: '⚡',
      color: '#9945FF',
      rarity: 'epic',
      category: 'mastery',
      requirement: '80%+ avg with 20+ Solana tests'
    },
    {
      id: 'solana_sorcerer',
      title: 'Solana Sorcerer',
      description: '85%+ with 30+ Solana tests - High-speed spell casting',
      icon: '🔥',
      color: '#9945FF',
      rarity: 'legendary',
      category: 'mastery',
      requirement: '85%+ avg with 30+ Solana tests'
    },
    {
      id: 'bnb_buccaneer',
      title: 'BNB Buccaneer',
      description: '80%+ with 20+ BNB tests - Sailing the Binance seas',
      icon: '🏴‍☠️',
      color: '#F3BA2F',
      rarity: 'epic',
      category: 'mastery',
      requirement: '80%+ avg with 20+ BNB tests'
    },
    {
      id: 'bnb_beacon',
      title: 'BNB Beacon',
      description: '85%+ with 25+ BNB tests - Guiding ships through exchange waters',
      icon: '🗼',
      color: '#F3BA2F',
      rarity: 'legendary',
      category: 'mastery',
      requirement: '85%+ avg with 25+ BNB tests'
    },

    // Tech Stock Mastery
    {
      id: 'apple_visionary',
      title: 'Apple Visionary',
      description: '90%+ with 30+ Apple tests - Seeing the future in every bite',
      icon: '🍎',
      color: '#007AFF',
      rarity: 'legendary',
      category: 'mastery',
      requirement: '90%+ avg with 30+ Apple tests'
    },
    {
      id: 'apple_innovator',
      title: 'Apple Innovator',
      description: '85%+ with 25+ Apple tests - Thinking different about charts',
      icon: '💡',
      color: '#007AFF',
      rarity: 'epic',
      category: 'mastery',
      requirement: '85%+ avg with 25+ Apple tests'
    },
    {
      id: 'apple_architect',
      title: 'Apple Architect',
      description: '80%+ with 20+ Apple tests - Building beautiful trade structures',
      icon: '🏗️',
      color: '#007AFF',
      rarity: 'epic',
      category: 'mastery',
      requirement: '80%+ avg with 20+ Apple tests'
    },
    {
      id: 'apple_alchemist',
      title: 'Apple Alchemist',
      description: '75%+ with 15+ Apple tests - Turning analysis into gold',
      icon: '⚗️',
      color: '#007AFF',
      rarity: 'rare',
      category: 'mastery',
      requirement: '75%+ avg with 15+ Apple tests'
    },
    {
      id: 'nvidia_navigator',
      title: 'Nvidia Navigator',
      description: '85%+ with 25+ Nvidia tests - Navigating AI-powered gains',
      icon: '🧭',
      color: '#76B900',
      rarity: 'legendary',
      category: 'mastery',
      requirement: '85%+ avg with 25+ Nvidia tests'
    },
    {
      id: 'nvidia_nexus',
      title: 'Nvidia Nexus',
      description: '80%+ with 20+ Nvidia tests - Connected to the GPU matrix',
      icon: '🔗',
      color: '#76B900',
      rarity: 'epic',
      category: 'mastery',
      requirement: '80%+ avg with 20+ Nvidia tests'
    },
    {
      id: 'tesla_autopilot',
      title: 'Tesla Autopilot',
      description: '90%+ with 30+ Tesla tests - Self-driving through volatility',
      icon: '🚗',
      color: '#CC0000',
      rarity: 'legendary',
      category: 'mastery',
      requirement: '90%+ avg with 30+ Tesla tests'
    },
    {
      id: 'tesla_trailblazer',
      title: 'Tesla Trailblazer',
      description: '85%+ with 25+ Tesla tests - Blazing new paths in EV markets',
      icon: '🔥',
      color: '#CC0000',
      rarity: 'epic',
      category: 'mastery',
      requirement: '85%+ avg with 25+ Tesla tests'
    },
    {
      id: 'tesla_titan',
      title: 'Tesla Titan',
      description: '80%+ with 20+ Tesla tests - Gigantic gains understanding',
      icon: '⚡',
      color: '#CC0000',
      rarity: 'epic',
      category: 'mastery',
      requirement: '80%+ avg with 20+ Tesla tests'
    },

    // Commodities Mastery
    {
      id: 'golden_hand',
      title: 'Golden Hand',
      description: '88%+ with 35+ Gold tests - Everything you touch turns to profit',
      icon: '👑',
      color: '#FFD700',
      rarity: 'legendary',
      category: 'mastery',
      requirement: '88%+ avg with 35+ Gold tests'
    },
    {
      id: 'gold_gallant',
      title: 'Gold Gallant',
      description: '85%+ with 30+ Gold tests - Noble warrior of precious metals',
      icon: '⚔️',
      color: '#FFD700',
      rarity: 'epic',
      category: 'mastery',
      requirement: '85%+ avg with 30+ Gold tests'
    },
    {
      id: 'gold_guardian',
      title: 'Gold Guardian',
      description: '82%+ with 25+ Gold tests - Protecting wealth through wisdom',
      icon: '🛡️',
      color: '#FFD700',
      rarity: 'epic',
      category: 'mastery',
      requirement: '82%+ avg with 25+ Gold tests'
    },
    {
      id: 'goldetf_guru',
      title: 'GoldETF Guru',
      description: '80%+ with 20+ Gold ETF tests - Master of golden instruments',
      icon: '🧘‍♂️',
      color: '#DAA520',
      rarity: 'rare',
      category: 'mastery',
      requirement: '80%+ avg with 20+ Gold ETF tests'
    },
    {
      id: 'goldetf_gladiator',
      title: 'GoldETF Gladiator',
      description: '75%+ with 15+ Gold ETF tests - Fighting in the golden arena',
      icon: '🏛️',
      color: '#DAA520',
      rarity: 'rare',
      category: 'mastery',
      requirement: '75%+ avg with 15+ Gold ETF tests'
    },
    {
      id: 'silver_sentinel',
      title: 'Silver Sentinel',
      description: '80%+ with 20+ Silver tests - Standing guard over precious metals',
      icon: '🗡️',
      color: '#C0C0C0',
      rarity: 'epic',
      category: 'mastery',
      requirement: '80%+ avg with 20+ Silver tests'
    },
    {
      id: 'silver_sorcerer',
      title: 'Silver Sorcerer',
      description: '85%+ with 25+ Silver tests - Casting spells with shiny metal',
      icon: '🪄',
      color: '#C0C0C0',
      rarity: 'legendary',
      category: 'mastery',
      requirement: '85%+ avg with 25+ Silver tests'
    },
    {
      id: 'silver_surfer',
      title: 'Silver Surfer',
      description: '75%+ with 15+ Silver tests - Riding the waves of precious metal',
      icon: '🏄‍♂️',
      color: '#C0C0C0',
      rarity: 'rare',
      category: 'mastery',
      requirement: '75%+ avg with 15+ Silver tests'
    },
    {
      id: 'oil_overlord',
      title: 'Oil Overlord',
      description: '85%+ with 30+ Oil tests - Ruling the black gold empire',
      icon: '👑',
      color: '#000000',
      rarity: 'legendary',
      category: 'mastery',
      requirement: '85%+ avg with 30+ Oil tests'
    },
    {
      id: 'oil_outlaw',
      title: 'Oil Outlaw',
      description: '80%+ with 25+ Oil tests - Breaking all the rules for crude gains',
      icon: '🤠',
      color: '#000000',
      rarity: 'epic',
      category: 'mastery',
      requirement: '80%+ avg with 25+ Oil tests'
    },
    {
      id: 'oil_rig_ruler',
      title: 'Oil Rig Ruler',
      description: '82%+ with 25+ Oil tests - Commanding the drilling operations',
      icon: '🏗️',
      color: '#000000',
      rarity: 'epic',
      category: 'mastery',
      requirement: '82%+ avg with 25+ Oil tests'
    },
    {
      id: 'natural_gas_pro',
      title: 'Natural Gas Pro',
      description: '75%+ with 20+ Natural Gas tests - Professional energy trader',
      icon: '🔥',
      color: '#4169E1',
      rarity: 'rare',
      category: 'mastery',
      requirement: '75%+ avg with 20+ Natural Gas tests'
    },
    {
      id: 'natural_gas_nighthawk',
      title: 'Natural Gas Nighthawk',
      description: '80%+ with 25+ Natural Gas tests - Hunting profits in the dark',
      icon: '🦅',
      color: '#4169E1',
      rarity: 'epic',
      category: 'mastery',
      requirement: '80%+ avg with 25+ Natural Gas tests'
    },
    {
      id: 'natural_gas_nomad',
      title: 'Natural Gas Nomad',
      description: '70%+ with 15+ Natural Gas tests - Wandering the energy markets',
      icon: '🏜️',
      color: '#4169E1',
      rarity: 'rare',
      category: 'mastery',
      requirement: '70%+ avg with 15+ Natural Gas tests'
    },

    // Psychology
    {
      id: 'bias_destroyer',
      title: 'Bias Destroyer',
      description: '25+ bias tests with 80%+ avg - Mind over emotions',
      icon: '🧠',
      color: '#E74C3C',
      rarity: 'legendary',
      category: 'psychology',
      requirement: '25+ bias tests with 80%+ avg'
    },
    {
      id: 'emotional_warrior',
      title: 'Emotional Warrior',
      description: '15+ bias tests with 70%+ avg - Conquering fear & greed',
      icon: '⚔️',
      color: '#9B59B6',
      rarity: 'epic',
      category: 'psychology',
      requirement: '15+ bias tests with 70%+ avg'
    },
    {
      id: 'self_aware',
      title: 'Self-Aware',
      description: '10+ bias tests - Know thy trading self',
      icon: '🪞',
      color: '#F39C12',
      rarity: 'rare',
      category: 'psychology',
      requirement: '10+ bias tests'
    },

    // Perfection
    {
      id: 'flawless_legend',
      title: 'Flawless Legend',
      description: '20+ perfect scores - Absolute market precision',
      icon: '💎',
      color: '#1ABC9C',
      rarity: 'mythic',
      category: 'perfection',
      requirement: '20+ perfect scores'
    },
    {
      id: 'precision_master',
      title: 'Precision Master',
      description: '10+ perfect scores - Surgical accuracy',
      icon: '🎯',
      color: '#FFD700',
      rarity: 'legendary',
      category: 'perfection',
      requirement: '10+ perfect scores'
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: '5+ perfect scores - Demanding excellence',
      icon: '✨',
      color: '#3498DB',
      rarity: 'epic',
      category: 'perfection',
      requirement: '5+ perfect scores'
    },

    // Dedication
    {
      id: 'market_obsessed',
      title: 'Market Obsessed',
      description: '200+ tests - Markets are your life',
      icon: '🔥',
      color: '#E74C3C',
      rarity: 'mythic',
      category: 'dedication',
      requirement: '200+ tests completed'
    },
    {
      id: 'chart_addict',
      title: 'Chart Addict',
      description: '100+ tests - Can\'t stop analyzing',
      icon: '📊',
      color: '#9B59B6',
      rarity: 'legendary',
      category: 'dedication',
      requirement: '100+ tests completed'
    },
    {
      id: 'committed_student',
      title: 'Committed Student',
      description: '50+ tests - Serious about learning',
      icon: '📚',
      color: '#2ECC71',
      rarity: 'epic',
      category: 'dedication',
      requirement: '50+ tests completed'
    },
    {
      id: 'dedicated_learner',
      title: 'Dedicated Learner',
      description: '25+ tests - Building knowledge',
      icon: '🎓',
      color: '#F39C12',
      rarity: 'rare',
      category: 'dedication',
      requirement: '25+ tests completed'
    },

    // Consistency
    {
      id: 'market_maniac',
      title: 'Market Maniac',
      description: '15+ tests in one week - Unstoppable momentum',
      icon: '⚡',
      color: '#E74C3C',
      rarity: 'legendary',
      category: 'consistency',
      requirement: '15+ tests in one week'
    },
    {
      id: 'weekly_warrior',
      title: 'Weekly Warrior',
      description: '10+ tests in one week - Intense focus',
      icon: '🗡️',
      color: '#9B59B6',
      rarity: 'epic',
      category: 'consistency',
      requirement: '10+ tests in one week'
    },
    {
      id: 'monthly_grinder',
      title: 'Monthly Grinder',
      description: '20+ tests this month - Steady progress',
      icon: '⚙️',
      color: '#3498DB',
      rarity: 'rare',
      category: 'consistency',
      requirement: '20+ tests this month'
    },

    // Versatility
    {
      id: 'market_polymath',
      title: 'Market Polymath',
      description: 'Master of all trading disciplines',
      icon: '🎭',
      color: '#8E44AD',
      rarity: 'legendary',
      category: 'versatility',
      requirement: '4+ test types with 40+ tests'
    },
    {
      id: 'well_rounded_trader',
      title: 'Well-Rounded Trader',
      description: 'Skilled across multiple test types',
      icon: '⚖️',
      color: '#2ECC71',
      rarity: 'epic',
      category: 'versatility',
      requirement: '3+ test types with 20+ tests'
    },

    // Trading
    {
      id: 'cherry_popped',
      title: 'Cherry Popped',
      description: 'Your first trade - Welcome to the game',
      icon: '🍒',
      color: '#FF6B9D',
      rarity: 'common',
      category: 'trading',
      requirement: '1+ sandbox trade'
    },
    {
      id: 'risk_master',
      title: 'Risk Master',
      description: '85%+ win rate with 50+ trades - Calculated precision',
      icon: '🛡️',
      color: '#1ABC9C',
      rarity: 'mythic',
      category: 'trading',
      requirement: '85%+ win rate with 50+ trades'
    },
    {
      id: 'money_magnet',
      title: 'Money Magnet',
      description: '75%+ win rate with 30+ trades - Profits flow to you',
      icon: '🧲',
      color: '#FFD700',
      rarity: 'legendary',
      category: 'trading',
      requirement: '75%+ win rate with 30+ trades'
    },
    {
      id: 'wealth_builder',
      title: 'Wealth Builder',
      description: '200%+ returns - Compounding genius',
      icon: '🏰',
      color: '#2ECC71',
      rarity: 'legendary',
      category: 'trading',
      requirement: '200%+ returns with 25+ trades'
    },
    {
      id: 'profit_hunter',
      title: 'Profit Hunter',
      description: '100%+ returns - Doubling down',
      icon: '🏹',
      color: '#F39C12',
      rarity: 'epic',
      category: 'trading',
      requirement: '100%+ returns with 15+ trades'
    },
    {
      id: 'trade_machine',
      title: 'Trade Machine',
      description: '500+ trades - Relentless execution',
      icon: '🤖',
      color: '#95A5A6',
      rarity: 'mythic',
      category: 'trading',
      requirement: '500+ sandbox trades'
    },
    {
      id: 'execution_expert',
      title: 'Execution Expert',
      description: '250+ trades - Trading is your craft',
      icon: '⚡',
      color: '#9B59B6',
      rarity: 'legendary',
      category: 'trading',
      requirement: '250+ sandbox trades'
    },
    {
      id: 'active_trader',
      title: 'Active Trader',
      description: '100+ trades - Building experience',
      icon: '📈',
      color: '#3498DB',
      rarity: 'epic',
      category: 'trading',
      requirement: '100+ sandbox trades'
    },

    // Ultimate
    {
      id: 'trading_god',
      title: 'Trading God',
      description: 'Ultimate mastery - 90%+ avg, 10+ perfects, 50+ tests',
      icon: '👑',
      color: '#FFD700',
      rarity: 'mythic',
      category: 'ultimate',
      requirement: '90%+ avg, 10+ perfects, 50+ tests'
    },
    {
      id: 'complete_trader',
      title: 'Complete Trader',
      description: 'Theory + Practice mastery - The full package',
      icon: '🎯',
      color: '#8E44AD',
      rarity: 'mythic',
      category: 'ultimate',
      requirement: '100+ tests, 200+ trades, 70%+ win rate'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Badges', icon: '🏆' },
    { id: 'initiation', name: 'Initiation', icon: '🌅' },
    { id: 'mastery', name: 'Technical Mastery', icon: '🧙‍♂️' },
    { id: 'psychology', name: 'Psychology', icon: '🧠' },
    { id: 'perfection', name: 'Perfection', icon: '💎' },
    { id: 'dedication', name: 'Dedication', icon: '📚' },
    { id: 'consistency', name: 'Consistency', icon: '⚡' },
    { id: 'versatility', name: 'Versatility', icon: '🎭' },
    { id: 'trading', name: 'Trading', icon: '📈' },
    { id: 'ultimate', name: 'Ultimate', icon: '👑' }
  ];

  const rarities = [
    { id: 'all', name: 'All Rarities', color: '#95A5A6' },
    { id: 'common', name: 'Common', color: '#BDC3C7' },
    { id: 'rare', name: 'Rare', color: '#3498DB' },
    { id: 'epic', name: 'Epic', color: '#9B59B6' },
    { id: 'legendary', name: 'Legendary', color: '#FFD700' },
    { id: 'mythic', name: 'Mythic', color: '#E74C3C' }
  ];

  const getRarityGlow = (rarity) => {
    switch (rarity) {
      case 'mythic': return '0 0 20px rgba(231, 76, 60, 0.6)';
      case 'legendary': return '0 0 15px rgba(255, 215, 0, 0.6)';
      case 'epic': return '0 0 10px rgba(155, 89, 182, 0.6)';
      case 'rare': return '0 0 8px rgba(52, 152, 219, 0.6)';
      default: return 'none';
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'mythic': return '#E74C3C';
      case 'legendary': return '#FFD700';
      case 'epic': return '#9B59B6';
      case 'rare': return '#3498DB';
      case 'common': return '#BDC3C7';
      default: return '#95A5A6';
    }
  };

  // Handle both array of strings (earnedBadges) and array of objects (achievements)
  const earnedBadgeIds = Array.isArray(userBadges) 
    ? userBadges.map(badge => typeof badge === 'string' ? badge : badge.id)
    : [];
  const earnedCount = earnedBadgeIds.length;
  const totalCount = allBadges.length;

  const filteredBadges = allBadges.filter(badge => {
    const categoryMatch = selectedCategory === 'all' || badge.category === selectedCategory;
    const rarityMatch = selectedRarity === 'all' || badge.rarity === selectedRarity;
    return categoryMatch && rarityMatch;
  }).sort((a, b) => {
    // Sort so earned badges appear first
    const aEarned = earnedBadgeIds.includes(a.id);
    const bEarned = earnedBadgeIds.includes(b.id);
    
    if (aEarned && !bEarned) return -1;
    if (!aEarned && bEarned) return 1;
    return 0;
  });

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '10px',
        overflowY: 'auto'
      }}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '75vh',
          overflow: 'hidden',
          boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.8)' : '0 20px 60px rgba(0,0,0,0.3)',
          margin: 'auto'
        }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Trophy size={28} color={darkMode ? '#FFD700' : '#FFD700'} />
            <div>
              <h2 style={{
                color: darkMode ? '#e0e0e0' : '#333',
                margin: 0,
                fontSize: '18px'
              }}>
                Badge Collection
              </h2>
              <p style={{
                color: darkMode ? '#888' : '#666',
                margin: '2px 0 0 0',
                fontSize: '11px'
              }}>
                {earnedCount} of {totalCount} badges earned
                {isOwnProfile && (
                  <span style={{ marginLeft: '10px' }}>
                    ({Math.round((earnedCount / totalCount) * 100)}% complete)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: darkMode ? '#888' : '#666',
              cursor: 'pointer',
              padding: '8px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Filters */}
        <div style={{
          padding: '8px 20px',
          borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}`,
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Category Filter */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: selectedCategory === category.id ? '#2196F3' : darkMode ? '#333' : '#f5f5f5',
                  color: selectedCategory === category.id ? 'white' : darkMode ? '#e0e0e0' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span style={{ fontSize: '14px' }}>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* Rarity Filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {rarities.map(rarity => (
              <button
                key={rarity.id}
                onClick={() => setSelectedRarity(rarity.id)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: selectedRarity === rarity.id ? rarity.color : darkMode ? '#333' : '#f5f5f5',
                  color: selectedRarity === rarity.id ? 'white' : darkMode ? '#e0e0e0' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}
              >
                {rarity.name}
              </button>
            ))}
          </div>
        </div>

        {/* Badge Grid */}
        <div style={{
          padding: '20px',
          maxHeight: 'calc(75vh - 180px)',
          overflowY: 'auto',
          scrollBehavior: 'smooth'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '12px'
          }}>
            {filteredBadges.map(badge => {
              const isEarned = earnedBadgeIds.includes(badge.id);
              
              return (
                <div
                  key={badge.id}
                  style={{
                    backgroundColor: darkMode ? '#262626' : '#f9f9f9',
                    borderRadius: '12px',
                    padding: '16px',
                    border: isEarned ? `2px solid ${getRarityColor(badge.rarity)}` : `2px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                    opacity: isEarned ? 1 : 0.6,
                    position: 'relative',
                    boxShadow: isEarned ? getRarityGlow(badge.rarity) : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Badge Icon */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      fontSize: '32px',
                      filter: isEarned ? 'none' : 'grayscale(100%)'
                    }}>
                      {isEarned ? badge.icon : '🔒'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        color: isEarned ? getRarityColor(badge.rarity) : darkMode ? '#666' : '#999',
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {badge.title}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '4px'
                      }}>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: getRarityColor(badge.rarity),
                          color: 'white',
                          textTransform: 'uppercase',
                          fontWeight: '600'
                        }}>
                          {badge.rarity}
                        </span>
                        {isEarned && (
                          <Star size={12} color={getRarityColor(badge.rarity)} fill={getRarityColor(badge.rarity)} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{
                    color: darkMode ? '#b0b0b0' : '#666',
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}>
                    {badge.description}
                  </p>

                  {/* Requirement/Share Section */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px'
                  }}>
                    <p style={{
                      color: darkMode ? '#888' : '#999',
                      margin: 0,
                      fontSize: '12px',
                      fontStyle: 'italic'
                    }}>
                      {isEarned ? '✅ Earned!' : `Requirement: ${badge.requirement}`}
                    </p>
                    
                    {/* Share Button - Only show for earned badges */}
                    {isEarned && isOwnProfile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            shareBadge(badge);
                          }}
                          style={{
                            background: 'transparent',
                            border: `1px solid ${getRarityColor(badge.rarity)}`,
                            borderRadius: '4px',
                            padding: '4px 6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: getRarityColor(badge.rarity),
                            fontSize: '10px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = getRarityColor(badge.rarity);
                            e.target.style.color = 'white';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = getRarityColor(badge.rarity);
                          }}
                          title="Share this badge"
                        >
                          <Share2 size={10} />
                          Share
                        </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBadges.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: darkMode ? '#888' : '#666'
            }}>
              No badges found for the selected filters.
            </div>
          )}
        </div>
      </div>
      
      {/* Social Share Modal */}
      <SocialShareModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
        }}
        shareData={shareData}
        darkMode={darkMode}
        profileUrl={profileUrl}
      />
    </div>
  );
};

export default BadgeModal;