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
import { apiService, RealTimeNotification } from '../services/api';
import { realtimeService } from '../services/realtime';
import styles from '../styles/screens/NotificationsScreen.styles';

interface NotificationsScreenProps {
  onBack?: () => void;
  onNavigateToScreen?: (screen: 'dashboard' | 'services' | 'bookAppointment' | 'rendezVous' | 'rendezVousDetail' | 'rendezVousHistorique' | 'queue' | 'notifications', params?: any) => void;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack, onNavigateToScreen }) => {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
    setupRealtimeConnection();
    
    return () => {
      // Nettoyer les listeners lors du démontage
      realtimeService.off('notification', handleNewNotification);
    };
  }, []);

  const setupRealtimeConnection = async () => {
    try {
      // Écouter les nouvelles notifications
      realtimeService.on('notification', handleNewNotification);
      
      // Se connecter au WebSocket si pas déjà connecté
      if (!realtimeService.isConnected()) {
        await realtimeService.connect();
      }
    } catch (error) {
      console.error('Erreur de connexion temps réel:', error);
    }
  };

  const handleNewNotification = (notification: RealTimeNotification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications();
      
      if (response.success && response.data) {
        setNotifications(response.data);
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de charger les notifications');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
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
      }
    } catch (error: any) {
      console.error('Erreur lors du marquage comme lu:', error);
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
      }
    } catch (error: any) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
    }
  };

  const handleNotificationPress = async (notification: RealTimeNotification) => {
    // Marquer comme lu d'abord
    await markAsRead(notification);
    
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
        case 'GENERAL':
          // Pour les notifications générales, on reste sur l'écran des notifications
          break;
        default:
          break;
      }
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
            { label: 'Service', value: data.service || 'Non spécifié' },
            { label: 'Heure', value: data.appointmentTime || 'Non spécifié' }
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
      case 'GENERAL':
        return '#27ae60';
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

      {unreadCount > 0 && (
        <View style={styles.markAllContainer}>
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <MaterialIcons name="done-all" size={16} color="#3498db" />
            <Text style={styles.markAllText}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        </View>
      )}

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
              Vous n'avez pas encore reçu de notifications
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen; 