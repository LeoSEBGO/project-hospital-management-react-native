import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { apiService, RendezVous } from '../services/api';
import { realtimeService } from '../services/realtime';
import styles from '../styles/screens/RendezVousScreen.styles';

interface RendezVousScreenProps {
  onBack?: () => void;
}

const RendezVousScreen: React.FC<RendezVousScreenProps> = ({ onBack }) => {
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadRendezVous();
    setupRealtimeConnection();
    setupAutoRefresh();
    
    return () => {
      // Nettoyer les listeners lors du démontage
      realtimeService.off('rendez_vous_update', handleRendezVousUpdate);
      realtimeService.off('connection_open', handleConnectionOpen);
      realtimeService.off('connection_close', handleConnectionClose);
    };
  }, []);

  const setupRealtimeConnection = async () => {
    try {
      // Écouter les mises à jour de rendez-vous
      realtimeService.on('rendez_vous_update', handleRendezVousUpdate);
      realtimeService.on('notification', handleNewNotification);
      realtimeService.on('connection_open', handleConnectionOpen);
      realtimeService.off('connection_close', handleConnectionClose);
      
      // Se connecter au WebSocket si pas déjà connecté
      if (!realtimeService.isConnected()) {
        await realtimeService.connect();
      }
    } catch (error) {
      console.error('Erreur de connexion temps réel:', error);
    }
  };

  const setupAutoRefresh = () => {
    // Refresh automatique toutes les 30 secondes
    const interval = setInterval(() => {
      if (isConnected) {
        loadRendezVous();
        setLastUpdate(new Date());
      }
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  };

  const handleRendezVousUpdate = (updatedRendezVous: RendezVous) => {
    console.log('Mise à jour de rendez-vous reçue:', updatedRendezVous);
    setRendezVous(prev => 
      prev.map(rdv => 
        rdv.id === updatedRendezVous.id ? updatedRendezVous : rdv
      )
    );
    setLastUpdate(new Date());
  };

  const handleNewNotification = (notification: any) => {
    console.log('Nouvelle notification reçue:', notification);
    // Vous pouvez ajouter la logique de gestion des notifications ici
    // Par exemple, si la notification est un nouveau rendez-vous, vous pouvez la charger
    if (notification.type === 'rendez_vous_created' || notification.type === 'rendez_vous_updated') {
      loadRendezVous();
    }
  };

  const handleConnectionOpen = () => {
    setIsConnected(true);
    console.log('Connexion temps réel établie');
  };

  const handleConnectionClose = () => {
    setIsConnected(false);
    console.log('Connexion temps réel fermée');
  };

  const loadRendezVous = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRendezVous();
      
      if (response.success && response.data) {
        setRendezVous(response.data);
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de charger les rendez-vous');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRendezVous();
    setLastUpdate(new Date());
    setRefreshing(false);
  };

  const handleCancelRendezVous = (rendezVous: RendezVous) => {
    Alert.alert(
      'Annuler le rendez-vous',
      `Êtes-vous sûr de vouloir annuler votre rendez-vous du ${formatDate(rendezVous.date_rendez_vous)} à ${rendezVous.heure_rendez_vous} ?`,
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui, annuler', 
          style: 'destructive',
          onPress: () => cancelRendezVous(rendezVous.id)
        },
      ]
    );
  };

  const cancelRendezVous = async (id: number) => {
    try {
      const response = await apiService.cancelRendezVous(id);
      
      if (response.success) {
        Alert.alert('Succès', 'Rendez-vous annulé avec succès');
        loadRendezVous(); // Recharger la liste
      } else {
        Alert.alert('Erreur', response.message || 'Impossible d\'annuler le rendez-vous');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return '#f39c12';
      case 'CONFIRME':
        return '#27ae60';
      case 'ANNULE':
        return '#e74c3c';
      case 'TERMINE':
        return '#95a5a6';
      default:
        return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'CONFIRME':
        return 'Confirmé';
      case 'ANNULE':
        return 'Annulé';
      case 'TERMINE':
        return 'Terminé';
      default:
        return 'Inconnu';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRendezVousItem = ({ item }: { item: RendezVous }) => (
    <View style={styles.rendezVousCard}>
      <View style={styles.rendezVousHeader}>
        <View style={styles.serviceInfo}>
          <View style={styles.serviceHeader}>
            <MaterialIcons name="local-hospital" size={20} color="#3498db" />
            <Text style={styles.serviceName}>{item.service?.nom || 'Service inconnu'}</Text>
          </View>
          <Text style={styles.serviceDescription}>
            {item.service?.description || 'Aucune description'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
          <Text style={styles.statusText}>{getStatusText(item.statut)}</Text>
        </View>
      </View>

      <View style={styles.rendezVousDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <MaterialIcons name="event" size={16} color="#7f8c8d" />
            <Text style={styles.detailLabel}>Date:</Text>
          </View>
          <Text style={styles.detailValue}>{formatDate(item.date_rendez_vous)}</Text>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <MaterialIcons name="access-time" size={16} color="#7f8c8d" />
            <Text style={styles.detailLabel}>Heure:</Text>
          </View>
          <Text style={styles.detailValue}>{formatTime(item.heure_rendez_vous)}</Text>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <MaterialIcons name="sort" size={16} color="#7f8c8d" />
            <Text style={styles.detailLabel}>Rang:</Text>
          </View>
          <Text style={styles.detailValue}>#{item.rank}</Text>
        </View>
        {item.commentaire && (
          <View style={styles.detailRow}>
            <View style={styles.detailLabelContainer}>
              <MaterialIcons name="comment" size={16} color="#7f8c8d" />
              <Text style={styles.detailLabel}>Commentaire:</Text>
            </View>
            <Text style={styles.detailValue}>{item.commentaire}</Text>
          </View>
        )}
      </View>

      {item.statut === 'EN_ATTENTE' || item.statut === 'CONFIRME' ? (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelRendezVous(item)}
        >
          <MaterialIcons name="cancel" size={18} color="#fff" />
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

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
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <MaterialIcons name="arrow-back" size={24} color="#3498db" />
            </TouchableOpacity>
          )}
          <View style={styles.headerTitleContainer}>
            <MaterialIcons name="event" size={24} color="#3498db" />
            <Text style={styles.headerTitle}>Mes Rendez-vous</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.connectionStatus}>
            <MaterialIcons 
              name={isConnected ? 'wifi' : 'wifi-off'} 
              size={16}
              color={isConnected ? '#27ae60' : '#95a5a6'} 
            />
            <Text style={styles.connectionStatusText}>
              {isConnected ? 'Temps réel' : 'Inactif'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => onBack && onBack()}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
            <Text style={styles.newButtonText}>Nouveau</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Indicateur de dernière mise à jour */}
      <View style={styles.updateIndicator}>
        <Text style={styles.updateText}>
          Dernière mise à jour: {formatLastUpdate(lastUpdate)}
        </Text>
      </View>

      <FlatList
        data={rendezVous}
        renderItem={renderRendezVousItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-busy" size={48} color="#95a5a6" />
            <Text style={styles.emptyText}>Aucun rendez-vous</Text>
            <Text style={styles.emptySubtext}>
              Prenez votre premier rendez-vous en touchant le bouton "Nouveau"
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => onBack && onBack()}
            >
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Prendre un rendez-vous</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};



export default RendezVousScreen; 