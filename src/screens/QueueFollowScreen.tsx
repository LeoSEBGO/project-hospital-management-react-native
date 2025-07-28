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
    
    // Rafraîchir automatiquement toutes les 30 secondes
    const interval = setInterval(() => {
      console.log('[QUEUE_FOLLOW] Rafraîchissement automatique des données de file...');
      loadQueueData();
    }, 30000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [rendezVous]);

  const loadQueueData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[QUEUE_FOLLOW] Chargement des données de file pour le rendez-vous:', {
        id: rendezVous.id,
        service_id: rendezVous.service_id,
        date: rendezVous.date_rendez_vous,
        heure: rendezVous.heure_rendez_vous
      });
      
      // Utiliser l'API pour récupérer la position dans la file pour ce service spécifique
      const response = await apiService.getQueuePosition(rendezVous.service_id, rendezVous.date_rendez_vous);
      
      console.log('[QUEUE_FOLLOW] Réponse API:', response);
      
      if (response.success && response.data) {
        // Chercher la position correspondant à ce rendez-vous
        const positions = response.data.positions || [];
        console.log('[QUEUE_FOLLOW] Positions disponibles:', positions.length);
        
        // Chercher la position qui correspond à ce rendez-vous
        const pos = positions.find((p: QueuePosition) => {
          const match = p.serviceId === rendezVous.service_id;
          console.log('[QUEUE_FOLLOW] Comparaison position:', {
            positionServiceId: p.serviceId,
            rendezVousServiceId: rendezVous.service_id,
            match: match
          });
          return match;
        });
        
        if (pos) {
          console.log('[QUEUE_FOLLOW] Position trouvée:', pos);
          setQueuePosition(pos);
        } else {
          console.log('[QUEUE_FOLLOW] Aucune position trouvée pour ce service');
          setQueuePosition(null);
          setError("Aucune information de file trouvée pour ce rendez-vous.");
        }
      } else {
        console.warn('[QUEUE_FOLLOW] Échec de la récupération des données de file:', response.message);
        setQueuePosition(null);
        setError("Impossible de récupérer la file d'attente.");
      }
    } catch (e) {
      console.error('[QUEUE_FOLLOW] Erreur lors de la récupération de la file d\'attente:', e);
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
          <TouchableOpacity 
            style={{ padding: 8 }}
            onPress={loadQueueData}
            disabled={loading}
          >
            <MaterialIcons 
              name="refresh" 
              size={20} 
              color={loading ? '#95a5a6' : '#3498db'} 
            />
          </TouchableOpacity>
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
            {/* Statistiques globales */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="analytics" size={20} color="#3498db" />
                <Text style={styles.sectionTitle}>Statistiques de la File</Text>
              </View>
              <View style={styles.serviceCard}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="people" size={16} color="#7f8c8d" />
                  <Text style={styles.detailLabel}>Total patients:</Text>
                  <Text style={styles.detailValue}>{queuePosition.totalPatients}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="schedule" size={16} color="#7f8c8d" />
                  <Text style={styles.detailLabel}>Temps moyen:</Text>
                  <Text style={styles.detailValue}>{formatTime(Math.round(queuePosition.tempsEstime / queuePosition.totalPatients))}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="update" size={16} color="#7f8c8d" />
                  <Text style={styles.detailLabel}>Dernière mise à jour:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(queuePosition.updatedAt).toLocaleTimeString('fr-FR')}
                  </Text>
                </View>
              </View>
            </View>
            
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
                <Text style={styles.positionLabel}>
                  {queuePosition.totalPatients} patients en attente
                </Text>
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
                {queuePosition.minutesRestantes > 0 && (
                  <View style={styles.timeRow}>
                    <MaterialIcons name="update" size={16} color="#7f8c8d" />
                    <Text style={styles.timeLabel}>Temps restant:</Text>
                    <Text style={styles.timeValue}>{formatTime(queuePosition.minutesRestantes)}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="event" size={20} color="#3498db" />
                <Text style={styles.sectionTitle}>Détails du Rendez-vous</Text>
              </View>
              <View style={styles.serviceCard}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="local-hospital" size={16} color="#7f8c8d" />
                  <Text style={styles.detailLabel}>Service:</Text>
                  <Text style={styles.detailValue}>{rendezVous.service?.nom || 'Service inconnu'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="event" size={16} color="#7f8c8d" />
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {rendezVous.date_rendez_vous ? new Date(rendezVous.date_rendez_vous).toLocaleDateString('fr-FR') : 'Non définie'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="access-time" size={16} color="#7f8c8d" />
                  <Text style={styles.detailLabel}>Heure:</Text>
                  <Text style={styles.detailValue}>{rendezVous.heure_rendez_vous || 'Non définie'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="sort" size={16} color="#7f8c8d" />
                  <Text style={styles.detailLabel}>Rang:</Text>
                  <Text style={styles.detailValue}>#{rendezVous.rang + 1 || 'N/A'}</Text>
                </View>
                {rendezVous.motif && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="note" size={16} color="#7f8c8d" />
                    <Text style={styles.detailLabel}>Motif:</Text>
                    <Text style={styles.detailValue}>{rendezVous.motif}</Text>
                  </View>
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