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
import patientLoginStyles from '../styles/screens/PatientLoginScreen.styles';
import { colors, spacing } from '../styles/common';
import { 
  validateEmail, 
  validatePassword, 
  ValidationState, 
  ValidationStates,
  getValidationBorderColor,
  getValidationIconColor
} from '../utils/validation';

// Types pour les erreurs de validation
interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface PatientLoginScreenProps {
  onNavigateToRegister?: () => void;
}

const PatientLoginScreen: React.FC<PatientLoginScreenProps> = ({ onNavigateToRegister }) => {
  console.log('[LOGIN] PatientLoginScreen rendu');
  console.log('[LOGIN] onNavigateToRegister reçu:', typeof onNavigateToRegister);
  console.log('[LOGIN] onNavigateToRegister valeur:', onNavigateToRegister);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [validationStates, setValidationStates] = useState<ValidationStates>({
    email: 'idle',
    password: 'idle'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { patientLogin, loading } = useAuth();



  // Validation en temps réel avec debounce
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
      if (password && validationStates.password === 'idle') {
        validateField('password');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [password]);

  // Fonction de validation générale
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;
    
    // Valider l'email
    const emailError = validateEmail(email);
    if (emailError) {
      newErrors.email = emailError;
      setValidationStates(prev => ({ ...prev, email: 'invalid' }));
      isValid = false;
    } else {
      setValidationStates(prev => ({ ...prev, email: 'valid' }));
    }
    
    // Valider le mot de passe
    const passwordError = validatePassword(password);
    if (passwordError) {
      newErrors.password = passwordError;
      setValidationStates(prev => ({ ...prev, password: 'invalid' }));
      isValid = false;
    } else {
      setValidationStates(prev => ({ ...prev, password: 'valid' }));
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Fonction de nettoyage des erreurs
  const clearErrors = () => {
    setErrors({});
    setValidationStates({
      email: 'idle',
      password: 'idle'
    });
  };

  // Fonction de gestion de la connexion
  const handleLogin = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Nettoyer les erreurs précédentes
    clearErrors();
    
    // Valider le formulaire
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('[LOGIN] Tentative avec:', { email: email.trim(), mot_de_passe: password });
      await patientLogin({ email: email.trim(), mot_de_passe: password });
      console.log('[LOGIN] Succès');
    } catch (error: any) {
      console.log('[LOGIN] Erreur:', error);
      
      // Gérer les erreurs spécifiques
      let errorMessage = 'Erreur de connexion';
      
      if (error?.message?.includes('Identifiants invalides')) {
        errorMessage = 'Email ou mot de passe incorrect';
        // Marquer les champs comme invalides
        setValidationStates({
          email: 'invalid',
          password: 'invalid'
        });
      } else if (error?.message?.includes('Email et mot de passe requis')) {
        errorMessage = 'Veuillez remplir tous les champs';
      } else if (error?.message?.includes('Erreur de connexion réseau')) {
        errorMessage = 'Problème de connexion réseau. Vérifiez votre connexion internet.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction de gestion du changement d'email
  const handleEmailChange = (text: string) => {
    setEmail(text);
    setValidationStates(prev => ({ ...prev, email: 'idle' }));
    
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  // Fonction de gestion du changement de mot de passe
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setValidationStates(prev => ({ ...prev, password: 'idle' }));
    
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  // Fonction de validation en temps réel
  const validateField = (field: 'email' | 'password') => {
    setValidationStates(prev => ({ ...prev, [field]: 'validating' }));
    
    if (field === 'email' && email) {
      const emailError = validateEmail(email);
      if (emailError) {
        setErrors(prev => ({ ...prev, email: emailError }));
        setValidationStates(prev => ({ ...prev, email: 'invalid' }));
      } else {
        setErrors(prev => ({ ...prev, email: undefined }));
        setValidationStates(prev => ({ ...prev, email: 'valid' }));
      }
    } else if (field === 'password' && password) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setErrors(prev => ({ ...prev, password: passwordError }));
        setValidationStates(prev => ({ ...prev, password: 'invalid' }));
      } else {
        setErrors(prev => ({ ...prev, password: undefined }));
        setValidationStates(prev => ({ ...prev, password: 'valid' }));
      }
    }
  };

  // Fonction pour obtenir la couleur de bordure selon l'état de validation
  const getBorderColor = (field: 'email' | 'password') => {
    const state = validationStates[field];
    const hasError = errors[field] || errors.general;
    return getValidationBorderColor(state, !!hasError, colors);
  };

  // Fonction pour obtenir la couleur de l'icône selon l'état de validation
  const getIconColor = (field: 'email' | 'password') => {
    const state = validationStates[field];
    const hasError = errors[field] || errors.general;
    return getValidationIconColor(state, !!hasError, colors);
  };

  return (
    <KeyboardAvoidingView
      style={patientLoginStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={patientLoginStyles.scrollContainer}>
        <View style={patientLoginStyles.content}>
          <Text style={patientLoginStyles.title}>HOSMAPP</Text>
          <Text style={patientLoginStyles.subtitle}>Prendre rendez-vous en ligne</Text>
          
          <View style={patientLoginStyles.form}>
            <View style={patientLoginStyles.inputContainer}>
              <Text style={patientLoginStyles.label}>Email</Text>
              <View style={[
                patientLoginStyles.inputWrapper,
                { borderColor: getBorderColor('email'), borderWidth: 2 }
              ]}>
                <MaterialIcons 
                  name="email" 
                  size={20} 
                  color={getIconColor('email')} 
                  style={patientLoginStyles.inputIcon} 
                />
                <TextInput
                  style={patientLoginStyles.input}
                  value={email}
                  onChangeText={handleEmailChange}
                  onBlur={() => validateField('email')}
                  placeholder="Entrez votre adresse email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
                {validationStates.email === 'valid' && (
                  <MaterialIcons 
                    name="check-circle" 
                    size={20} 
                    color={colors.success} 
                    style={patientLoginStyles.loadingIndicator}
                  />
                )}
                {validationStates.email === 'validating' && (
                  <ActivityIndicator size="small" color={colors.warning} style={patientLoginStyles.loadingIndicator} />
                )}
              </View>
              {errors.email && (
                <Text style={patientLoginStyles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={patientLoginStyles.inputContainer}>
              <Text style={patientLoginStyles.label}>Mot de passe</Text>
              <View style={[
                patientLoginStyles.inputWrapper,
                { borderColor: getBorderColor('password'), borderWidth: 2 }
              ]}>
                <MaterialIcons 
                  name="lock" 
                  size={20} 
                  color={getIconColor('password')} 
                  style={patientLoginStyles.inputIcon} 
                />
                <TextInput
                  style={patientLoginStyles.input}
                  value={password}
                  onChangeText={handlePasswordChange}
                  onBlur={() => validateField('password')}
                  placeholder="Entrez votre mot de passe"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={patientLoginStyles.passwordToggle}
                >
                  <MaterialIcons 
                    name={showPassword ? "visibility" : "visibility-off"} 
                    size={20} 
                    color={colors.textLight} 
                  />
                </TouchableOpacity>
                {validationStates.password === 'valid' && (
                  <MaterialIcons 
                    name="check-circle" 
                    size={20} 
                    color={colors.success} 
                    style={patientLoginStyles.loadingIndicator}
                  />
                )}
                {validationStates.password === 'validating' && (
                  <ActivityIndicator size="small" color={colors.warning} style={patientLoginStyles.loadingIndicator} />
                )}
              </View>
              {errors.password && (
                <Text style={patientLoginStyles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Affichage des erreurs générales */}
            {errors.general && (
              <View style={patientLoginStyles.errorContainer}>
                <MaterialIcons 
                  name="error" 
                  size={20} 
                  color={colors.danger} 
                  style={patientLoginStyles.errorIcon}
                />
                <Text style={patientLoginStyles.errorMessage}>{errors.general}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                patientLoginStyles.button, 
                (loading || isSubmitting) && patientLoginStyles.buttonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading || isSubmitting}
            >
              {(loading || isSubmitting) ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="login" size={20} color="#fff" style={patientLoginStyles.buttonIcon} />
                  <Text style={patientLoginStyles.buttonText}>Se connecter</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={patientLoginStyles.infoContainer}>
              <Text style={patientLoginStyles.infoText}>
                Connectez-vous avec votre adresse email et votre mot de passe pour suivre votre statut.
              </Text>
            </View>

            {/* Lien vers l'inscription */}
            <View style={patientLoginStyles.registerLink}>
              <Text style={patientLoginStyles.registerText}>
                Vous n'avez pas de compte ?{' '}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  console.log('[LOGIN] Bouton S\'inscrire cliqué');
                  console.log('[LOGIN] onNavigateToRegister type:', typeof onNavigateToRegister);
                  
                  if (onNavigateToRegister && typeof onNavigateToRegister === 'function') {
                    try {
                      onNavigateToRegister();
                      console.log('[LOGIN] Navigation vers l\'inscription réussie');
                    } catch (error) {
                      console.error('[LOGIN] Erreur lors de la navigation:', error);
                      Alert.alert('Erreur', 'Impossible de naviguer vers l\'écran d\'inscription');
                    }
                  } else {
                    console.error('[LOGIN] onNavigateToRegister n\'est pas défini ou n\'est pas une fonction');
                    Alert.alert('Erreur', 'Impossible de naviguer vers l\'écran d\'inscription');
                  }
                }}
                style={patientLoginStyles.registerButton}
                activeOpacity={0.7}
              >
                <MaterialIcons name="person-add" size={16} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={patientLoginStyles.registerLinkText}>
                  S'inscrire
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PatientLoginScreen; 