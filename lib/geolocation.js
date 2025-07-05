/**
 * IP-based geolocation utility for automatic user location detection
 * Uses FreeIPI API - 60 requests/minute, no API key needed, commercial use allowed
 */

export const getLocationFromIP = async (ipAddress = null) => {
  try {
    // Use provided IP or let the service detect the client IP
    const url = ipAddress 
      ? `https://freeipapi.com/api/json/${ipAddress}`
      : 'https://freeipapi.com/api/json/';
    
    const response = await fetch(url, {
      method: 'GET',
      timeout: 5000 // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      country: data.countryName || '',
      countryCode: data.countryCode || '',
      region: data.regionName || '',
      city: data.cityName || '',
      continent: data.continent || '',
      timezone: data.timeZone || 'UTC',
      ipAddress: data.ipAddress || ipAddress,
      success: true
    };

  } catch (error) {
    
    // Return default values on failure
    return {
      country: '',
      countryCode: '',
      region: '',
      city: '',
      continent: '',
      timezone: 'UTC',
      ipAddress: ipAddress || '',
      success: false,
      error: error.message
    };
  }
};

export const getClientIP = (req) => {
  // Get client IP from various headers (works with proxies, load balancers)
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.connection?.socket?.remoteAddress ||
         '127.0.0.1';
};

export const formatLocationForDisplay = (user) => {
  if (!user.country) return 'Unknown';
  
  if (user.city && user.region) {
    return `${user.city}, ${user.region}, ${user.country}`;
  } else if (user.region) {
    return `${user.region}, ${user.country}`;
  } else {
    return user.country;
  }
};

export const getRegionFromCountry = (countryCode) => {
  const regions = {
    // North America
    'US': 'North America',
    'CA': 'North America',
    'MX': 'North America',
    
    // Europe
    'GB': 'Europe',
    'DE': 'Europe',
    'FR': 'Europe',
    'IT': 'Europe',
    'ES': 'Europe',
    'NL': 'Europe',
    'SE': 'Europe',
    'NO': 'Europe',
    'CH': 'Europe',
    'AT': 'Europe',
    'BE': 'Europe',
    'DK': 'Europe',
    'FI': 'Europe',
    'IE': 'Europe',
    'PL': 'Europe',
    'CZ': 'Europe',
    
    // Asia-Pacific
    'JP': 'Asia-Pacific',
    'CN': 'Asia-Pacific',
    'KR': 'Asia-Pacific',
    'SG': 'Asia-Pacific',
    'HK': 'Asia-Pacific',
    'AU': 'Asia-Pacific',
    'NZ': 'Asia-Pacific',
    'IN': 'Asia-Pacific',
    'TH': 'Asia-Pacific',
    'MY': 'Asia-Pacific',
    'ID': 'Asia-Pacific',
    'PH': 'Asia-Pacific',
    'VN': 'Asia-Pacific',
    
    // Middle East & Africa
    'AE': 'Middle East & Africa',
    'SA': 'Middle East & Africa',
    'IL': 'Middle East & Africa',
    'ZA': 'Middle East & Africa',
    'EG': 'Middle East & Africa',
    
    // South America
    'BR': 'South America',
    'AR': 'South America',
    'CL': 'South America',
    'CO': 'South America',
    'PE': 'South America',
    'UY': 'South America',
    'VE': 'South America'
  };
  
  return regions[countryCode] || 'Other';
};