import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { apiService, QueuePosition, QueueStats } from '../services/api';
import { realtimeService } from '../services/realtime';
import styles from '../styles/screens/QueueScreen.styles';

const QueueScreen: React.FC = () => {
  const [queuePosition, setQueuePosition] = useState<QueuePosition | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Animation pour le pulse
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    loadQueueData();
    setupRealtimeConnection();
    
    return () => {
      // Nettoyer les listeners lors du démontage
      realtimeService.off('queue_update', handleQueueUpdate);
      realtimeService.off('connection_open', handleConnectionOpen);
      realtimeService.off('connection_close', handleConnectionClose);
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      startPulseAnimation();
    }
  }, [isConnected]);

  const setupRealtimeConnection = async () => {
    try {
      // Écouter les mises à jour de la queue
      realtimeService.on('queue_update', handleQueueUpdate);
      realtimeService.on('connection_open', handleConnectionOpen);
      realtimeService.on('connection_close', handleConnectionClose);
      
      // Se connecter au WebSocket
      await realtimeService.connect();
    } catch (error) {
      console.error('Erreur de connexion temps réel:', error);
    }
  };

  const handleQueueUpdate = (update: any) => {
    if (update.queuePosition) {
      setQueuePosition(update.queuePosition);
    }
  };

  const handleConnectionOpen = () => {
    setIsConnected(true);
  };

  const handleConnectionClose = () => {
    setIsConnected(false);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadQueueData = async () => {
    try {
      setLoading(true);
      const [positionResponse, statsResponse] = await Promise.all([
        apiService.getQueuePosition(),
        apiService.getQueueStats(),
      ]);

      if (positionResponse.success && positionResponse.data) {
        setQueuePosition(positionResponse.data);
      }

      if (statsResponse.success && statsResponse.data) {
        setQueueStats(statsResponse.data);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des données de queue:', error);
      if (error.message.includes('QUEUE_NOT_FOUND')) {
        Alert.alert(
          'Pas dans la file d\'attente',
          'Vous n\'êtes actuellement pas dans la file d\'attente.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQueueData();
    setRefreshing(false);
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return '#f39c12';
      case 'EN_COURS':
        return '#3498db';
      case 'TERMINE':
        return '#27ae60';
      case 'ANNULE':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'EN_COURS':
        return 'En cours';
      case 'TERMINE':
        return 'Terminé';
      case 'ANNULE':
        return 'Annulé';
      default:
        return 'Inconnu';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Chargement de la file d'attente...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!queuePosition) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.emptyTitle}>Pas dans la file d'attente</Text>
          <Text style={styles.emptyText}>
            Vous n'êtes actuellement pas dans la file d'attente.
          </Text>
          <Text style={styles.emptySubtext}>
            Rejoignez la file d'attente en vous présentant à l'accueil.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="queue" size={24} color="#3498db" />
          <Text style={styles.headerTitle}>File d'Attente</Text>
        </View>
        <View style={styles.connectionStatus}>
          <MaterialIcons 
            name={isConnected ? 'wifi' : 'wifi-off'} 
            size={16}
            color={isConnected ? '#27ae60' : '#e74c3c'} 
          />
          <Text style={styles.statusText}>
            {isConnected ? 'Temps réel' : 'Hors ligne'}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Position actuelle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Votre Position</Text>
          </View>
          <Animated.View 
            style={[
              styles.positionCard,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Text style={styles.positionNumber}>{queuePosition.position}</Text>
            <Text style={styles.positionLabel}>Position dans la file</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(queuePosition.statut) }]}>
              <Text style={styles.statusBadgeText}>
                {getStatusText(queuePosition.statut)}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Informations du service */}
        {queuePosition.service && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="local-hospital" size={20} color="#3498db" />
              <Text style={styles.sectionTitle}>Service</Text>
            </View>
            <View style={styles.serviceCard}>
              <Text style={styles.serviceName}>{queuePosition.service.nom}</Text>
              <Text style={styles.serviceDescription}>
                {queuePosition.service.description}
              </Text>
            </View>
          </View>
        )}

        {/* Temps d'attente */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="access-time" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Temps d'Attente</Text>
          </View>
          <View style={styles.timeCard}>
            <View style={styles.timeRow}>
              <MaterialIcons name="schedule" size={16} color="#7f8c8d" />
              <Text style={styles.timeLabel}>Temps estimé:</Text>
              <Text style={styles.timeValue}>
                {formatTime(queuePosition.tempsEstime)}
              </Text>
            </View>
            <View style={styles.timeRow}>
              <MaterialIcons name="timer" size={16} color="#7f8c8d" />
              <Text style={styles.timeLabel}>Temps d'attente:</Text>
              <Text style={styles.timeValue}>
                {formatTime(queuePosition.tempsAttente)}
              </Text>
            </View>
          </View>
        </View>

        {/* Statistiques de la queue */}
        {queueStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="analytics" size={20} color="#3498db" />
              <Text style={styles.sectionTitle}>Statistiques</Text>
            </View>
            <View style={styles.statsCard}>
              <View style={styles.statRow}>
                <MaterialIcons name="people" size={16} color="#7f8c8d" />
                <Text style={styles.statLabel}>Total patients:</Text>
                <Text style={styles.statValue}>{queueStats.totalPatients}</Text>
              </View>
              <View style={styles.statRow}>
                <MaterialIcons name="schedule" size={16} color="#7f8c8d" />
                <Text style={styles.statLabel}>Temps moyen:</Text>
                <Text style={styles.statValue}>
                  {formatTime(queueStats.averageWaitTime)}
                </Text>
              </View>
              <View style={styles.statRow}>
                <MaterialIcons name="update" size={16} color="#7f8c8d" />
                <Text style={styles.statLabel}>Dernière mise à jour:</Text>
                <Text style={styles.statValue}>
                  {new Date(queueStats.lastUpdate).toLocaleTimeString('fr-FR')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Informations importantes */}
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="info" size={20} color="#f39c12" />
            <Text style={styles.infoTitle}>Informations importantes</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="location-on" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>
              Restez dans la zone d'attente pour ne pas perdre votre place
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="record-voice-over" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>
              Vous serez appelé par votre nom ou numéro de dossier
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="schedule" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>
              Les temps d'attente sont estimatifs et peuvent varier
            </Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialIcons name="emergency" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>
              En cas d'urgence, présentez-vous à l'accueil
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};



export default QueueScreen; 