// lib/contentFilter.js
// Efficient content filtering for trading analysis submissions

const PROFANITY_WORDS = [
  // Basic profanity with variations
  'fuck', 'fucking', 'fucked', 'fucker', 'fck', 'f*ck', 'f**k',
  'shit', 'shitting', 'shitty', 'shits', 'sh*t', 'sh**',
  'damn', 'damned', 'damnit', 'dammit',
  'bitch', 'bitching', 'bitches', 'b*tch',
  'ass', 'asses', 'asshole', 'a**hole', 'a**',
  'cock', 'cocks', 'dick', 'dicks', 'd*ck',
  'pussy', 'pussies', 'p***y',
  'cunt', 'cunts', 'c*nt',
  'motherfucker', 'mf', 'mofo',
  'bastard', 'bastards',
  'whore', 'whores', 'slut', 'sluts',
  'tits', 'boobs', 'penis', 'cock',
  'vagina', 'pussy',
  'nigger', 'nigga', 'n*gger', 'n*gga',
  'faggot', 'fag', 'f*ggot', 'f*g',
  'retard', 'retarded', 'retards',
  'crap', 'crappy', 'piss', 'pissed'
];

const TRADING_KEYWORDS = [
  // Core trading terms
  'bullish', 'bearish', 'support', 'resistance', 'trend', 'breakout', 'breakdown',
  'volume', 'price', 'chart', 'candle', 'pattern', 'technical', 'analysis',
  'momentum', 'oversold', 'overbought', 'moving average', 'ma', 'sma', 'ema',
  'rsi', 'macd', 'fibonacci', 'retracement', 'consolidation', 'reversal',
  'continuation', 'uptrend', 'downtrend', 'sideways', 'range', 'high', 'low',
  'open', 'close', 'buy', 'sell', 'long', 'short', 'entry', 'exit',
  // Market terms
  'market', 'stock', 'crypto', 'bitcoin', 'ethereum', 'apple', 'tesla',
  'spy', 'qqq', 'nasdaq', 'dow', 's&p', 'futures', 'options', 'forex',
  // Time-based
  'daily', 'weekly', 'monthly', 'hourly', '4h', '1h', '15m', '5m',
  // Common analysis phrases
  'looks', 'expecting', 'think', 'believe', 'predict', 'forecast',
  'likely', 'probable', 'possible', 'strong', 'weak', 'rejection',
  'bounce', 'pump', 'dump', 'moon', 'crash', 'dip', 'rally',
  // Political/economic terms relevant to markets
  'government', 'politics', 'election', 'policy', 'regulation', 'fed', 'federal',
  'interest rates', 'inflation', 'gdp', 'unemployment', 'stimulus', 'tariff',
  'trade war', 'sanctions', 'central bank', 'monetary policy', 'fiscal policy'
];

const OFF_TOPIC_PATTERNS = [
  // Non-trading topics (political content removed as it's relevant to market analysis)
  /\b(religion|god|jesus|allah|buddha|christian|muslim|jewish|atheist)\b/i,
  /\b(sports|football|basketball|baseball|soccer|tennis|golf)\b/i,
  /\b(weather|rain|snow|sunny|cloudy|temperature)\b/i,
  /\b(food|recipe|cooking|restaurant|pizza|burger|coffee)\b/i,
  /\b(movie|film|netflix|tv show|actor|actress|celebrity)\b/i,
  /\b(music|song|album|artist|band|concert|spotify)\b/i,
  /\b(game|gaming|xbox|playstation|nintendo|fortnite)\b/i,
  /\b(relationship|dating|girlfriend|boyfriend|marriage|divorce)\b/i,
  /\b(health|doctor|medicine|hospital|sick|disease|covid)\b/i,
  /\b(school|college|university|homework|exam|teacher|student)\b/i,
  /\b(job|work|career|boss|employee|salary|interview)\b/i,
  // Spam patterns
  /\b(click here|visit|website|link|subscribe|follow me)\b/i,
  /\b(free money|get rich|guaranteed|100% profit|easy money)\b/i,
  /\b(telegram|discord|whatsapp|instagram|facebook|twitter)\b/i,
  // Inappropriate content
  /\b(sex|sexual|porn|naked|nude|xxx|adult)\b/i,
  /\b(violence|kill|murder|death|suicide|harm)\b/i,
  /\b(drugs|cocaine|marijuana|weed|heroin|meth)\b/i
];

/**
 * Fast profanity check using Set lookup and pattern matching
 * @param {string} text - Text to check
 * @returns {object} - { hasProfanity: boolean, words: string[] }
 */
function checkProfanity(text) {
  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/);
  const profanitySet = new Set(PROFANITY_WORDS);
  const foundWords = [];
  
  // Check exact word matches
  for (const word of words) {
    // Clean word of punctuation
    const cleanWord = word.replace(/[^\w]/g, '');
    if (profanitySet.has(cleanWord)) {
      foundWords.push(cleanWord);
    }
  }
  
  // Check for profanity patterns within the full text (catch variations like f***ing)
  for (const profanity of PROFANITY_WORDS) {
    if (profanity.length > 3) { // Only check longer words to avoid false positives
      // Create pattern that allows for * and other character substitutions
      const pattern = profanity.replace(/\*/g, '[\\*\\w]');
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      if (regex.test(textLower)) {
        foundWords.push(profanity);
      }
    }
  }
  
  // Check for common character substitutions (leetspeak)
  const substitutionMap = {
    '4': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', '7': 't',
    '@': 'a', '$': 's', '!': 'i'
  };
  
  let decodedText = textLower;
  for (const [char, replacement] of Object.entries(substitutionMap)) {
    decodedText = decodedText.replace(new RegExp(char, 'g'), replacement);
  }
  
  // Check decoded text for profanity
  const decodedWords = decodedText.split(/\s+/);
  for (const word of decodedWords) {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (profanitySet.has(cleanWord) && !foundWords.includes(cleanWord)) {
      foundWords.push(cleanWord);
    }
  }
  
  return {
    hasProfanity: foundWords.length > 0,
    words: [...new Set(foundWords)] // Remove duplicates
  };
}

/**
 * Check if text is trading-related
 * @param {string} text - Text to check
 * @returns {object} - { isTrading: boolean, score: number, matches: string[] }
 */
function checkTradingRelevance(text) {
  const textLower = text.toLowerCase();
  const words = textLower.split(/\s+/);
  const matches = [];
  
  // Check for trading keywords
  for (const keyword of TRADING_KEYWORDS) {
    if (textLower.includes(keyword.toLowerCase())) {
      matches.push(keyword);
    }
  }
  
  // Calculate relevance score (percentage of words that are trading-related)
  const relevanceScore = (matches.length / Math.max(words.length, 1)) * 100;
  
  // Consider it trading-related if:
  // 1. Has at least 2 trading keywords, OR
  // 2. Relevance score > 10%, OR
  // 3. Text is very short (likely ticker symbol or brief technical term)
  const isTrading = matches.length >= 2 || relevanceScore > 10 || words.length <= 3;
  
  return {
    isTrading,
    score: relevanceScore,
    matches: [...new Set(matches)] // Remove duplicates
  };
}

/**
 * Check for off-topic content
 * @param {string} text - Text to check
 * @returns {object} - { isOffTopic: boolean, patterns: string[] }
 */
function checkOffTopic(text) {
  const foundPatterns = [];
  
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(text)) {
      foundPatterns.push(pattern.source);
    }
  }
  
  return {
    isOffTopic: foundPatterns.length > 0,
    patterns: foundPatterns
  };
}

/**
 * Main content filter function
 * @param {string} text - Text to filter
 * @param {object} options - Filtering options
 * @returns {object} - Comprehensive filtering result
 */
function filterContent(text, options = {}) {
  const {
    strictMode = false,
    minLength = 2,
    maxLength = 1000
  } = options;
  
  // Basic validation
  if (!text || typeof text !== 'string') {
    return {
      isValid: false,
      reason: 'Empty or invalid input',
      code: 'INVALID_INPUT'
    };
  }
  
  const trimmedText = text.trim();
  
  // Length check
  if (trimmedText.length < minLength) {
    return {
      isValid: false,
      reason: 'Input too short',
      code: 'TOO_SHORT'
    };
  }
  
  if (trimmedText.length > maxLength) {
    return {
      isValid: false,
      reason: 'Input too long',
      code: 'TOO_LONG'
    };
  }
  
  // Profanity check
  const profanityCheck = checkProfanity(trimmedText);
  if (profanityCheck.hasProfanity) {
    return {
      isValid: false,
      reason: 'Contains inappropriate language',
      code: 'PROFANITY',
      details: { words: profanityCheck.words }
    };
  }
  
  // Trading relevance check
  const tradingCheck = checkTradingRelevance(trimmedText);
  const offTopicCheck = checkOffTopic(trimmedText);
  
  // In strict mode, require trading relevance
  if (strictMode && !tradingCheck.isTrading && trimmedText.length > 10) {
    return {
      isValid: false,
      reason: 'Please provide trading-related analysis',
      code: 'NOT_TRADING_RELATED',
      details: { 
        score: tradingCheck.score,
        suggestion: 'Include technical analysis terms like support, resistance, trend, etc.'
      }
    };
  }
  
  // Check for off-topic content
  if (offTopicCheck.isOffTopic) {
    return {
      isValid: false,
      reason: 'Content appears to be off-topic for trading analysis',
      code: 'OFF_TOPIC',
      details: { patterns: offTopicCheck.patterns }
    };
  }
  
  // All checks passed
  return {
    isValid: true,
    reason: 'Content is appropriate',
    code: 'VALID',
    analysis: {
      tradingRelevance: tradingCheck.score,
      tradingKeywords: tradingCheck.matches,
      length: trimmedText.length
    }
  };
}

/**
 * Quick validation for real-time feedback
 * @param {string} text - Text to validate
 * @returns {object} - Simple validation result
 */
function quickValidate(text) {
  if (!text || text.trim().length < 2) {
    return { isValid: true, warning: null }; // Allow empty during typing
  }
  
  const profanityCheck = checkProfanity(text);
  if (profanityCheck.hasProfanity) {
    return { 
      isValid: false, 
      warning: 'Please avoid inappropriate language' 
    };
  }
  
  const offTopicCheck = checkOffTopic(text);
  if (offTopicCheck.isOffTopic) {
    return { 
      isValid: false, 
      warning: 'Please focus on trading analysis' 
    };
  }
  
  return { isValid: true, warning: null };
}

module.exports = {
  filterContent,
  quickValidate,
  checkProfanity,
  checkTradingRelevance,
  checkOffTopic
};