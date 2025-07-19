import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService, Service, CreateRendezVousRequest } from '../services/api';
import styles from '../styles/screens/BookAppointmentScreen.styles';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface BookAppointmentScreenProps {
  onBack?: () => void;
}

interface HoraireDisponible {
  heure: string;
  disponible: boolean;
  periode: 'matin' | 'apres-midi';
}

const BookAppointmentScreen: React.FC<BookAppointmentScreenProps> = ({ onBack }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [horairesDisponibles, setHorairesDisponibles] = useState<HoraireDisponible[]>([]);
  const [loadingHoraires, setLoadingHoraires] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);

  // Charger les services au montage du composant
  useEffect(() => {
    loadServices();
  }, []);

  // Charger les horaires disponibles quand la date ou le service change
  useEffect(() => {
    if (selectedService && selectedDate) {
      loadHorairesDisponibles();
    }
  }, [selectedService, selectedDate]);

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const response = await apiService.getServices();
      
      if (response.success && response.data) {
        // Filtrer seulement les services actifs
        const activeServices = response.data.filter(service => service.actif);
        setServices(activeServices);
        
        // Sélectionner le premier service par défaut
        if (activeServices.length > 0 && !selectedService) {
          setSelectedService(activeServices[0]);
        }
      } else {
        Alert.alert('Erreur', 'Impossible de charger les services');
      }
    } catch (error: any) {
      console.error('[BOOK_APPOINTMENT] Erreur lors du chargement des services:', error);
      Alert.alert('Erreur', 'Erreur lors du chargement des services');
    } finally {
      setLoadingServices(false);
    }
  };

  const loadHorairesDisponibles = async () => {
    if (!selectedService) return;

    try {
      setLoadingHoraires(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await apiService.getHorairesDisponibles(selectedService.id, dateStr);
      
      if (response.success && response.data) {
        setHorairesDisponibles(response.data.horaires);
      } else {
        console.error('[BOOK_APPOINTMENT] Erreur lors du chargement des horaires:', response.message);
      }
    } catch (error: any) {
      console.error('[BOOK_APPOINTMENT] Erreur lors du chargement des horaires:', error);
    } finally {
      setLoadingHoraires(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      // Réinitialiser l'heure sélectionnée
      setSelectedTime(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const showTimePickerModal = () => {
    setShowTimePicker(true);
  };

  const openTimeModal = () => {
    setShowTimeModal(true);
  };

  const showServicePickerModal = () => {
    setShowServicePicker(true);
  };

  const selectService = (service: Service) => {
    setSelectedService(service);
    setShowServicePicker(false);
  };

  const selectTime = (heure: string) => {
    const [hours, minutes] = heure.split(':').map(Number);
    const newTime = new Date(selectedDate);
    newTime.setHours(hours, minutes, 0, 0);
    setSelectedTime(newTime);
    setShowTimeModal(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
  };

  const formatTimeForAPI = (date: Date) => {
    return date.toTimeString().slice(0, 5); // Format HH:MM
  };

  const handleBookAppointment = async () => {
    if (!selectedService) {
      Alert.alert('Erreur', 'Veuillez sélectionner un service');
      return;
    }

    // Vérifier que la date n'est pas dans le passé
    const now = new Date();
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
    
    if (selectedDateTime <= now) {
      Alert.alert('Erreur', 'La date et l\'heure du rendez-vous ne peuvent pas être dans le passé');
      return;
    }

    try {
      setLoading(true);
      
      const rendezVousData: CreateRendezVousRequest = {
        service_id: selectedService.id,
        date_rendez_vous: formatDateForAPI(selectedDate),
        heure_rendez_vous: formatTimeForAPI(selectedTime),
        motif: commentaire.trim() || undefined,
      };

      console.log('[BOOK_APPOINTMENT] Création du rendez-vous:', rendezVousData);

      const response = await apiService.createRendezVous(rendezVousData);
      
      if (response.success) {
        Alert.alert(
          'Succès',
          'Votre rendez-vous a été créé avec succès !',
          [
            {
              text: 'OK',
              onPress: () => onBack && onBack(),
            },
          ]
        );
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de créer le rendez-vous');
      }
    } catch (error: any) {
      console.error('[BOOK_APPOINTMENT] Erreur lors de la création:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de la création du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => selectService(item)}
    >
      <View style={styles.serviceItemContent}>
        <Text style={styles.serviceItemName}>{item.nom}</Text>
        <Text style={styles.serviceItemDescription}>{item.description}</Text>
      </View>
      {selectedService?.id === item.id && (
        <MaterialIcons name="check" size={20} color="#3498db" />
      )}
    </TouchableOpacity>
  );

  const renderTimeItem = ({ item }: { item: HoraireDisponible }) => (
    <TouchableOpacity
      style={[
        styles.timeItem,
        !item.disponible && styles.timeItemDisabled
      ]}
      onPress={() => item.disponible && selectTime(item.heure)}
      disabled={!item.disponible}
    >
      <Text style={[
        styles.timeItemText,
        !item.disponible && styles.timeItemTextDisabled
      ]}>
        {item.heure}
      </Text>
      {!item.disponible && (
        <MaterialIcons name="block" size={16} color="#95a5a6" />
      )}
    </TouchableOpacity>
  );

  const renderTimeSection = (periode: 'matin' | 'apres-midi') => {
    const horairesPeriode = horairesDisponibles.filter(h => h.periode === periode);
    const titre = periode === 'matin' ? 'Matin (8h-12h)' : 'Après-midi (15h-00h)';
    
    return (
      <View style={styles.timeSection}>
        <Text style={styles.timeSectionTitle}>{titre}</Text>
        <View style={styles.timeGrid}>
          {horairesPeriode.map((horaire, index) => (
            <View key={index} style={styles.timeItemContainer}>
              {renderTimeItem({ item: horaire })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loadingServices) {
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
            >
              <MaterialIcons name="arrow-back" size={24} color="#3498db" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerTitle}>Prendre Rendez-vous</Text>
        <Text style={styles.headerSubtitle}>
          Remplissez les informations ci-dessous
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Formulaire de rendez-vous */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Détails du Rendez-vous</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Service *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={showServicePickerModal}
            >
              <MaterialIcons name="local-hospital" size={20} color="#3498db" />
              <Text style={styles.dateTimeButtonText}>
                {selectedService ? selectedService.nom : 'Sélectionner un service'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#7f8c8d" />
            </TouchableOpacity>
            {selectedService && (
              <Text style={styles.helpText}>
                {selectedService.description}
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={showDatePickerModal}
            >
              <MaterialIcons name="event" size={20} color="#3498db" />
              <Text style={styles.dateTimeButtonText}>
                {formatDate(selectedDate)}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#7f8c8d" />
            </TouchableOpacity>
            <Text style={styles.helpText}>
              Sélectionnez la date de votre rendez-vous
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Heure *</Text>
                          <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={openTimeModal}
              >
              <MaterialIcons name="access-time" size={20} color="#3498db" />
              <Text style={styles.dateTimeButtonText}>
                {formatTime(selectedTime)}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#7f8c8d" />
            </TouchableOpacity>
            <Text style={styles.helpText}>
              Sélectionnez l'heure de votre rendez-vous
            </Text>
            {loadingHoraires && (
              <Text style={styles.helpText}>
                Chargement des horaires disponibles...
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Commentaire (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={commentaire}
              onChangeText={setCommentaire}
              placeholder="Ajoutez un commentaire ou une note..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.bookButton, loading && styles.bookButtonDisabled]}
            onPress={handleBookAppointment}
            disabled={loading || !selectedService}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookButtonText}>Confirmer le Rendez-vous</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Informations importantes */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Informations importantes</Text>
          <Text style={styles.infoText}>
            • Veuillez arriver 15 minutes avant l'heure du rendez-vous
          </Text>
          <Text style={styles.infoText}>
            • Apportez votre pièce d'identité et votre carte d'assurance
          </Text>
          <Text style={styles.infoText}>
            • En cas d'annulation, veuillez nous contacter au moins 24h à l'avance
          </Text>
          <Text style={styles.infoText}>
            • Le rendez-vous sera confirmé par SMS ou appel téléphonique
          </Text>
        </View>
      </ScrollView>

      {/* Service Picker Modal */}
      <Modal
        visible={showServicePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowServicePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un Service</Text>
              <TouchableOpacity
                onPress={() => setShowServicePicker(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={services}
              renderItem={renderServiceItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              style={styles.serviceList}
            />
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner une Heure</Text>
              <TouchableOpacity
                onPress={() => setShowTimeModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
              {renderTimeSection('matin')}
              {renderTimeSection('apres-midi')}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
          maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 an max
        />
      )}

      {/* Time Picker Modal (fallback) */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          minuteInterval={15} // Intervalles de 15 minutes
        />
      )}
    </SafeAreaView>
  );
};

export default BookAppointmentScreen; 