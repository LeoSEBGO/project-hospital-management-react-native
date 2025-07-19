import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Patient, Statut, StatutHistorique, RendezVous } from '../services/api';
import realtimeService from '../services/realtime';
import ServicesScreen from './ServicesScreen';
import BookAppointmentScreen from './BookAppointmentScreen';
import RendezVousScreen from './RendezVousScreen';
import RendezVousDetailScreen from './RendezVousDetailScreen';
import QueueScreen from './QueueScreen';
import NotificationsScreen from './NotificationsScreen';
import styles from '../styles/screens/PatientDashboardScreen.styles';

const PatientDashboardScreen: React.FC = () => {
  const { patient, patientLogout } = useAuth();
  const [currentStatut, setCurrentStatut] = useState<Statut | null>(null);
  const [statutHistorique, setStatutHistorique] = useState<StatutHistorique[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'services' | 'bookAppointment' | 'rendezVous' | 'rendezVousDetail' | 'queue' | 'notifications'>('dashboard');
  const [patientData, setPatientData] = useState<Patient | null>(patient);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);

  useEffect(() => {
    loadPatientData();
    setupRealtimeConnection();
    setupAutoRefresh();
    
    // Si les données du patient ne contiennent pas le service, les recharger
    if (patient && !patient.service) {
      loadPatientData();
    }
    
    return () => {
      // Nettoyer les listeners lors du démontage
      realtimeService.off('statut_change', handleStatutChange);
      realtimeService.off('notification', handleNewNotification);
      realtimeService.off('rendez_vous_update', handleRendezVousUpdate);
      realtimeService.off('connection_open', handleConnectionOpen);
      realtimeService.off('connection_close', handleConnectionClose);
    };
  }, []);

  const setupRealtimeConnection = async () => {
    try {
      // Écouter les changements de statut et notifications
      realtimeService.on('statut_change', handleStatutChange);
      realtimeService.on('notification', handleNewNotification);
      realtimeService.on('rendez_vous_update', handleRendezVousUpdate);
      realtimeService.on('connection_open', handleConnectionOpen);
      realtimeService.on('connection_close', handleConnectionClose);
      
      // Se connecter au WebSocket
      await realtimeService.connect();
    } catch (error) {
      console.error('Erreur de connexion temps réel:', error);
    }
  };

  const setupAutoRefresh = () => {
    // Refresh automatique toutes les 30 secondes
    const interval = setInterval(() => {
      if (currentScreen === 'dashboard' && isConnected) {
        loadPatientData();
        setLastUpdate(new Date());
      }
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  };

  const handleStatutChange = (newStatut: Statut) => {
    console.log('[DASHBOARD] Nouveau statut reçu:', newStatut);
    setCurrentStatut(newStatut);
    setLastUpdate(new Date());
    
    // Recharger toutes les données pour avoir les informations les plus récentes
    loadPatientData();
    
    // Afficher une notification à l'utilisateur
    Alert.alert(
      'Changement de statut',
      `Votre statut a été mis à jour : ${getStatutDisplayName(newStatut.nom)}`,
      [{ text: 'OK' }]
    );
  };

  const handleNewNotification = (notification: any) => {
    console.log('[DASHBOARD] Nouvelle notification reçue:', notification);
    setLastUpdate(new Date());
    
    // Recharger les données si c'est une notification importante
    if (notification.type === 'STATUT_CHANGE' || notification.type === 'RENDEZ_VOUS_UPDATE') {
      loadPatientData();
    }
    
    // Afficher une alerte pour les notifications importantes
    if (notification.type === 'STATUT_CHANGE') {
      Alert.alert(
        'Changement de statut',
        notification.message,
        [{ text: 'OK' }]
      );
    } else if (notification.type === 'RENDEZ_VOUS_UPDATE') {
      Alert.alert(
        'Mise à jour de rendez-vous',
        notification.message,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Nouvelle notification',
        notification.message,
        [{ text: 'OK' }]
      );
    }
  };

  const handleRendezVousUpdate = (update: any) => {
    console.log('[DASHBOARD] Rendez-vous mis à jour:', update);
    setLastUpdate(new Date());
    
    // Recharger les données des rendez-vous
    loadPatientData();
    
    // Afficher une notification à l'utilisateur
    Alert.alert(
      'Mise à jour de rendez-vous',
      update.message || 'Votre rendez-vous a été mis à jour',
      [{ text: 'OK' }]
    );
  };

  const handleConnectionOpen = () => {
    setIsConnected(true);
    console.log('[DASHBOARD] Connexion temps réel établie');
    
    // Recharger les données une fois connecté pour avoir les plus récentes
    loadPatientData();
  };

  const handleConnectionClose = () => {
    setIsConnected(false);
    console.log('[DASHBOARD] Connexion temps réel fermée');
    
    // Afficher une notification à l'utilisateur
    Alert.alert(
      'Connexion perdue',
      'La connexion temps réel a été perdue. Les mises à jour ne seront plus automatiques.',
      [{ text: 'OK' }]
    );
  };

  const loadPatientData = async () => {
    try {
      setLoading(true);
      console.log('[DASHBOARD] Chargement des données patient...');
      
      const [patientResponse, statutResponse, historiqueResponse, rendezVousResponse] = await Promise.all([
        apiService.getCurrentPatient(),
        apiService.getPatientStatut(),
        apiService.getPatientStatutHistorique(),
        apiService.getRendezVous(),
      ]);

      console.log('[DASHBOARD] Réponse patient:', patientResponse);
      console.log('[DASHBOARD] Réponse statut:', statutResponse);
      console.log('[DASHBOARD] Réponse historique:', historiqueResponse);

      if (patientResponse.success && patientResponse.data) {
        console.log('[DASHBOARD] Patient chargé:', patientResponse.data);
        setPatientData(patientResponse.data);
      }

      if (statutResponse.success && statutResponse.data) {
        console.log('[DASHBOARD] Statut chargé:', statutResponse.data);
        setCurrentStatut(statutResponse.data);
      }

      if (historiqueResponse.success && historiqueResponse.data) {
        console.log('[DASHBOARD] Historique chargé:', historiqueResponse.data);
        setStatutHistorique(historiqueResponse.data);
      }

      if (rendezVousResponse.success && rendezVousResponse.data) {
        console.log('[DASHBOARD] Rendez-vous chargés:', rendezVousResponse.data);
        setRendezVous(rendezVousResponse.data);
      }
    } catch (error) {
      console.error('[DASHBOARD] Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientData();
    setLastUpdate(new Date());
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', onPress: patientLogout, style: 'destructive' },
      ]
    );
  };

  const navigateToScreen = (screen: typeof currentScreen) => {
    setCurrentScreen(screen);
  };

  const goBackToDashboard = () => {
    setCurrentScreen('dashboard');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper functions to get statut details
  const getStatutColor = (statutNom: string) => {
    switch (statutNom) {
      case 'EN_ATTENTE':
        return '#f39c12'; // Orange
      case 'EN_CONSULTATION':
        return '#27ae60'; // Green
      case 'TERMINE':
        return '#27ae60'; // Green
      default:
        return '#95a5a6'; // Grey
    }
  };

  const getStatutDisplayName = (statutNom: string) => {
    switch (statutNom) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'EN_CONSULTATION':
        return 'En consultation';
      case 'TERMINE':
        return 'Terminé';
      default:
        return statutNom;
    }
  };

  const getStatutDescription = (statutNom: string) => {
    switch (statutNom) {
      case 'EN_ATTENTE':
        return 'Vous êtes en attente de consultation.';
      case 'EN_CONSULTATION':
        return 'Vous êtes actuellement en consultation.';
      case 'TERMINE':
        return 'Votre consultation est terminée.';
      default:
        return 'Statut inconnu.';
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

  const navigateToRendezVousDetail = (rdv: RendezVous) => {
    setSelectedRendezVous(rdv);
    navigateToScreen('rendezVousDetail');
  };

  // Rendu conditionnel selon l'écran actuel
  if (currentScreen === 'services') {
    return <ServicesScreen onBack={goBackToDashboard} />;
  }

  if (currentScreen === 'bookAppointment') {
    return <BookAppointmentScreen onBack={goBackToDashboard} />;
  }

  if (currentScreen === 'rendezVous') {
    return <RendezVousScreen onBack={goBackToDashboard} />;
  }

  if (currentScreen === 'queue') {
    return <QueueScreen />;
  }

  if (currentScreen === 'notifications') {
    return <NotificationsScreen />;
  }

  if (currentScreen === 'rendezVousDetail' && selectedRendezVous) {
    return <RendezVousDetailScreen rendezVous={selectedRendezVous} onBack={goBackToDashboard} />;
  }

  // Écran principal du dashboard
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.patientInfo}>
          <Text style={styles.welcomeText}>Bienvenue,</Text>
          <Text style={styles.patientName}>
            {patientData?.prenom} {patientData?.nom}
          </Text>
          <Text style={styles.dossierNumber}>Email: {patientData?.email}</Text>
        </View>
        <View style={styles.headerControls}>
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
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={loadPatientData}
              disabled={loading}
            >
              <MaterialIcons 
                name="refresh" 
                size={20} 
                color={loading ? '#95a5a6' : '#3498db'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
              accessibilityLabel="Déconnexion"
              accessibilityHint="Appuyez pour vous déconnecter de l'application"
            >
              <MaterialIcons name="logout" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Indicateur de dernière mise à jour */}
        <View style={styles.updateIndicator}>
          <Text style={styles.updateText}>
            Dernière mise à jour: {formatLastUpdate(lastUpdate)}
          </Text>
        </View>

        {/* Statut actuel -> Liste des rendez-vous */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rendez-vous à venir</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3498db" />
            </View>
          ) : rendezVous.length > 0 ?
            rendezVous
              .sort((a, b) => new Date(a.ajoute_le).getTime() - new Date(b.ajoute_le).getTime())
              .map((rdv) => (
                <TouchableOpacity 
                  key={rdv.id} 
                  style={styles.rendezVousCard}
                  onPress={() => navigateToRendezVousDetail(rdv)}
                >
                  <View style={styles.rendezVousHeader}>
                    <View style={styles.rendezVousInfo}>
                      <Text style={styles.rendezVousService}>{rdv.service?.nom || 'Service inconnu'}</Text>
                      <Text style={styles.rendezVousDate}>
                        {rdv.date_rdv ? formatDate(rdv.date_rdv) : 'Date à définir'}
                      </Text>
                    </View>
                    <View style={[styles.rendezVousStatus, { backgroundColor: getStatusColor(rdv.statut?.nom || '') }]}> 
                      <Text style={styles.rendezVousStatusText}>{getStatusText(rdv.statut?.nom || '')}</Text>
                    </View>
                  </View>
                  <View style={styles.rendezVousDetails}>
                    <Text style={styles.rendezVousRank}>Rang: #{rdv.rang}</Text>
                    {rdv.motif && (
                      <Text style={styles.rendezVousComment} numberOfLines={2}>{rdv.motif}</Text>
                    )}
                  </View>
                  <View style={styles.rendezVousFooter}>
                    <Text style={styles.rendezVousDetailText}>Appuyez pour voir les détails</Text>
                    <MaterialIcons name="chevron-right" size={16} color="#95a5a6" />
                  </View>
                </TouchableOpacity>
              ))
          : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>Aucun rendez-vous à venir</Text>
            </View>
          )}
        </View>

        {/* Informations personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations Personnelles</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nom complet:</Text>
              <Text style={styles.infoValue}>{patientData?.prenom} {patientData?.nom}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{patientData?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact:</Text>
              <Text style={styles.infoValue}>{patientData?.contact || 'Non renseigné'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date d'inscription:</Text>
              <Text style={styles.infoValue}>
                {patientData?.created_at ? formatDate(patientData.created_at) : 'Non renseigné'}
              </Text>
            </View>
          </View>
        </View>

        {/* Rendez-vous prochains */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rendez-vous Prochains</Text>
          {rendezVous.length > 0 ? (
            rendezVous
              .filter(rdv => rdv.statut?.nom === 'EN_ATTENTE' || rdv.statut?.nom === 'EN_CONSULTATION')
              .sort((a, b) => new Date(a.ajoute_le).getTime() - new Date(b.ajoute_le).getTime())
              .slice(0, 3)
              .map((rdv) => (
                <View key={rdv.id} style={styles.rendezVousCard}>
                  <View style={styles.rendezVousHeader}>
                    <View style={styles.rendezVousInfo}>
                      <Text style={styles.rendezVousService}>{rdv.service?.nom || 'Service inconnu'}</Text>
                      <Text style={styles.rendezVousDate}>
                        {rdv.date_rdv ? formatDate(rdv.date_rdv) : 'Date à définir'}
                      </Text>
                    </View>
                    <View style={[styles.rendezVousStatus, { backgroundColor: getStatusColor(rdv.statut?.nom || '') }]}>
                      <Text style={styles.rendezVousStatusText}>{getStatusText(rdv.statut?.nom || '')}</Text>
                    </View>
                  </View>
                  <View style={styles.rendezVousDetails}>
                    <Text style={styles.rendezVousRank}>Rang: #{rdv.rang}</Text>
                    {rdv.motif && (
                      <Text style={styles.rendezVousComment}>{rdv.motif}</Text>
                    )}
                  </View>
                </View>
              ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>Aucun rendez-vous à venir</Text>
            </View>
          )}
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigateToScreen('rendezVous')}
            >
              <MaterialIcons name="event" size={32} color="#3498db" />
              <Text style={styles.actionTitle}>Mes Rendez-vous</Text>
              <Text style={styles.actionDescription}>Voir et gérer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigateToScreen('bookAppointment')}
            >
              <MaterialIcons name="add-circle" size={32} color="#27ae60" />
              <Text style={styles.actionTitle}>Prendre RDV</Text>
              <Text style={styles.actionDescription}>Nouveau rendez-vous</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigateToScreen('queue')}
            >
              <MaterialIcons name="queue" size={32} color="#f39c12" />
              <Text style={styles.actionTitle}>File d'Attente</Text>
              <Text style={styles.actionDescription}>Temps réel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigateToScreen('notifications')}
            >
              <MaterialIcons name="notifications" size={32} color="#e74c3c" />
              <Text style={styles.actionTitle}>Notifications</Text>
              <Text style={styles.actionDescription}>Temps réel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Historique des statuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historique des Statuts</Text>
          {statutHistorique.length > 0 ? (
            statutHistorique.map((historique, index) => (
              <View key={historique.id} style={styles.historiqueCard}>
                <View style={styles.historiqueHeader}>
                  <Text style={styles.historiqueDate}>
                    {formatDate(historique.modifie_le)}
                  </Text>
                  <View style={[styles.historiqueBadge, { backgroundColor: getStatutColor(historique.statut?.nom || '') }]}>
                    <Text style={styles.historiqueBadgeText}>
                      {getStatutDisplayName(historique.statut?.nom || 'Statut inconnu')}
                    </Text>
                  </View>
                </View>
                {historique.modifie_par && (
                  <Text style={styles.historiqueCommentaire}>
                    Modifié par: {historique.modifie_par.prenom} {historique.modifie_par.nom}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>Aucun historique disponible</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};



export default PatientDashboardScreen; 