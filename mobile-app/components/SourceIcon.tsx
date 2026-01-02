import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Twitter, Linkedin, Instagram, Youtube, Globe, Music2, Mail, MessageCircle } from 'lucide-react-native';
import { getSourceColor, getSourceIconName } from '../utils/helpers';

interface SourceIconProps {
  source: string;
  size?: number;
  showBackground?: boolean;
}

export const SourceIcon: React.FC<SourceIconProps> = ({ 
  source, 
  size = 20,
  showBackground = true 
}) => {
  const color = getSourceColor(source);
  const iconSize = showBackground ? size * 0.6 : size;
  const normalizedSource = getSourceIconName(source);
  
  const renderIcon = () => {
    const iconColor = showBackground ? '#fff' : color;
    
    switch (normalizedSource) {
      case 'twitter':
        return <Twitter size={iconSize} color={iconColor} />;
      case 'linkedin':
        return <Linkedin size={iconSize} color={iconColor} />;
      case 'instagram':
        return <Instagram size={iconSize} color={iconColor} />;
      case 'tiktok':
        return <Music2 size={iconSize} color={showBackground ? '#fff' : '#000'} />;
      case 'youtube':
        return <Youtube size={iconSize} color={iconColor} />;
      case 'reddit':
        return <MessageCircle size={iconSize} color={iconColor} />;
      case 'newsletter':
        return <Mail size={iconSize} color={iconColor} />;
      default:
        return <Globe size={iconSize} color={iconColor} />;
    }
  };

  if (!showBackground) {
    return renderIcon();
  }

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor: color }]}>
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
