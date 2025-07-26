import React, { useState, useEffect } from 'react';
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
  validatePassword,
  ValidationState, 
  ValidationStates,
} from '../utils/validation';
import { useForm } from '../services/formService';
import { useApi } from '../hooks/useApi';
import { useDebounce } from '../hooks/useDebounce';
import notificationService from '../services/notificationService';
import { FormField, Header, Button, Card } from '../components';

// Types pour les erreurs de validation
interface ValidationErrors {
  nom?: string;
  prenom?: string;
  email?: string;
  contact?: string;
  oldPassword?: string;
  newPassword?: string;
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
    oldPassword: '',
    newPassword: '',
  });

  // API hooks
  const updateProfileApi = useApi(apiService.updatePatientProfile);
  const updatePasswordApi = useApi(apiService.updatePassword);
  const validatePasswordApi = useApi(apiService.validateOldPassword);

  // State for password validation
  const [isOldPasswordValid, setIsOldPasswordValid] = useState(false);
  const [isValidatingOldPassword, setIsValidatingOldPassword] = useState(false);

  // Debounced old password for auto-validation
  const debouncedOldPassword = useDebounce(formState.oldPassword?.value || '', 2000);

  // Auto-validate old password when debounced value changes
  useEffect(() => {
    if (debouncedOldPassword && !isValidatingOldPassword && !isOldPasswordValid) {
      handleValidateOldPassword();
    }
  }, [debouncedOldPassword]);

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
    newPassword: { 
      customValidation: (value: string) => {
        if (value && !isOldPasswordValid) {
          return 'Validez d\'abord votre ancien mot de passe';
        }
        return value ? validatePassword(value) : undefined;
      }
    },
  };

  const handleValidateOldPassword = async () => {
    if (!formState.oldPassword?.value.trim()) {
      setFieldError('oldPassword', 'L\'ancien mot de passe est requis');
      setIsOldPasswordValid(false);
      return false;
    }

    setIsValidatingOldPassword(true);
    setFieldValue('oldPassword', formState.oldPassword.value);

    try {
      const result = await validatePasswordApi.execute(formState.oldPassword.value);
      
      if (result) {
        setIsOldPasswordValid(true);
        setFieldError('oldPassword', undefined);
        
        // Fetch updated profile
        try {
          const profileResponse = await apiService.getCurrentPatient();
          if (profileResponse.success && profileResponse.data && updatePatientData) {
            updatePatientData(profileResponse.data);
          }
        } catch (profileError) {
          console.log('[PROFILE] Erreur lors du fetch du profil:', profileError);
        }
        
        return true;
      } else {
        setIsOldPasswordValid(false);
        setFieldError('oldPassword', 'L\'ancien mot de passe est incorrect');
        return false;
      }
    } catch (error: any) {
      setIsOldPasswordValid(false);
      setFieldError('oldPassword', error.message || 'Erreur de validation');
      return false;
    } finally {
      setIsValidatingOldPassword(false);
    }
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

      // Update password if needed
      if (formState.oldPassword.value && formState.newPassword.value && isOldPasswordValid) {
        const passwordResult = await updatePasswordApi.execute({
          oldPassword: formState.oldPassword.value,
          newPassword: formState.newPassword.value
        });

        if (!passwordResult) {
          return;
        }
      }

      // Update patient data in context
      if (updatePatientData && profileResult) {
        updatePatientData(profileResult);
      }
      
      notificationService.showSuccess(
        'Vos informations ont été mises à jour avec succès.',
        () => {
          if (onProfileUpdated) {
            onProfileUpdated();
          }
          onBack();
        }
      );
    } catch (error: any) {
      notificationService.showError(error.message || 'Erreur de connexion');
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

          <FormField
            label="Ancien mot de passe"
            value={formState.oldPassword.value}
            onChangeText={(text) => setFieldValue('oldPassword', text)}
            placeholder="Votre mot de passe actuel"
            icon="lock"
            validationState={formState.oldPassword.validationState}
            error={formState.oldPassword.error}
            secureTextEntry
            autoCapitalize="none"
            showValidationButton={true}
            onValidationPress={handleValidateOldPassword}
          />

          <FormField
            label="Nouveau mot de passe"
            value={formState.newPassword.value}
            onChangeText={(text) => setFieldValue('newPassword', text)}
            placeholder="Votre nouveau mot de passe"
            icon="lock-outline"
            validationState={formState.newPassword.validationState}
            error={formState.newPassword.error}
            secureTextEntry
            autoCapitalize="none"
            editable={isOldPasswordValid}
          />

          {!isOldPasswordValid && formState.oldPassword.value && (
            <Text style={{ color: colors.warning, fontSize: 12, marginTop: spacing.xs }}>
              Validez d'abord votre ancien mot de passe
            </Text>
          )}

          {(updateProfileApi.error || updatePasswordApi.error) && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: colors.errorLight, 
              padding: spacing.md, 
              borderRadius: 8, 
              marginBottom: spacing.lg 
            }}>
              <Text style={{ color: colors.danger, fontSize: 14, flex: 1 }}>
                {updateProfileApi.error || updatePasswordApi.error}
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
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PatientProfileEditScreen; 