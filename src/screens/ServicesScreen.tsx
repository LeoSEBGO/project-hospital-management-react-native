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
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService, Service } from '../services/api';
import styles from '../styles/screens/ServicesScreen.styles';
import BookAppointmentScreen from './BookAppointmentScreen';

interface ServicesScreenProps {
  onBack?: () => void;
  onAppointmentBooked?: () => void;
}

interface AppointmentData {
  serviceId: number;
  serviceName: string;
  count: number;
  date: string;
}

interface ListItem {
  type: 'filters' | 'servicesList';
  data?: any;
}

const ServicesScreen: React.FC<ServicesScreenProps> = ({ onBack, onAppointmentBooked }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookAppointment, setShowBookAppointment] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [appointmentsData, setAppointmentsData] = useState<AppointmentData[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Créer la liste des éléments pour le FlatList principal
  const listItems: ListItem[] = [
    { type: 'filters' },
    { type: 'servicesList' }
  ];

  useEffect(() => {
    loadServicesAndAppointments();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadAppointmentsForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadServicesAndAppointments = async () => {
    setLoading(true);
    try {
      const response = await apiService.getServices();
      if (response.success && response.data) {
        setServices(response.data);
        await loadAppointmentsForDate(selectedDate);
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de charger les services');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointmentsForDate = async (date: string) => {
    setLoadingAppointments(true);
    const data: AppointmentData[] = [];
    
    for (const service of services) {
      try {
        const rdvRes = await apiService.getRendezVousByService(service.id);
        if (rdvRes.success && rdvRes.data) {
          const count = rdvRes.data.filter((rdv: any) => 
            rdv.date_rendez_vous && rdv.date_rendez_vous.startsWith(date)
          ).length;
          data.push({
            serviceId: service.id,
            serviceName: service.nom,
            count,
            date: date
          });
        } else {
          data.push({
            serviceId: service.id,
            serviceName: service.nom,
            count: 0,
            date: date
          });
        }
      } catch (error) {
        console.error(`Erreur lors du chargement des RDV pour ${service.nom}:`, error);
        data.push({
          serviceId: service.id,
          serviceName: service.nom,
          count: 0,
          date: date
        });
      }
    }
    setAppointmentsData(data);
    setLoadingAppointments(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServicesAndAppointments();
    setRefreshing(false);
  };

  const handleBookAppointment = (service: Service) => {
    setSelectedService(service);
    setShowBookAppointment(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain';
    } else {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dateString = selectedDate.toISOString().slice(0, 10);
      setSelectedDate(dateString);
    }
  };



  const renderDatePicker = () => (
    <View style={styles.dateFilterContainer}>
      <Text style={styles.dateFilterLabel}>
        Date
      </Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.datePickerButton}
      >
        <View style={styles.datePickerContent}>
          <MaterialIcons name="event" size={20} color="#3498db" />
          <Text style={styles.datePickerText}>
            {formatDateForDisplay(selectedDate)}
          </Text>
        </View>
        <MaterialIcons name="keyboard-arrow-down" size={24} color="#6c757d" />
      </TouchableOpacity>
    </View>
  );

  const renderServiceCard = ({ item }: { item: Service }) => {
    const appointmentCount = appointmentsData.find(data => 
      data.serviceId === item.id && data.date === selectedDate
    )?.count || 0;

    return (
      <View style={styles.serviceCard}>
        <View style={styles.serviceCardHeader}>
          <Text style={styles.serviceCardName}>
            {item.nom}
          </Text>
          <View style={[
            styles.serviceCardStatus,
            item.actif ? styles.serviceCardStatusActive : styles.serviceCardStatusInactive
          ]}>
            <Text style={[
              styles.serviceCardStatusText,
              item.actif ? styles.serviceCardStatusTextActive : styles.serviceCardStatusTextInactive
            ]}>
              {item.actif ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.serviceCardDescription}>
          {item.description}
        </Text>
        
        <View style={styles.serviceCardFooter}>
          <View style={styles.serviceCardStats}>
            <MaterialIcons name="event" size={16} color="#3498db" />
            <Text style={styles.serviceCardStatsText}>
              {appointmentCount} RDV
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderListItem = ({ item }: { item: ListItem }) => {
    switch (item.type) {
      case 'filters':
        return (
          <View style={styles.filtersSection}>
            <Text style={styles.filtersTitle}>
              Filtres
            </Text>
            
            {/* Filtre par date - DatePicker */}
            {renderDatePicker()}
          </View>
        );

      case 'servicesList':
        return (
          <View style={styles.servicesListSection}>
            <Text style={styles.servicesListTitle}>
              Tous les services - {formatDate(selectedDate)}
            </Text>
            {loadingAppointments ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3498db" />
                <Text style={styles.loadingText}>Chargement des rendez-vous...</Text>
              </View>
            ) : (
              services.map((service) => (
                <View key={service.id}>
                  {renderServiceCard({ item: service })}
                </View>
              ))
            )}
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>
            Chargement des services...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {onBack && (
            <TouchableOpacity 
              onPress={onBack}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color="#3498db" />
            </TouchableOpacity>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Services
            </Text>
            <Text style={styles.headerSubtitle}>
              Statistiques et prise de rendez-vous
            </Text>
          </View>

        </View>
      </View>

      <FlatList
        data={listItems}
        renderItem={renderListItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        nestedScrollEnabled={true}
      />

      {/* DatePicker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(selectedDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
          maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 an
        />
      )}

      {showBookAppointment && selectedService && (
        <BookAppointmentScreen
          service={selectedService}
          onClose={() => {
            setShowBookAppointment(false);
            if (onAppointmentBooked) {
              onAppointmentBooked();
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default ServicesScreen; 