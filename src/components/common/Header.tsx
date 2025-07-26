import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing } from '../../styles/common';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
  showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  onBack, 
  rightComponent,
  showBackButton = true 
}) => {
  return (
    <View style={{ 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: spacing.xl 
    }}>
      {showBackButton && onBack && (
        <TouchableOpacity 
          onPress={onBack}
          style={{ 
            padding: spacing.sm,
            marginRight: spacing.md
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
      )}
      <Text style={{ 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: colors.textPrimary,
        flex: 1
      }}>
        {title}
      </Text>
      {rightComponent && (
        <View style={{ marginLeft: spacing.md }}>
          {rightComponent}
        </View>
      )}
    </View>
  );
};

export default Header; 