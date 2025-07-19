import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <MaterialIcons name="arrow-back" size={24} color="#3498db" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.headerRight}>
          {showConnectionStatus && (
            <View style={styles.connectionStatus}>
              <MaterialIcons 
                name={isConnected ? 'wifi' : 'wifi-off'} 
                size={14}
                color={isConnected ? '#27ae60' : '#e74c3c'} 
              />
              <Text style={styles.statusText}>
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </Text>
            </View>
          )}
          
          {rightAction && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: rightAction.color || '#3498db' }]}
              onPress={rightAction.onPress}
            >
              <MaterialIcons name={rightAction.icon as any} size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <Text style={styles.headerTitle}>{title}</Text>
      
      {subtitle && (
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statusText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButton: {
    padding: 10,
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Header; 