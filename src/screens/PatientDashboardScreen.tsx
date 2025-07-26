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
import { apiService, Patient, Statut, StatutHistorique, RendezVous, RealTimeNotification, Service } from '../services/api';
import realtimeService from '../services/realtime';
import ServicesScreen from './ServicesScreen';
import BookAppointmentScreen from './BookAppointmentScreen';
import RendezVousScreen from './RendezVousScreen';
import RendezVousDetailScreen from './RendezVousDetailScreen';
import RendezVousHistoriqueScreen from './RendezVousHistoriqueScreen';
import QueueScreen from './QueueScreen';
import NotificationsScreen from './NotificationsScreen';
import PatientLoginScreen from './PatientLoginScreen';
import PatientRegisterScreen from './PatientRegisterScreen';
import PatientProfileEditScreen from './PatientProfileEditScreen';
import RendezVousEditScreen from './RendezVousEditScreen';
import styles from '../styles/screens/PatientDashboardScreen.styles';

const PatientDashboardScreen: React.FC = () => {
  const { patient, patientLogout, isAuthenticated, loading: authLoading } = useAuth();
  const [currentStatut, setCurrentStatut] = useState<Statut | null>(null);
  const [statutHistorique, setStatutHistorique] = useState<StatutHistorique[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'services' | 'bookAppointment' | 'rendezVous' | 'rendezVousDetail' | 'rendezVousEdit' | 'rendezVousHistorique' | 'queue' | 'notifications' | 'profileEdit'>('dashboard');
  const [patientData, setPatientData] = useState<Patient | null>(patient);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [selectedRendezVous, setSelectedRendezVous] = useState<RendezVous | null>(null);
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);

  useEffect(() => {
    loadPatientData();
    
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

  // Effet pour gérer la connexion realtime uniquement quand l'utilisateur est authentifié
  useEffect(() => {
    if (patient) {
      // L'utilisateur est authentifié, se connecter au realtime
      console.log('[DASHBOARD] Utilisateur authentifié, connexion au realtime...');
      setupRealtimeConnection();
      setupAutoRefresh();
    } else {
      // L'utilisateur n'est pas authentifié, déconnecter le realtime
      console.log('[DASHBOARD] Utilisateur non authentifié, déconnexion du realtime...');
      realtimeService.disconnect();
      setIsConnected(false);
    }
  }, [patient]);

  const setupRealtimeConnection = async () => {
    try {
      // Vérifier que l'utilisateur est authentifié
      if (!patient) {
        console.log('[DASHBOARD] Utilisateur non authentifié, connexion realtime annulée');
        return;
      }

      console.log('[DASHBOARD] Configuration de la connexion realtime...');
      
      // Écouter les changements de statut et notifications
      realtimeService.on('statut_change', handleStatutChange);
      realtimeService.on('notification', handleNewNotification);
      realtimeService.on('rendez_vous_update', handleRendezVousUpdate);
      realtimeService.on('connection_open', handleConnectionOpen);
      realtimeService.on('connection_close', handleConnectionClose);
      
      // Se connecter au WebSocket
      await realtimeService.connect();
      setIsConnected(true);
    } catch (error) {
      console.error('Erreur de connexion temps réel:', error);
    }
  };

  const setupAutoRefresh = () => {
    // Refresh automatique toutes les 30 secondes seulement si connecté
    const interval = setInterval(() => {
      if (currentScreen === 'dashboard' && isConnected && patient) {
        console.log('[DASHBOARD] Refresh automatique...');
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
      
      const [patientResponse, statutResponse, historiqueResponse, rendezVousResponse, notificationsResponse] = await Promise.all([
        apiService.getCurrentPatient(),
        apiService.getPatientStatut(),
        apiService.getPatientStatutHistorique(),
        apiService.getRendezVousActifs(),
        apiService.getNotifications(),
      ]);

      console.log('[DASHBOARD] Réponses reçues:', {
        patient: patientResponse.success,
        statut: statutResponse.success,
        historique: historiqueResponse.success,
        rendezVous: rendezVousResponse.success,
        notifications: notificationsResponse.success
      });

      if (patientResponse.success && patientResponse.data) {
        setPatientData(patientResponse.data);
        console.log('[DASHBOARD] Données patient mises à jour');
      } else {
        console.warn('[DASHBOARD] Échec du chargement des données patient:', patientResponse.message);
      }

      if (statutResponse.success && statutResponse.data) {
        setCurrentStatut(statutResponse.data);
        console.log('[DASHBOARD] Statut patient mis à jour:', statutResponse.data.nom);
      } else {
        console.warn('[DASHBOARD] Échec du chargement du statut:', statutResponse.message);
      }

      if (historiqueResponse.success && historiqueResponse.data) {
        setStatutHistorique(historiqueResponse.data);
        console.log('[DASHBOARD] Historique statut mis à jour:', historiqueResponse.data.length, 'entrées');
      } else {
        console.warn('[DASHBOARD] Échec du chargement de l\'historique:', historiqueResponse.message);
      }

      if (rendezVousResponse.success && rendezVousResponse.data) {
        setRendezVous(rendezVousResponse.data);
        console.log(`[DASHBOARD] Rendez-vous actifs chargés: ${rendezVousResponse.data.length}`);
        
        // Log détaillé des rendez-vous pour débogage
        rendezVousResponse.data.forEach((rdv: any, index: number) => {
          console.log(`[DASHBOARD] Rendez-vous ${index + 1}:`, {
            id: rdv.id,
            date: rdv.date_rendez_vous,
            heure: rdv.heure_rendez_vous,
            service: rdv.service?.nom,
            statut: rdv.statut?.nom
          });
        });
      } else {
        console.warn('[DASHBOARD] Échec du chargement des rendez-vous:', rendezVousResponse.message);
        setRendezVous([]);
      }

      if (notificationsResponse.success && notificationsResponse.data) {
        setNotifications(notificationsResponse.data);
        console.log('[DASHBOARD] Notifications mises à jour:', notificationsResponse.data.length);
      } else {
        console.warn('[DASHBOARD] Échec du chargement des notifications:', notificationsResponse.message);
        setNotifications([]);
      }

    } catch (error) {
      console.error('[DASHBOARD] Erreur lors du chargement des données:', error);
      // Réinitialiser les données en cas d'erreur
      setRendezVous([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientData();
    setLastUpdate(new Date());
    setIsConnected(true);
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

  const navigateToScreen = async (screen: typeof currentScreen, params?: any) => {
    console.log('[DASHBOARD] Navigation vers:', screen, 'avec params:', params);
    
    // Gérer les paramètres de navigation spécifiques
    if (params) {
      switch (screen) {
        case 'rendezVousDetail':
          if (params.appointmentId) {
            // Chercher d'abord dans les rendez-vous déjà chargés
            let targetRendezVous = rendezVous.find(rdv => rdv.id === params.appointmentId);
            
            // Si pas trouvé, charger le rendez-vous spécifique depuis l'API
            if (!targetRendezVous) {
              try {
                console.log('[DASHBOARD] Chargement du rendez-vous spécifique:', params.appointmentId);
                const response = await apiService.getRendezVousById(params.appointmentId);
                if (response.success && response.data) {
                  targetRendezVous = response.data;
                  setSelectedRendezVous(targetRendezVous);
                } else {
                  console.error('[DASHBOARD] Impossible de charger le rendez-vous:', params.appointmentId);
                  Alert.alert('Erreur', 'Impossible de charger les détails du rendez-vous');
                  return;
                }
              } catch (error) {
                console.error('[DASHBOARD] Erreur lors du chargement du rendez-vous:', error);
                Alert.alert('Erreur', 'Impossible de charger les détails du rendez-vous');
                return;
              }
            } else {
              setSelectedRendezVous(targetRendezVous);
            }
          }
          break;
        default:
          break;
      }
    }
    
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
    });
  };

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fonction pour normaliser une date (retourne YYYY-MM-DD)
  const normalizeDate = (dateInput: string | Date): string => {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        console.warn('[DASHBOARD] Date invalide:', dateInput);
        return '';
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('[DASHBOARD] Erreur lors de la normalisation de la date:', dateInput, error);
      return '';
    }
  };

  // Fonction pour vérifier si une date est aujourd'hui
  const isToday = (dateInput: string | Date): boolean => {
    try {
      const normalizedDate = normalizeDate(dateInput);
      if (!normalizedDate) return false;
      
      const today = new Date();
      const todayNormalized = today.toISOString().split('T')[0];
      
      console.log('[DASHBOARD] Comparaison dates:', { 
        input: normalizedDate, 
        today: todayNormalized, 
        isEqual: normalizedDate === todayNormalized 
      });
      
      return normalizedDate === todayNormalized;
    } catch (error) {
      console.error('[DASHBOARD] Erreur dans isToday:', error);
      return false;
    }
  };

  // Fonction pour vérifier si une date est dans le futur (après aujourd'hui)
  const isFutureDate = (dateInput: string | Date): boolean => {
    try {
      const normalizedDate = normalizeDate(dateInput);
      if (!normalizedDate) return false;
      
      const today = new Date();
      const todayNormalized = today.toISOString().split('T')[0];
      
      console.log('[DASHBOARD] Vérification date future:', { 
        input: normalizedDate, 
        today: todayNormalized, 
        isFuture: normalizedDate > todayNormalized 
      });
      
      return normalizedDate > todayNormalized;
    } catch (error) {
      console.error('[DASHBOARD] Erreur dans isFutureDate:', error);
      return false;
    }
  };

  // Fonction pour filtrer les rendez-vous du jour
  const getRendezVousToday = () => {
    console.log('[DASHBOARD] Filtrage rendez-vous du jour...');
    console.log('[DASHBOARD] Total rendez-vous:', rendezVous.length);
    
    const todayRendezVous = rendezVous.filter(rdv => {
      if (!rdv.date_rendez_vous) {
        console.log('[DASHBOARD] Rendez-vous sans date:', rdv.id);
        return false;
      }
      
      const isTodayRdv = isToday(rdv.date_rendez_vous);
      console.log('[DASHBOARD] Rendez-vous', rdv.id, 'date:', rdv.date_rendez_vous, 'est aujourd\'hui:', isTodayRdv);
      
      return isTodayRdv;
    });
    
    console.log('[DASHBOARD] Rendez-vous du jour trouvés:', todayRendezVous.length);
    return todayRendezVous;
  };

  // Fonction pour filtrer les rendez-vous des jours suivants
  const getRendezVousFuture = () => {
    console.log('[DASHBOARD] Filtrage rendez-vous futurs...');
    console.log('[DASHBOARD] Total rendez-vous:', rendezVous.length);
    
    const futureRendezVous = rendezVous.filter(rdv => {
      if (!rdv.date_rendez_vous) {
        console.log('[DASHBOARD] Rendez-vous sans date:', rdv.id);
        return false;
      }
      
      const isFutureRdv = isFutureDate(rdv.date_rendez_vous);
      console.log('[DASHBOARD] Rendez-vous', rdv.id, 'date:', rdv.date_rendez_vous, 'est futur:', isFutureRdv);
      
      return isFutureRdv;
    });
    
    console.log('[DASHBOARD] Rendez-vous futurs trouvés:', futureRendezVous.length);
    return futureRendezVous;
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

  const handleAppointmentBooked = () => {
    setCurrentScreen('dashboard');
    loadPatientData();
  };



  // Afficher la screen de connexion si l'utilisateur n'est pas authentifié
  if (!isAuthenticated && !authLoading) {
    // La navigation login/register est maintenant gérée dans App.tsx
    return null;
  }



  // Afficher un loader pendant la vérification d'authentification
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Vérification de l'authentification...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Rendu conditionnel selon l'écran actuel
  if (currentScreen === 'services') {
    return <ServicesScreen onBack={goBackToDashboard} onAppointmentBooked={loadPatientData} />;
  }

  if (currentScreen === 'bookAppointment') {
    return <BookAppointmentScreen onBack={goBackToDashboard} onAppointmentCreated={loadPatientData} />;
  }

  if (currentScreen === 'rendezVous') {
    return <RendezVousScreen onBack={goBackToDashboard} />;
  }

  if (currentScreen === 'queue') {
    return <QueueScreen onBack={goBackToDashboard} />;
  }

  if (currentScreen === 'notifications') {
    return <NotificationsScreen onBack={goBackToDashboard} onNavigateToScreen={navigateToScreen} />;
  }

  if (currentScreen === 'rendezVousDetail' && selectedRendezVous) {
    return <RendezVousDetailScreen 
      rendezVous={selectedRendezVous} 
      onBack={goBackToDashboard}
      onEditRendezVous={() => navigateToScreen('rendezVousEdit')}
      onRendezVousCancelled={loadPatientData}
    />;
  }

  if (currentScreen === 'rendezVousEdit' && selectedRendezVous) {
    return <RendezVousEditScreen 
      rendezVous={selectedRendezVous} 
      onBack={goBackToDashboard} 
      onRendezVousUpdated={(updatedRendezVous) => {
        setSelectedRendezVous(updatedRendezVous);
        // Recharger toutes les données pour s'assurer de la cohérence
        loadPatientData();
      }}
    />;
  }

  if (currentScreen === 'profileEdit') {
    return <PatientProfileEditScreen 
      onBack={goBackToDashboard} 
      onProfileUpdated={() => {
        loadPatientData();
      }}
    />;
  }

  if (currentScreen === 'rendezVousHistorique') {
    return <RendezVousHistoriqueScreen onBack={goBackToDashboard} />;
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
              style={styles.notificationButton}
              onPress={() => navigateToScreen('notifications')}
            >
              <MaterialIcons 
                name="notifications" 
                size={20} 
                color="#3498db" 
              />
              {notifications.filter(n => !n.read).length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notifications.filter(n => !n.read).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
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

        {/* Rendez-vous du jour */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rendez-vous du jour</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.loadingText}>Chargement des rendez-vous...</Text>
            </View>
          ) : getRendezVousToday().length > 0 ? (
            getRendezVousToday()
              .sort((a, b) => {
                // Trier par heure de rendez-vous si disponible, sinon par date de création
                if (a.heure_rendez_vous && b.heure_rendez_vous) {
                  return a.heure_rendez_vous.localeCompare(b.heure_rendez_vous);
                }
                return new Date(a.ajoute_le).getTime() - new Date(b.ajoute_le).getTime();
              })
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
                        {rdv.date_rendez_vous ? formatDate(rdv.date_rendez_vous) : 'Date à définir'}
                      </Text>
                      <Text style={styles.rendezVousHeure}>
                        {rdv.heure_rendez_vous ? rdv.heure_rendez_vous : 'Heure à définir'}
                      </Text>
                    </View>
                    <View style={[styles.rendezVousStatus, { backgroundColor: getStatusColor(rdv.statut?.nom || '') }]}> 
                      <Text style={styles.rendezVousStatusText}>{getStatusText(rdv.statut?.nom || '')}</Text>
                    </View>
                  </View>
                  <View style={styles.rendezVousDetails}>
                    <Text style={styles.rendezVousRank}>Rang: #{rdv.rang || 'N/A'}</Text>
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
          ) : (
            <View style={styles.noDataContainer}>
              <MaterialIcons name="event-busy" size={24} color="#95a5a6" />
              <Text style={styles.noDataText}>Aucun rendez-vous aujourd'hui</Text>
            </View>
          )}
        </View>

        {/* Informations personnelles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informations Personnelles</Text>
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => navigateToScreen('profileEdit')}
            >
              <MaterialIcons name="edit" size={16} color="#3498db" />
              <Text style={styles.editProfileButtonText}>Modifier</Text>
            </TouchableOpacity>
          </View>
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
              onPress={() => navigateToScreen('rendezVousHistorique')}
            >
              <MaterialIcons name="history" size={32} color="#9b59b6" />
              <Text style={styles.actionTitle}>Historique</Text>
              <Text style={styles.actionDescription}>Rendez-vous</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigateToScreen('services')}
            >
              <MaterialIcons name="event" size={32} color="#3498db" />
              <Text style={styles.actionTitle}>Services</Text>
              <Text style={styles.actionDescription}>Voir les services</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rendez-vous à venir */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rendez-vous à venir</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.loadingText}>Chargement des rendez-vous...</Text>
            </View>
          ) : getRendezVousFuture().length > 0 ? (
            getRendezVousFuture()
              .sort((a, b) => {
                // Trier par date de rendez-vous, puis par heure
                if (a.date_rendez_vous && b.date_rendez_vous) {
                  const dateA = new Date(a.date_rendez_vous).getTime();
                  const dateB = new Date(b.date_rendez_vous).getTime();
                  if (dateA !== dateB) {
                    return dateA - dateB;
                  }
                  // Si même date, trier par heure
                  if (a.heure_rendez_vous && b.heure_rendez_vous) {
                    return a.heure_rendez_vous.localeCompare(b.heure_rendez_vous);
                  }
                }
                return new Date(a.ajoute_le).getTime() - new Date(b.ajoute_le).getTime();
              })
              .slice(0, 3)
              .map((rdv) => (
                <View key={rdv.id} style={styles.rendezVousCard}>
                  <View style={styles.rendezVousHeader}>
                    <View style={styles.rendezVousInfo}>
                      <Text style={styles.rendezVousService}>{rdv.service?.nom || 'Service inconnu'}</Text>
                      <Text style={styles.rendezVousDate}>
                        {rdv.date_rendez_vous ? formatDate(rdv.date_rendez_vous) : 'Date à définir'}
                      </Text>
                      <Text style={styles.rendezVousHeure}>
                        {rdv.heure_rendez_vous ? rdv.heure_rendez_vous : 'Heure à définir'}
                      </Text>
                    </View>
                    <View style={[styles.rendezVousStatus, { backgroundColor: getStatusColor(rdv.statut?.nom || '') }]}>
                      <Text style={styles.rendezVousStatusText}>{getStatusText(rdv.statut?.nom || '')}</Text>
                    </View>
                  </View>
                  <View style={styles.rendezVousDetails}>
                    <Text style={styles.rendezVousRank}>Rang: #{rdv.rang || 'N/A'}</Text>
                    {rdv.motif && (
                      <Text style={styles.rendezVousComment}>{rdv.motif}</Text>
                    )}
                  </View>
                </View>
              ))
          ) : (
            <View style={styles.noDataContainer}>
              <MaterialIcons name="event" size={24} color="#95a5a6" />
              <Text style={styles.noDataText}>Aucun rendez-vous à venir</Text>
            </View>
          )}
        </View>


      </ScrollView>
    </SafeAreaView>
  );
};



export default PatientDashboardScreen; 