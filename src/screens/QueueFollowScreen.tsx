import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { apiService, RendezVous, QueuePosition } from '../services/api';
import styles from '../styles/screens/QueueScreen.styles';

interface QueueFollowScreenProps {
  rendezVous: RendezVous;
  onBack?: () => void;
}

const QueueFollowScreen: React.FC<QueueFollowScreenProps> = ({ rendezVous, onBack }) => {
  const [queuePosition, setQueuePosition] = useState<QueuePosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQueueData();
    // eslint-disable-next-line
  }, [rendezVous]);

  const loadQueueData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getQueuePosition();
      if (response.success && response.data) {
        const pos = response.data.positions.find((p: QueuePosition) => p.serviceId === rendezVous.service_id && p.heureRendezVous === rendezVous.heure_rendez_vous);
        if (pos) {
          setQueuePosition(pos);
        } else {
          setQueuePosition(null);
          setError("Aucune information de file trouvée pour ce rendez-vous.");
        }
      } else {
        setQueuePosition(null);
        setError("Impossible de récupérer la file d'attente.");
      }
    } catch (e) {
      setQueuePosition(null);
      setError("Erreur lors de la récupération de la file d'attente.");
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
    switch (status?.toUpperCase()) {
      case 'EN_ATTENTE':
        return '#f39c12';
      case 'EN_CONSULTATION':
        return '#3498db';
      case 'TERMINE':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'EN_CONSULTATION':
        return 'En consultation';
      case 'TERMINE':
        return 'Terminé';
      default:
        return 'Inconnu';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <MaterialIcons name="arrow-back" size={24} color="#3498db" />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Suivi de la file</Text>
            <Text style={styles.headerSubtitle}>{rendezVous.service?.nom || 'Service'}</Text>
          </View>
        </View>
      </View>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Chargement de la file d'attente...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="error-outline" size={48} color="#e74c3c" />
            <Text style={styles.emptyTitle}>Erreur</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : queuePosition ? (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="person" size={20} color="#3498db" />
                <Text style={styles.sectionTitle}>Votre Position</Text>
              </View>
              <View style={styles.positionCard}>
                <Text style={styles.positionNumber}>{queuePosition.position}</Text>
                <Text style={styles.positionLabel}>Position dans la file</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(queuePosition.statut) }]}> 
                  <Text style={styles.statusBadgeText}>{getStatusText(queuePosition.statut)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="local-hospital" size={20} color="#3498db" />
                <Text style={styles.sectionTitle}>Service</Text>
              </View>
              <View style={styles.serviceCard}>
                <Text style={styles.serviceName}>{queuePosition.service.nom}</Text>
                <Text style={styles.serviceDescription}>{queuePosition.service.description}</Text>
              </View>
            </View>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="access-time" size={20} color="#3498db" />
                <Text style={styles.sectionTitle}>Temps d'Attente</Text>
              </View>
              <View style={styles.timeCard}>
                <View style={styles.timeRow}>
                  <MaterialIcons name="schedule" size={16} color="#7f8c8d" />
                  <Text style={styles.timeLabel}>Temps estimé:</Text>
                  <Text style={styles.timeValue}>{formatTime(queuePosition.tempsEstime)}</Text>
                </View>
                <View style={styles.timeRow}>
                  <MaterialIcons name="timer" size={16} color="#7f8c8d" />
                  <Text style={styles.timeLabel}>Temps d'attente:</Text>
                  <Text style={styles.timeValue}>{formatTime(queuePosition.tempsAttente)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="event" size={20} color="#3498db" />
                <Text style={styles.sectionTitle}>Rendez-vous</Text>
              </View>
              <View style={styles.serviceCard}>
                <Text style={styles.serviceName}>{rendezVous.service?.nom || 'Service inconnu'}</Text>
                <Text style={styles.serviceDescription}>Heure : {rendezVous.heure_rendez_vous}</Text>
                {rendezVous.motif && (
                  <Text style={styles.serviceDescription}>Motif : {rendezVous.motif}</Text>
                )}
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default QueueFollowScreen; 