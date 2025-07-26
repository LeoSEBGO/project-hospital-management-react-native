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
import notificationService from '../services/notificationService';

interface BookAppointmentScreenProps {
  onBack?: () => void;
  service?: Service;
  onClose?: () => void;
  onAppointmentCreated?: () => void;
}

interface HoraireDisponible {
  heure: string;
  disponible: boolean;
  periode: 'matin' | 'apres-midi';
}

const BookAppointmentScreen: React.FC<BookAppointmentScreenProps> = ({ onBack, service, onClose, onAppointmentCreated }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(service || null);
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

  // Synchroniser selectedService si la prop service change
  useEffect(() => {
    if (service) {
      setSelectedService(service);
    }
  }, [service]);

  // Charger les dates occupées quand le service change
  useEffect(() => {
    if (selectedService) {
      loadDatesOccupees();
    } else {
      setDatesOccupees([]);
    }
  }, [selectedService]);

  // Rafraîchissement lors du changement de date seulement
  useEffect(() => {
    if (selectedService && selectedDate) {
      loadHorairesDisponibles();
    } else {
      setHorairesDisponibles([]);
    }
  }, [selectedDate]); // Retirer selectedService de la dépendance

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      const response = await apiService.getServices();
      
      if (response.success && response.data) {
        // Filtrer seulement les services actifs
        const activeServices = response.data.filter(service => service.actif);
        setServices(activeServices);
        
      } else {
      }
    } catch (error: any) {
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
      const response = await apiService.getDatesOccupees(selectedService.id);
      
      if (response.success && response.data) {
        const dates = response.data.dates;
        if (dates.length > 0) {
        }
        setDatesOccupees(dates);
      } else {
        setDatesOccupees([]);
      }
    } catch (error: any) {
      setDatesOccupees([]);
    } finally {
      setLoadingDatesOccupees(false);
    }
  };

  const loadHorairesDisponibles = async () => {
    if (!selectedService) {
      console.log('[BOOK_APPOINTMENT] Pas de service sélectionné, horaires non chargés');
      setHorairesDisponibles([]);
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
        
        // Feedback utilisateur si aucun créneau disponible
        if (disponibles.length === 0) {
          notificationService.showWarningToast(`Aucun créneau disponible pour ${selectedService.nom} le ${formatDate(selectedDate)}`);
        }
      } else {
        console.error('[BOOK_APPOINTMENT] Erreur lors du chargement des horaires:', response.message);
        setHorairesDisponibles([]);
        notificationService.handleError(response.message || 'Erreur lors du chargement des horaires', 'chargement horaires');
      }
    } catch (error: any) {
      console.error('[BOOK_APPOINTMENT] Erreur lors du chargement des horaires:', error);
      setHorairesDisponibles([]);
      notificationService.handleError(error, 'chargement horaires');
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
          'Vous avez déjà pris un rendez-vous pour cette date',
          'Veuillez sélectionner une autre date.',
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

  const selectService = async (service: Service) => {
    console.log(`[BOOK_APPOINTMENT] Service sélectionné: ${service.nom} (ID: ${service.id})`);
    
    // Mettre à jour le service sélectionné
    setSelectedService(service);
    setShowServicePicker(false);
    
    // Réinitialiser l'heure sélectionnée
    setSelectedTime(new Date(selectedDate));
    
    // Vider les horaires actuels pendant le chargement
    setHorairesDisponibles([]);
    
    // Recharger immédiatement les horaires pour le nouveau service
    try {
      console.log(`[BOOK_APPOINTMENT] Rechargement des horaires pour le nouveau service: ${service.nom}`);
      await loadHorairesDisponibles();
      console.log(`[BOOK_APPOINTMENT] Horaires rechargés avec succès pour ${service.nom}`);
    } catch (error) {
      console.error(`[BOOK_APPOINTMENT] Erreur lors du rechargement des horaires:`, error);
      notificationService.handleError(error, 'rechargement horaires service');
    }
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
      notificationService.showWarningToast('Veuillez sélectionner un service');
      return;
    }

    if (!selectedDate) {
      notificationService.showWarningToast('Veuillez sélectionner une date');
      return;
    }

    if (!selectedTime) {
      notificationService.showWarningToast('Veuillez sélectionner une heure');
      return;
    }

    // Vérifier qu'il y a des créneaux disponibles
    const creneauxDisponibles = horairesDisponibles.filter(h => h.disponible);
    if (creneauxDisponibles.length === 0) {
      notificationService.showWarningToast(`Aucun créneau disponible pour ${selectedService.nom} le ${formatDate(selectedDate)}`);
      return;
    }

    // Vérifier que l'heure sélectionnée est disponible
    const heureSelectionnee = formatTimeForAPI(selectedTime);
    const creneauSelectionne = creneauxDisponibles.find(h => h.heure === heureSelectionnee);
    if (!creneauSelectionne) {
      notificationService.showWarningToast('Le créneau sélectionné n\'est plus disponible. Veuillez choisir un autre créneau.');
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
        notificationService.handleSuccess(
          'Votre rendez-vous a été créé avec succès !',
          false // Afficher une alerte au lieu d'un toast
        );
        
        // Exécuter le callback après un délai pour laisser le temps à l'utilisateur de voir le message
        setTimeout(() => {
          // Déclencher le callback pour recharger les données
          if (onAppointmentCreated) {
            onAppointmentCreated();
          }
          // Fermer l'écran
          if (onClose) {
            onClose();
          } else if (onBack) {
            onBack();
          }
        }, 1500);
      } else {
        notificationService.handleError(response.message || 'Impossible de créer le rendez-vous', 'création rendez-vous');
      }
    } catch (error: any) {
      console.error('[BOOK_APPOINTMENT] Erreur lors de la création:', error);
      notificationService.handleError(error, 'création rendez-vous');
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
          item.disponible ? styles.timeItemAvailable : styles.timeItemDisabled,
          isSelected && styles.timeItemSelected
        ]}
        onPress={() => item.disponible ? selectTime(item.heure) : null}
        disabled={!item.disponible}
        accessibilityLabel={`${item.disponible ? 'Sélectionner' : 'Indisponible'} ${item.heure}`}
        accessibilityHint={item.disponible ? "Appuyez pour sélectionner cette heure" : "Cette heure n'est pas disponible"}
      >
        <View style={styles.timeItemContent}>
          <Text style={[
            styles.timeItemText,
            item.disponible ? styles.timeItemTextAvailable : styles.timeItemTextDisabled,
            isSelected && styles.timeItemTextSelected
          ]}>
            {item.heure}
          </Text>
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <MaterialIcons name="check-circle" size={16} color="#27ae60" />
            </View>
          )}
          {!item.disponible && (
            <View style={styles.occupiedIndicator}>
              <MaterialIcons name="block" size={12} color="#e74c3c" />
              <Text style={styles.occupiedText}>Occupé</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTimeSection = (periode: 'matin' | 'apres-midi') => {
    // Afficher tous les créneaux pour cette période (disponibles et occupés)
    const horairesPeriode = horairesDisponibles.filter(h => h.periode === periode);
    const horairesDisponiblesPeriode = horairesPeriode.filter(h => h.disponible);
    const horairesOccupesPeriode = horairesPeriode.filter(h => !h.disponible);
    const titre = periode === 'matin' ? 'Matin (8h-12h)' : 'Après-midi (15h-00h)';
    
    return (
      <View style={styles.timeSection}>
        <Text style={styles.timeSectionTitle}>{titre}</Text>
        {loadingHoraires ? (
          <View style={styles.loadingHorairesContainer}>
            <ActivityIndicator size="small" color="#3498db" />
            <Text style={styles.loadingHorairesText}>Chargement des horaires...</Text>
          </View>
        ) : horairesPeriode.length > 0 ? (
          <View>
            {/* Indicateur des heures disponibles */}
            {horairesDisponiblesPeriode.length > 0 && (
              <View style={styles.availableHoursIndicator}>
                <MaterialIcons name="check-circle" size={16} color="#27ae60" />
                <Text style={styles.availableHoursText}>
                  {horairesDisponiblesPeriode.length} créneau{horairesDisponiblesPeriode.length > 1 ? 'x' : ''} disponible{horairesDisponiblesPeriode.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            
            {/* Indicateur des heures occupées */}
            {horairesOccupesPeriode.length > 0 && (
              <View style={styles.occupiedHoursIndicator}>
                <MaterialIcons name="block" size={16} color="#e74c3c" />
                <Text style={styles.occupiedHoursText}>
                  {horairesOccupesPeriode.length} créneau{horairesOccupesPeriode.length > 1 ? 'x' : ''} occupé{horairesOccupesPeriode.length > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            
            {/* Grille des heures - afficher tous les créneaux */}
            <View style={styles.timeGrid}>
              {horairesPeriode.map((horaire) => (
                <View key={`${periode}-${horaire.heure}`} style={styles.timeItemContainer}>
                  {renderTimeItem({ item: horaire })}
                </View>
              ))}
            </View>
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
            {!service && (
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
            )}
            {service && (
              <View style={styles.selectedServiceDisplay}>
                <MaterialIcons name="local-hospital" size={20} color="#3498db" />
                <Text style={styles.selectedServiceName}>{service.nom}</Text>
              </View>
            )}
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
                  ? `Chargement...` 
                  : !selectedService 
                    ? 'Sélectionnez d\'abord un service'
                    : horairesDisponibles.length === 0
                      ? 'Aucun créneau disponible'
                      : formatTime(selectedTime)
                }
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#7f8c8d" />
            </TouchableOpacity>
            <Text style={styles.helpText}>
              {loadingHoraires 
                ? `Chargement des horaires pour ${selectedService?.nom}...` 
                : !selectedService 
                  ? 'Sélectionnez d\'abord un service'
                  : horairesDisponibles.length === 0
                    ? `Aucun créneau disponible pour ${selectedService.nom} le ${formatDate(selectedDate)}`
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
                <ActivityIndicator size="small" color="#27ae60" style={styles.loadingHorairesIndicator} />
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
            
            {/* Légende des statuts */}
            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>Légende :</Text>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, styles.legendAvailable]} />
                <Text style={styles.legendText}>Disponible</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, styles.legendOccupied]} />
                <Text style={styles.legendText}>Occupé</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIndicator, styles.legendSelected]} />
                <Text style={styles.legendText}>Sélectionné</Text>
              </View>
            </View>
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