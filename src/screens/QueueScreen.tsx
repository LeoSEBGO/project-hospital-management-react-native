import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { apiService, RendezVous } from '../services/api';
import styles from '../styles/screens/QueueScreen.styles';
import QueueFollowScreen from './QueueFollowScreen';

interface QueueScreenProps {
  onBack?: () => void;
}

const QueueScreen: React.FC<QueueScreenProps> = ({ onBack }) => {
  const [rendezVousDuJour, setRendezVousDuJour] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null);

  useEffect(() => {
    loadRendezVousDuJour();
  }, []);

  const loadRendezVousDuJour = async () => {
    try {
      setLoading(true);
      console.log('[QUEUE_SCREEN] Chargement des rendez-vous actifs...');
      
      const response = await apiService.getRendezVousActifs();
      if (response.success && response.data) {
        console.log('[QUEUE_SCREEN] Rendez-vous reçus:', response.data.length);
        
        // Normaliser la date d'aujourd'hui
        const aujourdhui = new Date().toISOString().split('T')[0];
        console.log('[QUEUE_SCREEN] Date d\'aujourd\'hui:', aujourdhui);
        
        // Fonction pour normaliser une date
        const normalizeDate = (dateInput: string | Date): string => {
          try {
            const date = new Date(dateInput);
            if (isNaN(date.getTime())) {
              console.warn('[QUEUE_SCREEN] Date invalide:', dateInput);
              return '';
            }
            return date.toISOString().split('T')[0];
          } catch (error) {
            console.error('[QUEUE_SCREEN] Erreur lors de la normalisation de la date:', dateInput, error);
            return '';
          }
        };
        
        // Filtrer seulement les rendez-vous d'aujourd'hui
        const rdvDuJour = response.data.filter((rdv: RendezVous) => {
          if (!rdv.date_rendez_vous) {
            console.log('[QUEUE_SCREEN] Rendez-vous sans date:', rdv.id);
            return false;
          }
          
          const normalizedRdvDate = normalizeDate(rdv.date_rendez_vous);
          const isToday = normalizedRdvDate === aujourdhui;
          
          console.log('[QUEUE_SCREEN] Rendez-vous', rdv.id, 'date:', rdv.date_rendez_vous, 'normalisée:', normalizedRdvDate, 'est aujourd\'hui:', isToday);
          
          return isToday;
        });
        
        console.log('[QUEUE_SCREEN] Rendez-vous du jour trouvés:', rdvDuJour.length);
        
        // Trier par heure de rendez-vous
        rdvDuJour.sort((a: RendezVous, b: RendezVous) => {
          if (!a.heure_rendez_vous || !b.heure_rendez_vous) return 0;
          return a.heure_rendez_vous.localeCompare(b.heure_rendez_vous);
        });
        
        setRendezVousDuJour(rdvDuJour);
      } else {
        console.warn('[QUEUE_SCREEN] Échec du chargement des rendez-vous:', response.message);
        setRendezVousDuJour([]);
      }
    } catch (error) {
      console.error('[QUEUE_SCREEN] Erreur lors du chargement des rendez-vous du jour:', error);
      setRendezVousDuJour([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRendezVousDuJour();
    setRefreshing(false);
  };

  const formatTime = (time: string): string => {
    if (!time) return '';
    return time.substring(0, 5); // Afficher seulement HH:MM
  };

  const formatDate = (date: string): string => {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const handleVoirFile = (rendezVous: RendezVous) => {
    setSelectedRdv(rendezVous);
  };

  const handleBackFromFollow = () => {
    setSelectedRdv(null);
  };

  const renderRendezVous = ({ item }: { item: RendezVous }) => (
    <View style={styles.rendezVousCard}>
      <View style={styles.rendezVousHeader}>
        <View style={styles.serviceInfo}>
          <MaterialIcons name="local-hospital" size={20} color="#3498db" />
          <Text style={styles.serviceName}>{item.service?.nom || 'Service inconnu'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut?.nom || '') }]}>
          <Text style={styles.statusBadgeText}>
            {getStatusText(item.statut?.nom || '')}
          </Text>
        </View>
      </View>
      <View style={styles.rendezVousDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="event" size={16} color="#7f8c8d" />
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{formatDate(item.date_rendez_vous || '')}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="access-time" size={16} color="#7f8c8d" />
          <Text style={styles.detailLabel}>Heure:</Text>
          <Text style={styles.detailValue}>{formatTime(item.heure_rendez_vous || '')}</Text>
        </View>
        {item.motif && (
          <View style={styles.detailRow}>
            <MaterialIcons name="note" size={16} color="#7f8c8d" />
            <Text style={styles.detailLabel}>Motif:</Text>
            <Text style={styles.detailValue}>{item.motif}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity 
        style={styles.voirFileButton}
        onPress={() => handleVoirFile(item)}
      >
        <MaterialIcons name="queue" size={16} color="#fff" />
        <Text style={styles.voirFileButtonText}>Voir la file d'attente</Text>
      </TouchableOpacity>
    </View>
  );

  if (selectedRdv) {
    return <QueueFollowScreen rendezVous={selectedRdv} onBack={handleBackFromFollow} />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Chargement des rendez-vous...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {onBack && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onBack}
            >
              <MaterialIcons name="arrow-back" size={24} color="#3498db" />
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Mes Rendez-vous</Text>
            <Text style={styles.headerSubtitle}>Aujourd'hui</Text>
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
        {rendezVousDuJour.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-busy" size={64} color="#95a5a6" />
            <Text style={styles.emptyTitle}>Aucun rendez-vous aujourd'hui</Text>
            <Text style={styles.emptyText}>
              Vous n'avez pas de rendez-vous programmé pour aujourd'hui.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <MaterialIcons name="today" size={20} color="#3498db" />
              <Text style={styles.summaryText}>
                {rendezVousDuJour.length} rendez-vous aujourd'hui
              </Text>
            </View>
            <FlatList
              data={rendezVousDuJour}
              renderItem={renderRendezVous}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default QueueScreen; 