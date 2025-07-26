import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Patient } from '../services/api';
import { colors, spacing } from '../styles/common';
import { 
  validateEmail, 
  validateContact,
  ValidationState, 
  ValidationStates,
} from '../utils/validation';
import { useForm } from '../services/formService';
import { useApi } from '../hooks/useApi';
import notificationService from '../services/notificationService';
import { FormField, Header, Button, Card } from '../components';

// Types pour les erreurs de validation
interface ValidationErrors {
  nom?: string;
  prenom?: string;
  email?: string;
  contact?: string;
  general?: string;
  [key: string]: string | undefined;
}

interface PatientProfileEditScreenProps {
  onBack: () => void;
  onProfileUpdated?: () => void;
}

const PatientProfileEditScreen: React.FC<PatientProfileEditScreenProps> = ({ 
  onBack, 
  onProfileUpdated 
}) => {
  const { patient, updatePatientData } = useAuth();
  
  // Form state management
  const {
    formState,
    setFieldValue,
    setFieldError,
    validateField,
    validateForm,
    isSubmitting,
    setIsSubmitting,
  } = useForm({
    nom: patient?.nom || '',
    prenom: patient?.prenom || '',
    email: patient?.email || '',
    contact: patient?.contact || '',
  });

  // API hooks
  const updateProfileApi = useApi(apiService.updatePatientProfile);

  // Validation configurations
  const validationConfigs = {
    nom: { required: true, minLength: 2 },
    prenom: { required: true, minLength: 2 },
    email: { 
      required: true, 
      customValidation: (value: string) => validateEmail(value) 
    },
    contact: { 
      customValidation: (value: string) => value ? validateContact(value) : undefined 
    },
  };

  const handleUpdateProfile = async () => {
    const { isValid, errors } = validateForm(validationConfigs);
    
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Update profile
      const profileResult = await updateProfileApi.execute({
        nom: formState.nom.value.trim(),
        prenom: formState.prenom.value.trim(),
        email: formState.email.value.trim().toLowerCase(),
        contact: formState.contact.value.trim() || undefined
      });

      if (!profileResult) {
        return;
      }

      // Update patient data in context
      if (updatePatientData && profileResult) {
        updatePatientData(profileResult);
      }
      
      notificationService.handleSuccess(
        'Vos informations ont été mises à jour avec succès.',
        false // Afficher une alerte au lieu d'un toast
      );
      
      // Exécuter le callback après un délai pour laisser le temps à l'utilisateur de voir le message
      setTimeout(() => {
        if (onProfileUpdated) {
          onProfileUpdated();
        }
        onBack();
      }, 1500);
    } catch (error: any) {
      notificationService.handleError(error, 'mise à jour du profil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <Header 
          title="Modifier le profil" 
          onBack={onBack} 
        />

        <Card>
          <FormField
            label="Nom *"
            value={formState.nom.value}
            onChangeText={(text) => setFieldValue('nom', text)}
            placeholder="Votre nom"
            icon="person"
            validationState={formState.nom.validationState}
            error={formState.nom.error}
            autoCapitalize="words"
          />

          <FormField
            label="Prénom *"
            value={formState.prenom.value}
            onChangeText={(text) => setFieldValue('prenom', text)}
            placeholder="Votre prénom"
            icon="person"
            validationState={formState.prenom.validationState}
            error={formState.prenom.error}
            autoCapitalize="words"
          />

          <FormField
            label="Email *"
            value={formState.email.value}
            onChangeText={(text) => setFieldValue('email', text)}
            placeholder="votre.email@exemple.com"
            icon="email"
            validationState={formState.email.validationState}
            error={formState.email.error}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <FormField
            label="Contact (optionnel)"
            value={formState.contact.value}
            onChangeText={(text) => setFieldValue('contact', text)}
            placeholder="Votre numéro de téléphone"
            icon="phone"
            validationState={formState.contact.validationState}
            error={formState.contact.error}
            keyboardType="phone-pad"
          />

          {updateProfileApi.error && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: colors.errorLight, 
              padding: spacing.md, 
              borderRadius: 8, 
              marginBottom: spacing.lg 
            }}>
              <Text style={{ color: colors.danger, fontSize: 14, flex: 1 }}>
                {updateProfileApi.error}
              </Text>
            </View>
          )}

          <Button
            title="Mettre à jour le profil"
            onPress={handleUpdateProfile}
            loading={isSubmitting}
            icon="save"
            fullWidth
          />

          <View style={{ marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: colors.textPrimary, 
              marginBottom: spacing.md 
            }}>
              Sécurité
            </Text>
            
            <Button
              title="Changer le mot de passe"
              onPress={() => {
                // Navigation vers l'écran de changement de mot de passe
                // Cette fonction sera gérée par le parent
                if (onProfileUpdated) {
                  onProfileUpdated();
                }
              }}
              icon="lock"
              variant="outline"
              fullWidth
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PatientProfileEditScreen; 