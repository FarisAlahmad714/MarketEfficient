import React from 'react';
import Image from 'next/image';

const ProfileAvatar = ({ 
  imageUrl, 
  name, 
  size = 36, 
  className = '', 
  style = {},
  fallbackColor,
  textSize,
  borderRadius = '10px',
  imageClassName = ''
}) => {
  const initials = name ? name.charAt(0).toUpperCase() : 'U';
  
  // Generate a consistent color based on name if no fallbackColor provided
  const generateColor = (text) => {
    if (fallbackColor) return fallbackColor;
    
    const colors = [
      '#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#607D8B',
      '#00BCD4', '#FFC107', '#795548', '#3F51B5', '#E91E63'
    ];
    
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    ...style
  };

  if (imageUrl) {
    return (
      <div className={className} style={avatarStyle}>
        <Image
          src={imageUrl}
          alt={`${name}'s profile`}
          fill
          className={`object-cover ${imageClassName}`}
          style={{ borderRadius }}
          sizes={`${size}px`}
          onError={(e) => {
            // Hide the image if it fails to load
            e.target.style.display = 'none';
          }}
        />
        {/* Fallback in case image fails to load */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${generateColor(name)} 0%, ${generateColor(name)}dd 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '600',
            fontSize: textSize || `${Math.max(10, size * 0.4)}px`,
            zIndex: -1
          }}
        >
          {initials}
        </div>
      </div>
    );
  }

  // Fallback to colored initials
  return (
    <div 
      className={className} 
      style={{
        ...avatarStyle,
        background: `linear-gradient(135deg, ${generateColor(name)} 0%, ${generateColor(name)}dd 100%)`,
        color: 'white',
        fontWeight: '600',
        fontSize: textSize || `${Math.max(10, size * 0.4)}px`,
      }}
    >
      {initials}
    </div>
  );
};

export default ProfileAvatar;