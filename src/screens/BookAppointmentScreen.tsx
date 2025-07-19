import React, { useState } from 'react';
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
} from 'react-native';
import { apiService, Service, CreateRendezVousRequest } from '../services/api';
import styles from '../styles/screens/BookAppointmentScreen.styles';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface BookAppointmentScreenProps {
  onBack?: () => void;
}

const BookAppointmentScreen: React.FC<BookAppointmentScreenProps> = ({ onBack }) => {
  // Service par défaut pour la démonstration
  const service: Service = {
    id: 1,
    nom: 'Consultation Générale',
    description: 'Consultation médicale générale avec un médecin',
    actif: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBookAppointment = async () => {
    if (!date || !time) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date et une heure');
      return;
    }

    // Vérifier que la date n'est pas dans le passé
    const selectedDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    if (selectedDateTime <= now) {
      Alert.alert('Erreur', 'La date et l\'heure du rendez-vous ne peuvent pas être dans le passé');
      return;
    }

    try {
      setLoading(true);
      
      const rendezVousData: CreateRendezVousRequest = {
        service_id: service.id,
        date_rendez_vous: date,
        heure_rendez_vous: time,
        commentaire: commentaire.trim() || undefined,
      };

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
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

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
        {/* Informations du service */}
        <View style={styles.serviceCard}>
          <Text style={styles.serviceName}>{service.nom}</Text>
          <Text style={styles.serviceDescription}>{service.description}</Text>
        </View>

        {/* Formulaire de rendez-vous */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Détails du Rendez-vous</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="JJ/MM/AAAA"
              keyboardType="default"
            />
            <Text style={styles.helpText}>
              Format: JJ/MM/AAAA (ex: 25/12/2024)
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Heure *</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              keyboardType="default"
            />
            <Text style={styles.helpText}>
              Format: HH:MM (ex: 14:30)
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
            style={[styles.bookButton, loading && styles.bookButtonDisabled]}
            onPress={handleBookAppointment}
            disabled={loading}
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
    </SafeAreaView>
  );
};



export default BookAppointmentScreen; 