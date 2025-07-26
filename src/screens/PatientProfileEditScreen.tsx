import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Patient } from '../services/api';
import { colors, spacing } from '../styles/common';
import styles from '../styles/screens/PatientProfileEditScreen.styles';
import { 
  validateEmail, 
  validateContact,
  validatePassword,
  ValidationState, 
  ValidationStates,
  getValidationBorderColor,
  getValidationIconColor
} from '../utils/validation';

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
  const [nom, setNom] = useState(patient?.nom || '');
  const [prenom, setPrenom] = useState(patient?.prenom || '');
  const [email, setEmail] = useState(patient?.email || '');
  const [contact, setContact] = useState(patient?.contact || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isOldPasswordValid, setIsOldPasswordValid] = useState(false);
  const [isValidatingOldPassword, setIsValidatingOldPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [validationStates, setValidationStates] = useState<ValidationStates>({
    nom: 'idle',
    prenom: 'idle',
    email: 'idle',
    contact: 'idle',
    oldPassword: 'idle',
    newPassword: 'idle'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation en temps réel avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (nom && validationStates.nom === 'idle') {
        validateField('nom');
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [nom]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (prenom && validationStates.prenom === 'idle') {
        validateField('prenom');
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [prenom]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (email && validationStates.email === 'idle') {
        validateField('email');
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (contact && validationStates.contact === 'idle') {
        validateField('contact');
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [contact]);

  // Fonction de validation générale
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;
    
    // Valider le nom
    if (!nom.trim()) {
      newErrors.nom = 'Le nom est requis';
      setValidationStates(prev => ({ ...prev, nom: 'invalid' }));
      isValid = false;
    } else if (nom.trim().length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
      setValidationStates(prev => ({ ...prev, nom: 'invalid' }));
      isValid = false;
    } else {
      setValidationStates(prev => ({ ...prev, nom: 'valid' }));
    }
    
    // Valider le prénom
    if (!prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
      setValidationStates(prev => ({ ...prev, prenom: 'invalid' }));
      isValid = false;
    } else if (prenom.trim().length < 2) {
      newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
      setValidationStates(prev => ({ ...prev, prenom: 'invalid' }));
      isValid = false;
    } else {
      setValidationStates(prev => ({ ...prev, prenom: 'valid' }));
    }
    
    // Valider l'email
    const emailError = validateEmail(email);
    if (emailError) {
      newErrors.email = emailError;
      setValidationStates(prev => ({ ...prev, email: 'invalid' }));
      isValid = false;
    } else {
      setValidationStates(prev => ({ ...prev, email: 'valid' }));
    }
    
    // Valider le contact (optionnel)
    if (contact.trim()) {
      const contactError = validateContact(contact);
      if (contactError) {
        newErrors.contact = contactError;
        setValidationStates(prev => ({ ...prev, contact: 'invalid' }));
        isValid = false;
      } else {
        setValidationStates(prev => ({ ...prev, contact: 'valid' }));
      }
    }

    // Valider le nouveau mot de passe si l'ancien est validé
    if (isOldPasswordValid && newPassword.trim()) {
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        newErrors.newPassword = passwordError;
        setValidationStates(prev => ({ ...prev, newPassword: 'invalid' }));
        isValid = false;
      } else {
        setValidationStates(prev => ({ ...prev, newPassword: 'valid' }));
      }
    } else if (newPassword.trim() && !isOldPasswordValid) {
      newErrors.newPassword = 'Validez d\'abord votre ancien mot de passe';
      setValidationStates(prev => ({ ...prev, newPassword: 'invalid' }));
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const clearErrors = () => {
    setErrors({});
    setValidationStates({
      nom: 'idle',
      prenom: 'idle',
      email: 'idle',
      contact: 'idle'
    });
  };

  const validateField = (field: keyof ValidationStates) => {
    setValidationStates(prev => ({ ...prev, [field]: 'validating' as ValidationState }));
    
    setTimeout(() => {
      let isValid = true;
      let errorMessage = '';
      
      switch (field) {
        case 'nom':
          if (!nom.trim()) {
            isValid = false;
            errorMessage = 'Le nom est requis';
          } else if (nom.trim().length < 2) {
            isValid = false;
            errorMessage = 'Le nom doit contenir au moins 2 caractères';
          }
          break;
        case 'prenom':
          if (!prenom.trim()) {
            isValid = false;
            errorMessage = 'Le prénom est requis';
          } else if (prenom.trim().length < 2) {
            isValid = false;
            errorMessage = 'Le prénom doit contenir au moins 2 caractères';
          }
          break;
        case 'email':
          const emailError = validateEmail(email);
          if (emailError) {
            isValid = false;
            errorMessage = emailError;
          }
          break;
        case 'contact':
          if (contact.trim()) {
            const contactError = validateContact(contact);
            if (contactError) {
              isValid = false;
              errorMessage = contactError;
            }
          }
          break;
      }
      
      setValidationStates(prev => ({ 
        ...prev, 
        [field]: isValid ? 'valid' as ValidationState : 'invalid' as ValidationState
      }));
      
      if (isValid) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      } else {
        setErrors(prev => ({ ...prev, [field]: errorMessage }));
      }
    }, 300);
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearErrors();

    try {
      // Mise à jour du profil de base
      const profileResponse = await apiService.updatePatientProfile({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim().toLowerCase(),
        contact: contact.trim() || undefined
      });

      if (!profileResponse.success) {
        setErrors({ general: profileResponse.message || 'Erreur lors de la mise à jour du profil' });
        return;
      }

      // Mise à jour du mot de passe si nécessaire
      if (oldPassword && newPassword && isOldPasswordValid) {
        const passwordResponse = await apiService.updatePassword({
          oldPassword,
          newPassword
        });

        if (!passwordResponse.success) {
          setErrors({ general: passwordResponse.message || 'Erreur lors de la mise à jour du mot de passe' });
          return;
        }
      }

      // Mettre à jour les données du patient dans le contexte
      if (updatePatientData && profileResponse.data) {
        updatePatientData(profileResponse.data);
      }
      
      Alert.alert(
        'Profil mis à jour',
        'Vos informations ont été mises à jour avec succès.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onProfileUpdated) {
                onProfileUpdated();
              }
              onBack();
            }
          }
        ]
      );
    } catch (error: any) {
      setErrors({ general: error.message || 'Erreur de connexion' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonctions de gestion des changements
  const handleNomChange = (text: string) => {
    setNom(text);
    if (errors.nom) {
      setErrors(prev => ({ ...prev, nom: undefined }));
      setValidationStates(prev => ({ ...prev, nom: 'idle' }));
    }
  };

  const handlePrenomChange = (text: string) => {
    setPrenom(text);
    if (errors.prenom) {
      setErrors(prev => ({ ...prev, prenom: undefined }));
      setValidationStates(prev => ({ ...prev, prenom: 'idle' }));
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
      setValidationStates(prev => ({ ...prev, email: 'idle' }));
    }
  };

  const handleContactChange = (text: string) => {
    setContact(text);
    if (errors.contact) {
      setErrors(prev => ({ ...prev, contact: undefined }));
      setValidationStates(prev => ({ ...prev, contact: 'idle' }));
    }
  };

  const handleOldPasswordChange = (text: string) => {
    setOldPassword(text);
    setIsOldPasswordValid(false);
    if (errors.oldPassword) {
      setErrors(prev => ({ ...prev, oldPassword: undefined }));
      setValidationStates(prev => ({ ...prev, oldPassword: 'idle' }));
    }
  };

  // Validation automatique de l'ancien mot de passe avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (oldPassword.trim() && !isValidatingOldPassword && !isOldPasswordValid) {
        validateOldPassword();
      }
    }, 2000); // 1 seconde de délai après la fin de saisie
    
    return () => clearTimeout(timeoutId);
  }, [oldPassword]);

  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    if (errors.newPassword) {
      setErrors(prev => ({ ...prev, newPassword: undefined }));
      setValidationStates(prev => ({ ...prev, newPassword: 'idle' }));
    }
  };

  const validateOldPassword = async () => {
    if (!oldPassword.trim()) {
      setErrors(prev => ({ ...prev, oldPassword: 'L\'ancien mot de passe est requis' }));
      setValidationStates(prev => ({ ...prev, oldPassword: 'invalid' }));
      setIsOldPasswordValid(false);
      return false;
    }

    setIsValidatingOldPassword(true);
    setValidationStates(prev => ({ ...prev, oldPassword: 'validating' }));

    try {
      // Appel API pour valider l'ancien mot de passe
      const response = await apiService.validateOldPassword(oldPassword);
      
      if (response.success) {
        setIsOldPasswordValid(true);
        setValidationStates(prev => ({ ...prev, oldPassword: 'valid' }));
        setErrors(prev => ({ ...prev, oldPassword: undefined }));
        
        // Fetch du profil après validation réussie
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
        setValidationStates(prev => ({ ...prev, oldPassword: 'invalid' }));
        setErrors(prev => ({ ...prev, oldPassword: 'L\'ancien mot de passe est incorrect' }));
        return false;
      }
    } catch (error: any) {
      setIsOldPasswordValid(false);
      setValidationStates(prev => ({ ...prev, oldPassword: 'invalid' }));
      setErrors(prev => ({ ...prev, oldPassword: error.message || 'Erreur de validation' }));
      return false;
    } finally {
      setIsValidatingOldPassword(false);
    }
  };

  const getBorderColor = (field: keyof ValidationStates) => {
    return getValidationBorderColor(validationStates[field], !!errors[field], colors);
  };

  const getIconColor = (field: keyof ValidationStates) => {
    return getValidationIconColor(validationStates[field], !!errors[field], colors);
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={onBack}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Modifier le profil
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Nom */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Nom *
            </Text>
            <View style={[styles.inputContainer, { borderColor: getBorderColor('nom') }]}>
              <MaterialIcons 
                name="person" 
                size={20} 
                color={getIconColor('nom')} 
                style={styles.inputIcon}
              />
              <TextInput
                value={nom}
                onChangeText={handleNomChange}
                placeholder="Votre nom"
                style={styles.textInput}
                autoCapitalize="words"
              />
              {validationStates.nom === 'valid' && (
                <MaterialIcons 
                  name="check-circle" 
                  size={20} 
                  color={colors.success} 
                  style={styles.validationIcon}
                />
              )}
              {validationStates.nom === 'validating' && (
                <ActivityIndicator size="small" color={colors.warning} style={styles.validationIcon} />
              )}
            </View>
            {errors.nom && (
              <Text style={styles.errorText}>
                {errors.nom}
              </Text>
            )}
          </View>

          {/* Prénom */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              Prénom *
            </Text>
            <View style={[styles.inputContainer, { borderColor: getBorderColor('prenom') }]}>
              <MaterialIcons 
                name="person" 
                size={20} 
                color={getIconColor('prenom')} 
                style={styles.inputIcon}
              />
              <TextInput
                value={prenom}
                onChangeText={handlePrenomChange}
                placeholder="Votre prénom"
                style={styles.textInput}
                autoCapitalize="words"
              />
              {validationStates.prenom === 'valid' && (
                <MaterialIcons 
                  name="check-circle" 
                  size={20} 
                  color={colors.success} 
                  style={styles.validationIcon}
                />
              )}
              {validationStates.prenom === 'validating' && (
                <ActivityIndicator size="small" color={colors.warning} style={styles.validationIcon} />
              )}
            </View>
            {errors.prenom && (
              <Text style={styles.errorText}>
                {errors.prenom}
              </Text>
            )}
          </View>

          {/* Email */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: colors.textPrimary, 
              marginBottom: spacing.sm 
            }}>
              Email *
            </Text>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              borderWidth: 1,
              borderColor: getBorderColor('email'),
              borderRadius: 8,
              paddingHorizontal: spacing.md,
              backgroundColor: colors.white
            }}>
              <MaterialIcons 
                name="email" 
                size={20} 
                color={getIconColor('email')} 
                style={{ marginRight: spacing.sm }}
              />
              <TextInput
                value={email}
                onChangeText={handleEmailChange}
                placeholder="votre.email@exemple.com"
                style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: colors.textPrimary,
                  paddingVertical: spacing.md
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {validationStates.email === 'valid' && (
                <MaterialIcons 
                  name="check-circle" 
                  size={20} 
                  color={colors.success} 
                />
              )}
              {validationStates.email === 'validating' && (
                <ActivityIndicator size="small" color={colors.warning} />
              )}
            </View>
            {errors.email && (
              <Text style={{ color: colors.danger, fontSize: 14, marginTop: spacing.xs }}>
                {errors.email}
              </Text>
            )}
          </View>

          {/* Contact */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: colors.textPrimary, 
              marginBottom: spacing.sm 
            }}>
              Contact (optionnel)
            </Text>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              borderWidth: 1,
              borderColor: getBorderColor('contact'),
              borderRadius: 8,
              paddingHorizontal: spacing.md,
              backgroundColor: colors.white
            }}>
              <MaterialIcons 
                name="phone" 
                size={20} 
                color={getIconColor('contact')} 
                style={{ marginRight: spacing.sm }}
              />
              <TextInput
                value={contact}
                onChangeText={handleContactChange}
                placeholder="Votre numéro de téléphone"
                style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: colors.textPrimary,
                  paddingVertical: spacing.md
                }}
                keyboardType="phone-pad"
              />
              {validationStates.contact === 'valid' && (
                <MaterialIcons 
                  name="check-circle" 
                  size={20} 
                  color={colors.success} 
                />
              )}
              {validationStates.contact === 'validating' && (
                <ActivityIndicator size="small" color={colors.warning} />
              )}
            </View>
            {errors.contact && (
              <Text style={{ color: colors.danger, fontSize: 14, marginTop: spacing.xs }}>
                {errors.contact}
              </Text>
            )}
          </View>

          {/* Ancien mot de passe */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: colors.textPrimary, 
              marginBottom: spacing.sm 
            }}>
              Ancien mot de passe
            </Text>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              borderWidth: 1,
              borderColor: getBorderColor('oldPassword'),
              borderRadius: 8,
              paddingHorizontal: spacing.md,
              backgroundColor: colors.white
            }}>
              <MaterialIcons 
                name="lock" 
                size={20} 
                color={getIconColor('oldPassword')} 
                style={{ marginRight: spacing.sm }}
              />
              <TextInput
                value={oldPassword}
                onChangeText={handleOldPasswordChange}
                placeholder="Votre mot de passe actuel"
                style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: colors.textPrimary,
                  paddingVertical: spacing.md
                }}
                secureTextEntry
                autoCapitalize="none"
              />
              {validationStates.oldPassword === 'valid' && (
                <MaterialIcons 
                  name="check-circle" 
                  size={20} 
                  color={colors.success} 
                />
              )}
              {isValidatingOldPassword && (
                <ActivityIndicator size="small" color={colors.warning} />
              )}
              {oldPassword && !isValidatingOldPassword && validationStates.oldPassword !== 'valid' && (
                <TouchableOpacity onPress={validateOldPassword}>
                  <MaterialIcons 
                    name="check" 
                    size={20} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>
            {errors.oldPassword && (
              <Text style={{ color: colors.danger, fontSize: 14, marginTop: spacing.xs }}>
                {errors.oldPassword}
              </Text>
            )}
          </View>

          {/* Nouveau mot de passe */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: colors.textPrimary, 
              marginBottom: spacing.sm 
            }}>
              Nouveau mot de passe
            </Text>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              borderWidth: 1,
              borderColor: getBorderColor('newPassword'),
              borderRadius: 8,
              paddingHorizontal: spacing.md,
              backgroundColor: colors.white,
              opacity: isOldPasswordValid ? 1 : 0.5
            }}>
              <MaterialIcons 
                name="lock-outline" 
                size={20} 
                color={getIconColor('newPassword')} 
                style={{ marginRight: spacing.sm }}
              />
              <TextInput
                value={newPassword}
                onChangeText={handleNewPasswordChange}
                placeholder="Votre nouveau mot de passe"
                style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: colors.textPrimary,
                  paddingVertical: spacing.md
                }}
                secureTextEntry
                autoCapitalize="none"
                editable={isOldPasswordValid}
              />
              {validationStates.newPassword === 'valid' && (
                <MaterialIcons 
                  name="check-circle" 
                  size={20} 
                  color={colors.success} 
                />
              )}
              {validationStates.newPassword === 'validating' && (
                <ActivityIndicator size="small" color={colors.warning} />
              )}
            </View>
            {errors.newPassword && (
              <Text style={{ color: colors.danger, fontSize: 14, marginTop: spacing.xs }}>
                {errors.newPassword}
              </Text>
            )}
            {!isOldPasswordValid && oldPassword && (
              <Text style={{ color: colors.warning, fontSize: 12, marginTop: spacing.xs }}>
                Validez d'abord votre ancien mot de passe
              </Text>
            )}
          </View>

          {/* Affichage des erreurs générales */}
          {errors.general && (
            <View style={styles.errorContainer}>
              <MaterialIcons 
                name="error" 
                size={20} 
                color={colors.danger} 
                style={styles.errorIcon}
              />
              <Text style={styles.errorMessage}>
                {errors.general}
              </Text>
            </View>
          )}

          {/* Bouton de mise à jour */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleUpdateProfile}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.submitButtonContent}>
                <MaterialIcons name="save" size={20} color="#fff" style={styles.submitButtonIcon} />
                <Text style={styles.submitButtonText}>
                  Mettre à jour le profil
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PatientProfileEditScreen; 