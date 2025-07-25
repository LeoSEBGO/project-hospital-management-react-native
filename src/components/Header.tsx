import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { headerStyles } from '../styles/components/Header';


interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: {
    icon: string;
    onPress: () => void;
    color?: string;
  };
  showConnectionStatus?: boolean;
  isConnected?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  showConnectionStatus = false,
  isConnected = false,
}) => {
  return (
    <View style={headerStyles.header}>
      <View style={headerStyles.headerTop}>
        <View style={headerStyles.headerLeft}>
          {onBack && (
            <TouchableOpacity style={headerStyles.backButton} onPress={onBack}>
              <MaterialIcons name="arrow-back" size={24} color="#3498db" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={headerStyles.headerRight}>
          {showConnectionStatus && (
            <View style={headerStyles.connectionStatus}>
              <MaterialIcons 
                name={isConnected ? 'wifi' : 'wifi-off'} 
                size={14}
                color={isConnected ? '#27ae6' : '#e74c3c'} 
              />
              <Text style={headerStyles.statusText}>
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </Text>
            </View>
          )}
          
          {rightAction && (
            <TouchableOpacity 
              style={[headerStyles.actionButton, { backgroundColor: rightAction.color || '#3498db' }]}
              onPress={rightAction.onPress}
            >
              <MaterialIcons name={rightAction.icon as any} size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <Text style={headerStyles.headerTitle}>{title}</Text>
      
      {subtitle && (
        <Text style={headerStyles.headerSubtitle}>{subtitle}</Text>
      )}
    </View>
  );
};

export default Header; 