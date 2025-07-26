import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing } from '../../styles/common';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.disabled;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      case 'danger': return colors.danger;
      case 'outline': return 'transparent';
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textLight;
    switch (variant) {
      case 'outline': return colors.primary;
      default: return colors.white;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return colors.primary;
    return 'transparent';
  };

  const getPadding = () => {
    switch (size) {
      case 'small': return spacing.sm;
      case 'large': return spacing.lg;
      default: return spacing.md;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return 14;
      case 'large': return 18;
      default: return 16;
    }
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: getBackgroundColor(),
        borderWidth: variant === 'outline' ? 1 : 0,
        borderColor: getBorderColor(),
        paddingVertical: getPadding(),
        paddingHorizontal: spacing.lg,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: (loading || disabled) ? 0.7 : 1,
        width: fullWidth ? '100%' : undefined,
        flexDirection: 'row',
      }}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <MaterialIcons 
              name={icon as any} 
              size={20} 
              color={getTextColor()} 
              style={{ marginRight: spacing.sm }} 
            />
          )}
          <Text style={{
            color: getTextColor(),
            fontSize: getFontSize(),
            fontWeight: '600',
            textAlign: 'center',
          }}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <MaterialIcons 
              name={icon as any} 
              size={20} 
              color={getTextColor()} 
              style={{ marginLeft: spacing.sm }} 
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button; 