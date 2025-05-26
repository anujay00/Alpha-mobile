import { Dimensions, PixelRatio, Platform } from 'react-native';

// Device screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (design was made for)
// Standard iPhone 11/12/13 size - adjust if your design was made for a different reference device
const baseWidth = 375;
const baseHeight = 812;

// Scale ratios
const widthScale = SCREEN_WIDTH / baseWidth;
const heightScale = SCREEN_HEIGHT / baseHeight;

/**
 * Converts a design dimension to a responsive dimension using width scale
 * @param {number} size - Size in pixels from design
 * @return {number} - Responsive size
 */
export const wp = (size) => {
  return Math.round(size * widthScale);
};

/**
 * Converts a design dimension to a responsive dimension using height scale
 * @param {number} size - Size in pixels from design
 * @return {number} - Responsive size
 */
export const hp = (size) => {
  return Math.round(size * heightScale);
};

/**
 * Returns font size based on screen size
 * @param {number} size - Font size from design
 * @return {number} - Responsive font size
 */
export const fontSize = (size) => {
  // Different scaling for iOS and Android
  const scale = Math.min(widthScale, heightScale);
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    // Slightly smaller fonts on Android to match iOS visual appearance
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
};

/**
 * Returns adaptive value based on screen size
 * @param {number} small - Value for smaller screens
 * @param {number} medium - Value for medium screens
 * @param {number} large - Value for larger screens
 * @return {number} - Responsive value based on screen size
 */
export const adaptiveValue = (small, medium, large) => {
  if (SCREEN_WIDTH < 360) return small;
  if (SCREEN_WIDTH < 480) return medium;
  return large;
};

// Listen for dimension changes (device rotation)
export const useDimensionsListener = (callback) => {
  Dimensions.addEventListener('change', ({ window }) => {
    const { width, height } = window;
    if (callback && typeof callback === 'function') {
      callback({ width, height });
    }
  });
};

// Responsive vertical spacing
export const vs = (size) => hp(size);

// Responsive horizontal spacing
export const hs = (size) => wp(size);

// Get safe area paddings
export const getSafeAreaPadding = () => {
  // Default safe area paddings
  const defaultPadding = {
    top: Platform.OS === 'ios' ? 44 : 24,
    bottom: Platform.OS === 'ios' ? 34 : 16,
  };
  
  return defaultPadding;
}; 