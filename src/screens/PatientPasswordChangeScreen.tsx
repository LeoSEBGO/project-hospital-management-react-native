import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, spacing } from '../styles/common';
import { 
  validatePassword,
  ValidationState, 
  ValidationStates,
} from '../utils/validation';
import { useForm } from '../services/formService';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/api';
import notificationService from '../services/notificationService';
import { FormField, Header, Button, Card } from '../components';

// Types pour les erreurs de validation
interface ValidationErrors {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
  [key: string]: string | undefined;
}

interface PatientPasswordChangeScreenProps {
  onBack: () => void;
  onPasswordChanged?: () => void;
}

const PatientPasswordChangeScreen: React.FC<PatientPasswordChangeScreenProps> = ({ 
  onBack, 
  onPasswordChanged 
}) => {
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
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // API hooks
  const updatePasswordApi = useApi(apiService.updatePassword);

  // Validation configurations
  const validationConfigs = {
    oldPassword: { 
      required: true,
      minLength: 6,
      customValidation: (value: string) => {
        if (!value) return 'L\'ancien mot de passe est requis';
        if (value.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères';
        return undefined;
      }
    },
    newPassword: { 
      required: true,
      minLength: 6,
      customValidation: (value: string) => {
        if (!value) return 'Le nouveau mot de passe est requis';
        const passwordError = validatePassword(value);
        if (passwordError) return passwordError;
        return undefined;
      }
    },
    confirmPassword: { 
      required: true,
      customValidation: (value: string) => {
        if (!value) return 'Confirmez votre nouveau mot de passe';
        if (value !== formState.newPassword.value) {
          return 'Les mots de passe ne correspondent pas';
        }
        return undefined;
      }
    },
  };

  const handleChangePassword = async () => {
    const { isValid, errors } = validateForm(validationConfigs);
    
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updatePasswordApi.execute({
        oldPassword: formState.oldPassword.value,
        newPassword: formState.newPassword.value
      });

      if (result) {
        notificationService.handleSuccess(
          'Votre mot de passe a été modifié avec succès.',
          false // Afficher une alerte au lieu d'un toast
        );
        
        // Exécuter le callback après un délai pour laisser le temps à l'utilisateur de voir le message
        setTimeout(() => {
          if (onPasswordChanged) {
            onPasswordChanged();
          }
          onBack();
        }, 1500);
      }
    } catch (error: any) {
      notificationService.handleError(error, 'changement de mot de passe');
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
          title="Changer le mot de passe" 
          onBack={onBack} 
        />

        <Card>
          <Text style={{ 
            fontSize: 16, 
            color: colors.textPrimary, 
            marginBottom: spacing.lg,
            textAlign: 'center'
          }}>
            Entrez votre mot de passe actuel et votre nouveau mot de passe
          </Text>

          <FormField
            label="Ancien mot de passe *"
            value={formState.oldPassword.value}
            onChangeText={(text) => setFieldValue('oldPassword', text)}
            placeholder="Votre mot de passe actuel"
            icon="lock"
            validationState={formState.oldPassword.validationState}
            error={formState.oldPassword.error}
            secureTextEntry
            autoCapitalize="none"
          />

          <FormField
            label="Nouveau mot de passe *"
            value={formState.newPassword.value}
            onChangeText={(text) => setFieldValue('newPassword', text)}
            placeholder="Votre nouveau mot de passe"
            icon="lock-outline"
            validationState={formState.newPassword.validationState}
            error={formState.newPassword.error}
            secureTextEntry
            autoCapitalize="none"
          />

          <FormField
            label="Confirmer le nouveau mot de passe *"
            value={formState.confirmPassword.value}
            onChangeText={(text) => setFieldValue('confirmPassword', text)}
            placeholder="Confirmez votre nouveau mot de passe"
            icon="lock-outline"
            validationState={formState.confirmPassword.validationState}
            error={formState.confirmPassword.error}
            secureTextEntry
            autoCapitalize="none"
          />

          {updatePasswordApi.error && (
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: colors.errorLight, 
              padding: spacing.md, 
              borderRadius: 8, 
              marginBottom: spacing.lg 
            }}>
              <Text style={{ color: colors.danger, fontSize: 14, flex: 1 }}>
                {updatePasswordApi.error}
              </Text>
            </View>
          )}

          <Button
            title="Changer le mot de passe"
            onPress={handleChangePassword}
            loading={isSubmitting}
            icon="lock-reset"
            fullWidth
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PatientPasswordChangeScreen; 