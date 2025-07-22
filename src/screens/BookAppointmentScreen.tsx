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
  const [datesOccupees, setDatesOccupees] = useState<string[]>([]);
  const [loadingDatesOccupees, setLoadingDatesOccupees] = useState(false);
  const [refreshingData, setRefreshingData] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);

  // Charger les services au montage du composant
  useEffect(() => {
    loadServices();
  }, []);

  // Rafraîchissement lors du changement de service ou de date
  useEffect(() => {
    if (selectedService && selectedDate) {
      setSelectedTime(new Date(selectedDate)); // Réinitialisation
      loadHorairesDisponibles(); // Rechargement automatique
    } else {
      setHorairesDisponibles([]); // Nettoyage
    }
  }, [selectedService, selectedDate]);

  // Charger les dates occupées quand le service change
  useEffect(() => {
    if (selectedService) {
      loadDatesOccupees();
    } else {
      setDatesOccupees([]);
    }
  }, [selectedService]);

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

  const loadDatesOccupees = async () => {
    if (!selectedService) {
      console.log('[BOOK_APPOINTMENT] Pas de service sélectionné, dates occupées non chargées');
      return;
    }

    try {
      setLoadingDatesOccupees(true);
      console.log(`[BOOK_APPOINTMENT] Chargement des dates occupées pour le service ${selectedService.nom} (ID: ${selectedService.id})`);
      
      const response = await apiService.getDatesOccupees(selectedService.id);
      
      if (response.success && response.data) {
        const dates = response.data.dates;
        console.log(`[BOOK_APPOINTMENT] Dates occupées chargées: ${dates.length} dates`);
        if (dates.length > 0) {
          console.log(`[BOOK_APPOINTMENT] Exemples de dates occupées: ${dates.slice(0, 5).join(', ')}`);
        }
        setDatesOccupees(dates);
      } else {
        console.error('[BOOK_APPOINTMENT] Erreur lors du chargement des dates occupées:', response.message);
        setDatesOccupees([]);
      }
    } catch (error: any) {
      console.error('[BOOK_APPOINTMENT] Erreur lors du chargement des dates occupées:', error);
      setDatesOccupees([]);
    } finally {
      setLoadingDatesOccupees(false);
    }
  };

  const loadHorairesDisponibles = async () => {
    if (!selectedService) {
      console.log('[BOOK_APPOINTMENT] Pas de service sélectionné, horaires non chargés');
      return;
    }

    try {
      setLoadingHoraires(true);
      console.log(`[BOOK_APPOINTMENT] Chargement des horaires pour le service ${selectedService.nom} (ID: ${selectedService.id})`);
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      console.log(`[BOOK_APPOINTMENT] Date sélectionnée: ${dateStr}`);
      
      const response = await apiService.getHorairesDisponibles(selectedService.id, dateStr);
      
      if (response.success && response.data) {
        const horaires = response.data.horaires;
        const disponibles = horaires.filter((h: HoraireDisponible) => h.disponible);
        const grisees = horaires.filter((h: HoraireDisponible) => !h.disponible);
        
        console.log(`[BOOK_APPOINTMENT] Horaires chargés: ${horaires.length} créneaux`);
        console.log(`[BOOK_APPOINTMENT] Disponibles: ${disponibles.length}, Grisées: ${grisees.length}`);
        
        if (disponibles.length > 0) {
          console.log(`[BOOK_APPOINTMENT] Exemples disponibles: ${disponibles.slice(0, 3).map((h: HoraireDisponible) => h.heure).join(', ')}`);
        }
        
        if (grisees.length > 0) {
          console.log(`[BOOK_APPOINTMENT] Exemples grisés: ${grisees.slice(0, 3).map((h: HoraireDisponible) => h.heure).join(', ')}`);
        }
        
        setHorairesDisponibles(horaires);
      } else {
        console.error('[BOOK_APPOINTMENT] Erreur lors du chargement des horaires:', response.message);
        setHorairesDisponibles([]);
      }
    } catch (error: any) {
      console.error('[BOOK_APPOINTMENT] Erreur lors du chargement des horaires:', error);
      setHorairesDisponibles([]);
    } finally {
      setLoadingHoraires(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      console.log(`[BOOK_APPOINTMENT] Date sélectionnée: ${dateStr}`);
      
      // Vérifier si la date est occupée
      if (isDateOccupee(date)) {
        console.log(`[BOOK_APPOINTMENT] Date occupée détectée: ${dateStr}`);
        Alert.alert(
          'Date occupée',
          'Cette date a déjà des rendez-vous. Veuillez sélectionner une autre date.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setSelectedDate(date);
      // L'useEffect se chargera de recharger les horaires et réinitialiser l'heure
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
    console.log(`[BOOK_APPOINTMENT] Service sélectionné: ${service.nom} (ID: ${service.id})`);
    setSelectedService(service);
    setShowServicePicker(false);
    // L'useEffect se chargera de recharger les horaires et réinitialiser l'heure
  };

  const selectTime = async (heure: string) => {
    const [hours, minutes] = heure.split(':').map(Number);
    const newTime = new Date(selectedDate);
    newTime.setHours(hours, minutes, 0, 0);
    setSelectedTime(newTime);
    setShowTimeModal(false);
    console.log(`[BOOK_APPOINTMENT] Heure sélectionnée: ${heure}`);
    
    // Rafraîchir les données après la sélection
    try {
      setRefreshingData(true);
      console.log(`[BOOK_APPOINTMENT] Rafraîchissement des données après sélection de ${heure}`);
      
      // Rafraîchir les horaires
      await loadHorairesDisponibles();
      console.log(`[BOOK_APPOINTMENT] Horaires rafraîchis avec succès`);
      
      // Rafraîchir les dates occupées
      await loadDatesOccupees();
      console.log(`[BOOK_APPOINTMENT] Dates occupées rafraîchies avec succès`);
      
    } catch (error) {
      console.error(`[BOOK_APPOINTMENT] Erreur lors du rafraîchissement des données:`, error);
    } finally {
      setRefreshingData(false);
    }
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

  const isDateOccupee = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return datesOccupees.includes(dateStr);
  };

  const isTimeSelected = (): boolean => {
    if (!selectedService) return false;
    const heureSelectionnee = formatTimeForAPI(selectedTime);
    const heureParDefaut = formatTimeForAPI(new Date(selectedDate));
    return heureSelectionnee !== heureParDefaut;
  };



  const handleBookAppointment = async () => {
    if (!selectedService) {
      Alert.alert('Erreur', 'Veuillez sélectionner un service');
      return;
    }

    // Vérifier qu'une heure est sélectionnée
    const heureSelectionnee = formatTimeForAPI(selectedTime);
    const heureParDefaut = formatTimeForAPI(new Date(selectedDate));
    
    if (heureSelectionnee === heureParDefaut) {
      Alert.alert('Erreur', 'Veuillez sélectionner une heure de rendez-vous');
      return;
    }

    // Vérifier que l'heure sélectionnée est disponible
    const heureDisponible = horairesDisponibles.find(h => h.heure === heureSelectionnee);
    if (!heureDisponible || !heureDisponible.disponible) {
      Alert.alert('Erreur', 'Cette heure n\'est plus disponible. Veuillez sélectionner une autre heure.');
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

  const renderTimeItem = ({ item }: { item: HoraireDisponible }) => {
    const isSelected = selectedTime && formatTimeForAPI(selectedTime) === item.heure;
    
    return (
      <TouchableOpacity
        style={[
          styles.timeItem,
          isSelected && styles.timeItemSelected
        ]}
        onPress={() => selectTime(item.heure)}
        accessibilityLabel={`Sélectionner ${item.heure}`}
        accessibilityHint="Appuyez pour sélectionner cette heure"
      >
        <View style={styles.timeItemContent}>
          <Text style={[
            styles.timeItemText,
            isSelected && styles.timeItemTextSelected
          ]}>
            {item.heure}
          </Text>
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <MaterialIcons name="check-circle" size={16} color="#27ae60" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTimeSection = (periode: 'matin' | 'apres-midi') => {
    // Filtrer seulement les heures disponibles pour cette période
    const horairesDisponiblesPeriode = horairesDisponibles.filter(h => h.periode === periode && h.disponible);
    const titre = periode === 'matin' ? 'Matin (8h-12h)' : 'Après-midi (15h-00h)';
    
    return (
      <View style={styles.timeSection}>
        <Text style={styles.timeSectionTitle}>{titre}</Text>
        {loadingHoraires ? (
          <View style={styles.loadingHorairesContainer}>
            <ActivityIndicator size="small" color="#3498db" />
            <Text style={styles.loadingHorairesText}>Chargement des horaires...</Text>
          </View>
        ) : horairesDisponiblesPeriode.length > 0 ? (
          <View style={styles.timeGrid}>
            {horairesDisponiblesPeriode.map((horaire, index) => (
              <View key={index} style={styles.timeItemContainer}>
                {renderTimeItem({ item: horaire })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noHorairesContainer}>
            <MaterialIcons name="schedule" size={24} color="#95a5a6" />
            <Text style={styles.noHorairesText}>
              Aucun créneau disponible pour cette période
            </Text>
          </View>
        )}
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
              style={[
                styles.dateTimeButton,
                !selectedService && styles.inputError
              ]}
              onPress={showServicePickerModal}
            >
              <MaterialIcons name="local-hospital" size={20} color={!selectedService ? "#e74c3c" : "#3498db"} />
              <Text style={[
                styles.dateTimeButtonText,
                !selectedService && styles.inputErrorText
              ]}>
                {selectedService ? selectedService.nom : 'Sélectionner un service'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#7f8c8d" />
            </TouchableOpacity>
            {selectedService ? (
              <Text style={styles.helpText}>
                {selectedService.description}
              </Text>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={[
                styles.dateTimeButton,
                loadingDatesOccupees && styles.dateTimeButtonDisabled
              ]}
              onPress={showDatePickerModal}
              disabled={loadingDatesOccupees || !selectedService}
            >
              <MaterialIcons name="event" size={20} color="#3498db" />
              <Text style={[
                styles.dateTimeButtonText,
                loadingDatesOccupees && styles.dateTimeButtonTextDisabled
              ]}>
                {loadingDatesOccupees ? 'Chargement...' : formatDate(selectedDate)}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#7f8c8d" />
            </TouchableOpacity>
            <Text style={styles.helpText}>
              {loadingDatesOccupees 
                ? 'Vérification des dates disponibles...' 
                : selectedService 
                  ? 'Sélectionnez la date de votre rendez-vous' 
                  : 'Sélectionnez d\'abord un service'
              }
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Heure *</Text>
            <TouchableOpacity
              style={[
                styles.dateTimeButton,
                loadingHoraires && styles.dateTimeButtonDisabled,
                !selectedService && styles.dateTimeButtonDisabled
              ]}
              onPress={openTimeModal}
              disabled={loadingHoraires || !selectedService}
            >
              <MaterialIcons name="access-time" size={20} color="#3498db" />
              <Text style={[
                styles.dateTimeButtonText,
                loadingHoraires && styles.dateTimeButtonTextDisabled,
                !selectedService && styles.dateTimeButtonTextDisabled
              ]}>
                {loadingHoraires 
                  ? 'Chargement...' 
                  : !selectedService 
                    ? 'Sélectionnez d\'abord un service'
                    : formatTime(selectedTime)
                }
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#7f8c8d" />
            </TouchableOpacity>
            <Text style={styles.helpText}>
              {loadingHoraires 
                ? 'Chargement des horaires disponibles...' 
                : !selectedService 
                  ? 'Sélectionnez d\'abord un service'
                  : 'Sélectionnez l\'heure de votre rendez-vous'
              }
            </Text>
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
            style={[styles.bookButton, (loading || !selectedService || !isTimeSelected()) && styles.bookButtonDisabled]}
            onPress={handleBookAppointment}
            disabled={loading || !selectedService || !isTimeSelected()}
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
            
            {/* Indicateur du nombre d'heures disponibles */}
            <View style={styles.availableHoursIndicator}>
              <MaterialIcons name="schedule" size={16} color="#27ae60" />
              <Text style={styles.availableHoursText}>
                {refreshingData ? 'Rafraîchissement...' : `${horairesDisponibles.filter(h => h.disponible).length} créneaux disponibles`}
              </Text>
              {refreshingData && (
                <ActivityIndicator size="small" color="#27ae60" style={{ marginLeft: 8 }} />
              )}
            </View>
            
            {isTimeSelected() && (
              <View style={styles.selectedTimeIndicator}>
                <MaterialIcons name="check-circle" size={16} color="#27ae60" />
                <Text style={styles.selectedTimeText}>
                  Heure sélectionnée: {formatTime(selectedTime)}
                </Text>
              </View>
            )}
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