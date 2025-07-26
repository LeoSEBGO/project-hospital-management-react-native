import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, spacing } from '../styles/common';
import { apiService } from '../services/api';
import notificationService from '../services/notificationService';
import { FormField, Header, Button, Card } from '../components';

interface PatientPasswordChangeScreenProps {
  onBack: () => void;
  onPasswordChanged?: () => void;
}

const PatientPasswordChangeScreen: React.FC<PatientPasswordChangeScreenProps> = ({ 
  onBack, 
  onPasswordChanged 
}) => {
  // Form state
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = async () => {
    // Validation simple
    if (!formData.oldPassword.trim()) {
      notificationService.showErrorToast('Veuillez saisir votre mot de passe actuel');
      return;
    }

    if (!formData.newPassword.trim()) {
      notificationService.showErrorToast('Veuillez saisir votre nouveau mot de passe');
      return;
    }

    if (formData.newPassword.trim().length < 6) {
      notificationService.showErrorToast('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      notificationService.showErrorToast('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[PASSWORD_CHANGE] Tentative de changement de mot de passe...');
      
      const response = await apiService.updatePassword({
        oldPassword: formData.oldPassword.trim(),
        newPassword: formData.newPassword.trim()
      });

      console.log('[PASSWORD_CHANGE] Réponse API:', response);

      if (response.success) {
        notificationService.handleSuccess(
          'Mot de passe modifié avec succès',
          false
        );
        
        // Vider le formulaire
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        setTimeout(() => {
          if (onPasswordChanged) {
            onPasswordChanged();
          }
          onBack();
        }, 1500);
      } else {
        notificationService.showErrorToast(response.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error: any) {
      console.error('[PASSWORD_CHANGE] Erreur:', error);
      notificationService.handleError(error, 'changement de mot de passe');
    } finally {
      setIsLoading(false);
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
          <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg }}>
            <Text style={{ 
              fontSize: 16, 
              color: colors.textPrimary, 
              marginBottom: spacing.lg,
              textAlign: 'center'
            }}>
              Entrez votre mot de passe actuel et votre nouveau mot de passe
            </Text>

            <FormField
              label="Mot de passe actuel"
              value={formData.oldPassword}
              onChangeText={(text) => handleFieldChange('oldPassword', text)}
              placeholder="Votre mot de passe actuel"
              icon="lock"
              secureTextEntry
              autoCapitalize="none"
            />

            <FormField
              label="Nouveau mot de passe"
              value={formData.newPassword}
              onChangeText={(text) => handleFieldChange('newPassword', text)}
              placeholder="Votre nouveau mot de passe (min. 6 caractères)"
              icon="lock-outline"
              secureTextEntry
              autoCapitalize="none"
            />

            <FormField
              label="Confirmer le nouveau mot de passe"
              value={formData.confirmPassword}
              onChangeText={(text) => handleFieldChange('confirmPassword', text)}
              placeholder="Confirmez votre nouveau mot de passe"
              icon="lock-outline"
              secureTextEntry
              autoCapitalize="none"
            />

            <Button
              title="Modifier le mot de passe"
              onPress={handleChangePassword}
              loading={isLoading}
              icon="lock-reset"
              fullWidth
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PatientPasswordChangeScreen; 