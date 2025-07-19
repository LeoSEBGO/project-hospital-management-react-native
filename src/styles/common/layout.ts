import { StyleSheet } from 'react-native';

export const layout = {
  // Rayons de bordure
  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },
  
  // Ombres
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 12,
    },
  },
  
  // Bordures
  borderWidth: {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
  },
};

export default layout; 