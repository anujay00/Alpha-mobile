import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { fontSize } from '../utils/ResponsiveUtils';

/**
 * A responsive text component that scales text size based on screen dimensions
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Text content
 * @param {Object} props.style - Additional styles for the text
 * @param {string} props.type - Text type ('title', 'heading', 'subheading', 'body', 'caption')
 * @param {string} props.align - Text alignment ('left', 'center', 'right')
 * @param {string} props.weight - Font weight ('normal', 'medium', 'semibold', 'bold')
 * @param {string} props.color - Text color
 * @param {number} props.size - Custom font size (overrides type)
 * @param {number} props.adjustsFontSizeToFit - Whether the font size should be reduced to fit
 * @param {number} props.numberOfLines - Max number of lines before truncating
 */
const ResponsiveText = ({
  children,
  style,
  type = 'body',
  align,
  weight,
  color,
  size,
  adjustsFontSizeToFit,
  numberOfLines,
  ...props
}) => {
  // Generate dynamic styles based on props
  const dynamicStyles = {};
  
  // Text alignment
  if (align) {
    dynamicStyles.textAlign = align;
  }
  
  // Text color
  if (color) {
    dynamicStyles.color = color;
  }
  
  // Font weight
  switch (weight) {
    case 'bold':
      dynamicStyles.fontWeight = '700';
      break;
    case 'semibold':
      dynamicStyles.fontWeight = '600';
      break;
    case 'medium':
      dynamicStyles.fontWeight = '500';
      break;
    case 'normal':
      dynamicStyles.fontWeight = '400';
      break;
    default:
      // If weight is specified as a number or other string, use it directly
      if (weight) {
        dynamicStyles.fontWeight = weight;
      }
  }
  
  // Set font size either from explicit size or type
  if (size) {
    dynamicStyles.fontSize = fontSize(size);
  } else {
    switch (type) {
      case 'title':
        dynamicStyles.fontSize = fontSize(24);
        if (!weight) dynamicStyles.fontWeight = '700';
        break;
      case 'heading':
        dynamicStyles.fontSize = fontSize(20);
        if (!weight) dynamicStyles.fontWeight = '600';
        break;
      case 'subheading':
        dynamicStyles.fontSize = fontSize(17);
        if (!weight) dynamicStyles.fontWeight = '600';
        break;
      case 'body':
        dynamicStyles.fontSize = fontSize(15);
        break;
      case 'caption':
        dynamicStyles.fontSize = fontSize(12);
        break;
      case 'tiny':
        dynamicStyles.fontSize = fontSize(10);
        break;
      default:
        dynamicStyles.fontSize = fontSize(15); // Default body size
    }
  }
  
  return (
    <Text
      style={[styles.text, dynamicStyles, style]}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    color: '#333',
  },
});

export default ResponsiveText; 