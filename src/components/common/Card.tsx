import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors, spacing } from '../../styles/common';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'small' | 'medium' | 'large';
  margin?: 'small' | 'medium' | 'large';
  shadow?: boolean;
  border?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'medium',
  margin = 'medium',
  shadow = true,
  border = false,
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'small': return spacing.sm;
      case 'large': return spacing.xl;
      default: return spacing.lg;
    }
  };

  const getMargin = () => {
    switch (margin) {
      case 'small': return spacing.sm;
      case 'large': return spacing.xl;
      default: return spacing.lg;
    }
  };

  return (
    <View
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: 12,
          padding: getPadding(),
          marginBottom: getMargin(),
          ...(shadow && {
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
          }),
          ...(border && {
            borderWidth: 1,
            borderColor: colors.border,
          }),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default Card; 