import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { realtimeService } from '../services/realtime';
import notificationService from '../services/notificationService';
import styles from '../styles/components/WebSocketStatus.styles';

interface WebSocketStatusProps {
  showDetails?: boolean;
}

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ showDetails = false }) => {
  const [status, setStatus] = useState<string>('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const connectionStatus = realtimeService.getConnectionStatus();
      const connected = realtimeService.isConnected();
      setStatus(connectionStatus);
      setIsConnected(connected);
      
      if (showDetails) {
        setDebugInfo(realtimeService.getDebugInfo());
      }
    };

    // Mettre à jour le statut initial
    updateStatus();

    // Écouter les changements de statut
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [showDetails]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await realtimeService.testConnection();
      if (result) {
        notificationService.showSuccessToast('Connexion WebSocket établie avec succès !');
      } else {
        notificationService.showErrorToast('Impossible d\'établir la connexion WebSocket.');
      }
    } catch (error: any) {
      notificationService.handleError(error, 'test connexion WebSocket');
    } finally {
      setTesting(false);
    }
  };

  const handleReconnect = async () => {
    setTesting(true);
    try {
      realtimeService.disconnect();
      await realtimeService.connect();
      notificationService.showInfoToast('Tentative de reconnexion effectuée.');
    } catch (error: any) {
      notificationService.handleError(error, 'reconnexion WebSocket');
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#27ae60';
      case 'connecting':
        return '#f39c12';
      case 'error':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connecté';
      case 'connecting':
        return 'Connexion...';
      case 'error':
        return 'Erreur';
      default:
        return 'Déconnecté';
    }
  };

  if (!showDetails) {
    return (
      <View style={[styles.container, { borderColor: getStatusColor() }]}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>
    );
  }

  return (
    <View style={styles.detailedContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Statut WebSocket</Text>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusIndicatorText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={handleTestConnection}
          disabled={testing}
        >
          <Text style={styles.buttonText}>
            {testing ? 'Test...' : 'Tester'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.reconnectButton]}
          onPress={handleReconnect}
          disabled={testing}
        >
          <Text style={styles.buttonText}>
            {testing ? 'Reconnexion...' : 'Reconnecter'}
          </Text>
        </TouchableOpacity>
      </View>

      {debugInfo && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugTitle}>Informations de débogage:</Text>
          <Text style={styles.debugText}>
            Statut: {debugInfo.connectionStatus}
          </Text>
          <Text style={styles.debugText}>
            Connecté: {debugInfo.isConnected ? 'Oui' : 'Non'}
          </Text>
          <Text style={styles.debugText}>
            Tentatives de reconnexion: {debugInfo.reconnectAttempts}
          </Text>
          <Text style={styles.debugText}>
            Événements écoutés: {debugInfo.listeners.join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
};

export default WebSocketStatus; 