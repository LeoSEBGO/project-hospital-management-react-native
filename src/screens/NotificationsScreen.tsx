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

const NotificationsScreen: React.FC = () => {
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

  const renderNotificationItem = ({ item }: { item: RealTimeNotification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.read && styles.unreadCard
      ]}
      onPress={() => markAsRead(item)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          <MaterialIcons
            name={getNotificationIcon(item.type)}
            size={24}
            color="#333"
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
      
      {item.data && (
        <View style={styles.notificationData}>
          <Text style={styles.dataText}>
            {JSON.stringify(item.data, null, 2)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
          <TouchableOpacity style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#3498db" />
          </TouchableOpacity>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={markAllAsRead}
            >
              <MaterialIcons name="done-all" size={16} color="#fff" />
              <Text style={styles.markAllText}>Tout marquer</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>
          {unreadCount > 0 
            ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
            : 'Toutes vos notifications'
          }
        </Text>
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
            <MaterialIcons name="notifications" size={48} color="#95a5a6" />
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptyText}>
              Vous n'avez pas encore reçu de notifications.
            </Text>
          </View>
        }
        ListHeaderComponent={
          unreadCount > 0 ? (
            <View style={styles.unreadHeader}>
              <Text style={styles.unreadText}>
                {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};



export default NotificationsScreen; 