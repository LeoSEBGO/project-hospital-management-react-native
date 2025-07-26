import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { apiService, RealTimeNotification } from '../services/api';
import notificationService from '../services/notificationService';
import styles from '../styles/screens/NotificationsScreen.styles';

interface NotificationsScreenProps {
  onBack?: () => void;
  onNavigateToScreen?: (screen: 'dashboard' | 'services' | 'bookAppointment' | 'rendezVous' | 'rendezVousDetail' | 'rendezVousHistorique' | 'queue' | 'notifications', params?: any) => Promise<void>;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack, onNavigateToScreen }) => {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getNotifications();
      
      if (response.success && response.data) {
        setNotifications(response.data);
        console.log(`[NOTIFICATIONS] ${response.data.length} notifications chargées`);
      } else {
        const errorMessage = response.message || 'Impossible de charger les notifications';
        setError(errorMessage);
        notificationService.handleError(errorMessage, 'chargement des notifications');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur de connexion';
      setError(errorMessage);
      notificationService.handleError(error, 'chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notification: RealTimeNotification) => {
    try {
      const response = await apiService.markNotificationAsRead(notification.id);
      
      if (response.success) {
        // Mettre à jour l'état local
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
        console.log(`[NOTIFICATIONS] Notification ${notification.id} marquée comme lue`);
      } else {
        notificationService.handleError(response.message || 'Erreur lors du marquage', 'marquage notification');
      }
    } catch (error: any) {
      console.error('Erreur lors du marquage comme lu:', error);
      notificationService.handleError(error, 'marquage notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiService.markAllNotificationsAsRead();
      
      if (response.success) {
        // Mettre à jour l'état local
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
        notificationService.showSuccessToast('Toutes les notifications ont été marquées comme lues');
        console.log('[NOTIFICATIONS] Toutes les notifications marquées comme lues');
      } else {
        notificationService.handleError(response.message || 'Erreur lors du marquage', 'marquage toutes notifications');
      }
    } catch (error: any) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
      notificationService.handleError(error, 'marquage toutes notifications');
    }
  };


  const handleNotificationPress = async (notification: RealTimeNotification) => {
    try {
      // Marquer comme lu d'abord
      await markAsRead(notification);
      
      console.log('[NOTIFICATIONS] Navigation depuis notification:', notification.type, notification.data);
      
      // Naviguer vers l'écran approprié selon le type de notification
      if (onNavigateToScreen) {
        switch (notification.type) {
          case 'STATUT_CHANGE':
            onNavigateToScreen('dashboard');
            break;
          case 'QUEUE_UPDATE':
            onNavigateToScreen('queue');
            break;
          case 'RENDEZ_VOUS_REMINDER':
            onNavigateToScreen('rendezVous');
            break;
          case 'APPOINTMENT_CREATED':
          case 'RANK_CHANGED':
            // Naviguer vers les détails du rendez-vous si l'ID est disponible
            if (notification.data?.appointmentId) {
              console.log('[NOTIFICATIONS] Navigation vers rendez-vous détail:', notification.data.appointmentId);
              await onNavigateToScreen('rendezVousDetail', { 
                appointmentId: notification.data.appointmentId,
                serviceId: notification.data.serviceId 
              });
            } else {
              console.log('[NOTIFICATIONS] Pas d\'ID de rendez-vous, navigation vers liste');
              onNavigateToScreen('rendezVous');
            }
            break;
          case 'ACCOUNT_CREATED':
            onNavigateToScreen('dashboard');
            break;
          case 'GENERAL':
            // Pour les notifications générales, on reste sur l'écran des notifications
            break;
          default:
            console.log('[NOTIFICATIONS] Type de notification non géré:', notification.type);
            notificationService.showWarningToast(`Type de notification non géré: ${notification.type}`);
            break;
        }
      }
    } catch (error) {
      console.error('[NOTIFICATIONS] Erreur lors de la navigation:', error);
      notificationService.handleError(error, 'navigation depuis notification');
    }
  };

  const formatNotificationData = (data: any, type: string) => {
    if (!data) return null;

    switch (type) {
      case 'STATUT_CHANGE':
        return {
          title: 'Changement de statut',
          details: [
            { label: 'Ancien statut', value: data.oldStatus || 'Non spécifié' },
            { label: 'Nouveau statut', value: data.newStatus || 'Non spécifié' }
          ]
        };
      
      case 'QUEUE_UPDATE':
        return {
          title: 'Mise à jour de la file d\'attente',
          details: [
            { label: 'Position', value: `#${data.position || 'N/A'}` },
            { label: 'Temps d\'attente estimé', value: `${data.estimatedWait || 0} min` }
          ]
        };
      
      case 'RENDEZ_VOUS_REMINDER':
        return {
          title: 'Rappel de rendez-vous',
          details: [
            { label: 'Service', value: data.serviceName || 'Non spécifié' },
            { label: 'Heure', value: data.time || 'Non spécifié' }
          ]
        };

      case 'APPOINTMENT_CREATED':
        return {
          title: 'Rendez-vous créé',
          details: [
            { label: 'Service', value: data.serviceName || 'Non spécifié' },
            { label: 'Date', value: data.date ? new Date(data.date).toLocaleDateString('fr-FR') : 'Non spécifié' },
            { label: 'Heure', value: data.time || 'Non spécifié' },
            { label: 'Position', value: `#${data.rank || 'N/A'}` }
          ]
        };

      case 'RANK_CHANGED':
        return {
          title: 'Changement de position',
          details: [
            { label: 'Service', value: data.serviceName || 'Non spécifié' },
            { label: 'Ancienne position', value: `#${data.oldRank || 'N/A'}` },
            { label: 'Nouvelle position', value: `#${data.newRank || 'N/A'}` },
            { label: 'Temps d\'attente estimé', value: `${data.estimatedWaitTime || 0} min` }
          ]
        };

      case 'ACCOUNT_CREATED':
        return {
          title: 'Compte créé',
          details: [
            { label: 'Nom', value: data.patientName || 'Non spécifié' },
            { label: 'Email', value: data.email || 'Non spécifié' },
            { label: 'Service', value: data.serviceId ? `Service #${data.serviceId}` : 'Non spécifié' }
          ]
        };
      
      case 'GENERAL':
        return {
          title: 'Information générale',
          details: Object.entries(data).map(([key, value]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: String(value)
          }))
        };
      
      default:
        return {
          title: 'Détails',
          details: Object.entries(data).map(([key, value]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: String(value)
          }))
        };
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'STATUT_CHANGE':
        return 'assignment';
      case 'QUEUE_UPDATE':
        return 'event';
      case 'RENDEZ_VOUS_REMINDER':
        return 'local-hospital';
      case 'APPOINTMENT_CREATED':
        return 'event-available';
      case 'RANK_CHANGED':
        return 'trending-up';
      case 'ACCOUNT_CREATED':
        return 'person-add';
      case 'GENERAL':
        return 'notifications';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'STATUT_CHANGE':
        return '#3498db';
      case 'QUEUE_UPDATE':
        return '#f39c12';
      case 'RENDEZ_VOUS_REMINDER':
        return '#e74c3c';
      case 'APPOINTMENT_CREATED':
        return '#27ae60';
      case 'RANK_CHANGED':
        return '#9b59b6';
      case 'ACCOUNT_CREATED':
        return '#1abc9c';
      case 'GENERAL':
        return '#95a5a6';
      default:
        return '#95a5a6';
    }
  };

  const getNotificationActionText = (type: string) => {
    switch (type) {
      case 'STATUT_CHANGE':
        return 'Voir le statut';
      case 'QUEUE_UPDATE':
        return 'Voir la file d\'attente';
      case 'RENDEZ_VOUS_REMINDER':
        return 'Voir les rendez-vous';
      case 'APPOINTMENT_CREATED':
        return 'Voir le rendez-vous';
      case 'RANK_CHANGED':
        return 'Voir le rendez-vous';
      case 'ACCOUNT_CREATED':
        return 'Voir le tableau de bord';
      case 'GENERAL':
        return 'Voir les détails';
      default:
        return 'Voir plus';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'À l\'instant';
    } else if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Il y a ${hours}h`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const renderNotificationItem = ({ item }: { item: RealTimeNotification }) => {
    const formattedData = formatNotificationData(item.data, item.type);
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.read && styles.unreadCard
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <MaterialIcons
              name={getNotificationIcon(item.type)}
              size={24}
              color={getNotificationColor(item.type)}
            />
          </View>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          {!item.read && (
            <View style={[styles.unreadDot, { backgroundColor: getNotificationColor(item.type) }]} />
          )}
        </View>
        
        <Text style={styles.notificationMessage}>{item.message}</Text>
        
        {formattedData && (
          <View style={styles.notificationData}>
            <Text style={styles.dataTitle}>{formattedData.title}</Text>
            {formattedData.details.map((detail, index) => (
              <View key={index} style={styles.dataRow}>
                <Text style={styles.dataLabel}>{detail.label}:</Text>
                <Text style={styles.dataValue}>{detail.value}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.notificationAction}>
          <Text style={styles.actionText}>{getNotificationActionText(item.type)}</Text>
          <MaterialIcons 
            name="arrow-forward-ios" 
            size={16} 
            color={getNotificationColor(item.type)} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Chargement des notifications...</Text>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>
          {unreadCount > 0 ? `${unreadCount} nouvelle(s) notification(s)` : 'Aucune nouvelle notification'}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={20} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNotifications}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionsContainer}>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <MaterialIcons name="done-all" size={16} color="#3498db" />
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-none" size={64} color="#bdc3c7" />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>
              {error ? 'Erreur lors du chargement des notifications' : 'Vous n\'avez pas encore reçu de notifications'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen; 