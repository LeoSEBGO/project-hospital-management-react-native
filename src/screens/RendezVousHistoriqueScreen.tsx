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
import { apiService, RendezVousHistorique } from '../services/api';
import styles from '../styles/screens/RendezVousHistoriqueScreen.styles';

interface RendezVousHistoriqueScreenProps {
  onBack?: () => void;
}

const RendezVousHistoriqueScreen: React.FC<RendezVousHistoriqueScreenProps> = ({ onBack }) => {
  const [historique, setHistorique] = useState<RendezVousHistorique[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistorique();
  }, []);

  const loadHistorique = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRendezVousHistorique();
      
      if (response.success && response.data) {
        setHistorique(response.data);
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de charger l\'historique');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistorique();
    setRefreshing(false);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATED':
        return 'add-circle';
      case 'UPDATED':
        return 'edit';
      case 'CANCELLED':
        return 'cancel';
      case 'COMPLETED':
        return 'check-circle';
      default:
        return 'event';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED':
        return '#27ae60';
      case 'UPDATED':
        return '#3498db';
      case 'CANCELLED':
        return '#e74c3c';
      case 'COMPLETED':
        return '#f39c12';
      default:
        return '#95a5a6';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'CREATED':
        return 'Créé';
      case 'UPDATED':
        return 'Modifié';
      case 'CANCELLED':
        return 'Annulé';
      case 'COMPLETED':
        return 'Terminé';
      default:
        return action;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoriqueItem = ({ item }: { item: RendezVousHistorique }) => (
    <View style={styles.historiqueCard}>
      <View style={styles.historiqueHeader}>
        <View style={styles.actionContainer}>
          <MaterialIcons
            name={getActionIcon(item.action)}
            size={24}
            color={getActionColor(item.action)}
          />
          <View style={styles.actionInfo}>
            <Text style={styles.actionText}>{getActionText(item.action)}</Text>
            <Text style={styles.serviceName}>{item.service?.nom}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDateTime(item.created_at)}</Text>
      </View>

      {item.motif && (
        <View style={styles.motifContainer}>
          <Text style={styles.motifLabel}>Motif :</Text>
          <Text style={styles.motifText}>{item.motif}</Text>
        </View>
      )}

      {item.date_rendez_vous && (
        <View style={styles.dateContainer}>
          <MaterialIcons name="event" size={16} color="#3498db" />
          <Text style={styles.dateInfo}>
            {formatDate(item.date_rendez_vous)}
            {item.heure_rendez_vous && ` à ${item.heure_rendez_vous}`}
          </Text>
        </View>
      )}

      {item.commentaire && (
        <View style={styles.commentaireContainer}>
          <Text style={styles.commentaireLabel}>Commentaire :</Text>
          <Text style={styles.commentaireText}>{item.commentaire}</Text>
        </View>
      )}

      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: getActionColor(item.action) }]}>
          <Text style={styles.statusText}>{getActionText(item.action)}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Chargement de l'historique...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <MaterialIcons name="arrow-back" size={24} color="#3498db" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerTitle}>Historique des Rendez-vous</Text>
        <Text style={styles.headerSubtitle}>
          Consultez l'historique de tous vos rendez-vous
        </Text>
      </View>

      <FlatList
        data={historique}
        renderItem={renderHistoriqueItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={64} color="#bdc3c7" />
            <Text style={styles.emptyTitle}>Aucun historique</Text>
            <Text style={styles.emptyText}>
              Vous n'avez pas encore d'historique de rendez-vous
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default RendezVousHistoriqueScreen; 