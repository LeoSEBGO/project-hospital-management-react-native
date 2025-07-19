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
import { apiService, Service } from '../services/api';
import styles from '../styles/screens/ServicesScreen.styles';

interface ServicesScreenProps {
  onBack?: () => void;
}

const ServicesScreen: React.FC<ServicesScreenProps> = ({ onBack }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'services'>('services');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await apiService.getServices();
      
      if (response.success && response.data) {
        setServices(response.data);
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de charger les services');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  };

  const handleServicePress = (service: Service) => {
    // Afficher les options pour le service
    Alert.alert(
      service.nom,
      `${service.description}`,
      [
        { text: 'Fermer', style: 'cancel' },
        { text: 'Prendre RDV', onPress: () => onBack && onBack() }
      ]
    );
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => handleServicePress(item)}
    >
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{item.nom}</Text>
        <View style={styles.serviceStatus}>
          <MaterialIcons 
            name={item.actif ? "check-circle" : "cancel"} 
            size={20} 
            color={item.actif ? "#27ae60" : "#e74c3c"} 
          />
          <Text style={[styles.serviceStatusText, { color: item.actif ? "#27ae60" : "#e74c3c" }]}>
            {item.actif ? "Disponible" : "Indisponible"}
          </Text>
        </View>
      </View>
      <Text style={styles.serviceDescription} numberOfLines={3}>
        {item.description}
      </Text>
      <View style={styles.serviceFooter}>
        <MaterialIcons name="event" size={16} color="#3498db" />
        <Text style={styles.serviceAction}>Toucher pour prendre rendez-vous</Text>
      </View>
    </TouchableOpacity>
  );



  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Chargement des services...</Text>
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
        <Text style={styles.headerTitle}>Services Disponibles</Text>
        <Text style={styles.headerSubtitle}>
          Sélectionnez un service pour prendre rendez-vous
        </Text>
      </View>

      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun service disponible</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};



export default ServicesScreen; 