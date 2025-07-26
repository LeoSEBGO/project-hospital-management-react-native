import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { colors, spacing } from '../styles/common';
import notificationService from '../services/notificationService';
import { FormField, Header, Button, Card } from '../components';
import styles from '../styles/screens/PatientProfileEditScreen.styles';

interface PatientProfileEditScreenProps {
  onBack: () => void;
  onProfileUpdated?: () => void;
  onNavigateToPasswordChange?: () => void;
}

const PatientProfileEditScreen: React.FC<PatientProfileEditScreenProps> = ({ 
  onBack, 
  onProfileUpdated,
  onNavigateToPasswordChange
}) => {
  const { patient, updatePatientData } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    nom: patient?.nom || '',
    prenom: patient?.prenom || '',
    email: patient?.email || '',
    contact: patient?.contact || '',
    currentPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = async () => {
    if (!formData.currentPassword.trim()) {
      notificationService.showErrorToast('Veuillez saisir votre mot de passe actuel');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.updatePatientProfile({
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim().toLowerCase(),
        contact: formData.contact.trim() || undefined,
        currentPassword: formData.currentPassword.trim()
      });

      if (updatePatientData && response.data) {
        updatePatientData(response.data);
      }
      
      notificationService.handleSuccess(
        'Profil mis à jour avec succès',
        false
      );
      
      setTimeout(() => {
        if (onProfileUpdated) {
          onProfileUpdated();
        }
        onBack();
      }, 1500);
    } catch (error: any) {
      notificationService.handleError(error, 'mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    if (onNavigateToPasswordChange) {
      onNavigateToPasswordChange();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header 
          title="Modifier le profil" 
          onBack={onBack} 
        />

        <Card>
          <View style={styles.formContainer}>
            <FormField
              label="Nom"
              value={formData.nom}
              onChangeText={(text) => handleFieldChange('nom', text)}
              placeholder="Votre nom"
              icon="person"
              autoCapitalize="words"
            />

            <FormField
              label="Prénom"
              value={formData.prenom}
              onChangeText={(text) => handleFieldChange('prenom', text)}
              placeholder="Votre prénom"
              icon="person"
              autoCapitalize="words"
            />

            <FormField
              label="Email"
              value={formData.email}
              onChangeText={(text) => handleFieldChange('email', text)}
              placeholder="votre.email@exemple.com"
              icon="email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <FormField
              label="Téléphone (optionnel)"
              value={formData.contact}
              onChangeText={(text) => handleFieldChange('contact', text)}
              placeholder="Votre numéro de téléphone"
              icon="phone"
              keyboardType="phone-pad"
            />

            <FormField
              label="Mot de passe actuel *"
              value={formData.currentPassword}
              onChangeText={(text) => handleFieldChange('currentPassword', text)}
              placeholder="Votre mot de passe actuel"
              icon="lock"
              secureTextEntry
              autoCapitalize="none"
            />

            <Button
              title="Enregistrer les modifications"
              onPress={handleUpdateProfile}
              loading={isLoading}
              icon="save"
              fullWidth
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PatientProfileEditScreen; 