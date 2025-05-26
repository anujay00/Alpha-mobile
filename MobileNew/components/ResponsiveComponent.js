import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { wp, hp } from '../utils/ResponsiveUtils';

// Get screen dimensions
const { width } = Dimensions.get('window');

/**
 * A responsive container component that adapts to different screen sizes
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.style - Additional styles for the container
 * @param {boolean} props.fullWidth - Whether to use full available width (default: false)
 * @param {string} props.align - Horizontal alignment ('center', 'left', 'right') (default: 'center')
 * @param {string} props.justify - Vertical justification ('center', 'start', 'end', 'between', 'around') (default: 'center')
 * @param {number} props.padding - All-side padding (in responsive units)
 * @param {number} props.paddingHorizontal - Horizontal padding (in responsive units)
 * @param {number} props.paddingVertical - Vertical padding (in responsive units)
 * @param {number} props.margin - All-side margin (in responsive units)
 * @param {number} props.maxWidth - Maximum width of the component (in responsive units)
 * @param {number} props.minWidth - Minimum width of the component (in responsive units)
 */
const ResponsiveComponent = ({
  children,
  style,
  fullWidth = false,
  align = 'center',
  justify = 'center',
  padding,
  paddingHorizontal,
  paddingVertical,
  margin,
  maxWidth,
  minWidth,
}) => {
  // Generate dynamic styles based on props
  const dynamicStyles = {};
  
  // Calculate max width based on device width
  if (maxWidth) {
    dynamicStyles.maxWidth = wp(maxWidth);
  } else if (!fullWidth) {
    // Default max width based on screen size
    if (width <= 360) {
      dynamicStyles.maxWidth = wp(300);
    } else if (width <= 400) {
      dynamicStyles.maxWidth = wp(350);
    } else {
      dynamicStyles.maxWidth = wp(420);
    }
  }
  
  // Apply min width if specified
  if (minWidth) {
    dynamicStyles.minWidth = wp(minWidth);
  }
  
  // Apply alignment
  switch (align) {
    case 'left':
      dynamicStyles.alignItems = 'flex-start';
      dynamicStyles.alignSelf = 'flex-start';
      break;
    case 'right':
      dynamicStyles.alignItems = 'flex-end';
      dynamicStyles.alignSelf = 'flex-end';
      break;
    default: // center
      dynamicStyles.alignItems = 'center';
      dynamicStyles.alignSelf = 'center';
  }
  
  // Apply justification
  switch (justify) {
    case 'start':
      dynamicStyles.justifyContent = 'flex-start';
      break;
    case 'end':
      dynamicStyles.justifyContent = 'flex-end';
      break;
    case 'between':
      dynamicStyles.justifyContent = 'space-between';
      break;
    case 'around':
      dynamicStyles.justifyContent = 'space-around';
      break;
    default: // center
      dynamicStyles.justifyContent = 'center';
  }
  
  // Apply spacing
  if (padding !== undefined) dynamicStyles.padding = hp(padding);
  if (paddingHorizontal !== undefined) dynamicStyles.paddingHorizontal = wp(paddingHorizontal);
  if (paddingVertical !== undefined) dynamicStyles.paddingVertical = hp(paddingVertical);
  if (margin !== undefined) dynamicStyles.margin = hp(margin);
  
  return (
    <View style={[styles.container, dynamicStyles, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default ResponsiveComponent; 