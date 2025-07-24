import React, { useState } from 'react';
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

// Types pour les erreurs de validation
interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

const PatientLoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const { patientLogin, loading } = useAuth();

  // Fonction de validation de l'email
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'L\'email est requis';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Format d\'email invalide';
    }
    
    if (email.length > 100) {
      return 'L\'email est trop long (max 100 caractères)';
    }
    
    return undefined;
  };

  // Fonction de validation du mot de passe
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Le mot de passe est requis';
    }
    
    if (password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    if (password.length > 50) {
      return 'Le mot de passe est trop long (max 50 caractères)';
    }
    
    return undefined;
  };

  // Fonction de validation générale
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Valider l'email
    const emailError = validateEmail(email);
    if (emailError) {
      newErrors.email = emailError;
    }
    
    // Valider le mot de passe
    const passwordError = validatePassword(password);
    if (passwordError) {
      newErrors.password = passwordError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fonction de nettoyage des erreurs
  const clearErrors = () => {
    setErrors({});
  };

  // Fonction de gestion de la connexion
  const handleLogin = async () => {
    // Nettoyer les erreurs précédentes
    clearErrors();
    
    // Valider le formulaire
    if (!validateForm()) {
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
      } else if (error?.message?.includes('Email et mot de passe requis')) {
        errorMessage = 'Veuillez remplir tous les champs';
      } else if (error?.message?.includes('Erreur de connexion réseau')) {
        errorMessage = 'Problème de connexion réseau. Vérifiez votre connexion internet.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
    }
  };

  // Fonction de gestion du changement d'email
  const handleEmailChange = (text: string) => {
    setEmail(text);
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
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  // Fonction de validation en temps réel
  const validateField = (field: 'email' | 'password') => {
    if (field === 'email' && email) {
      const emailError = validateEmail(email);
      setErrors(prev => ({ ...prev, email: emailError }));
    } else if (field === 'password' && password) {
      const passwordError = validatePassword(password);
      setErrors(prev => ({ ...prev, password: passwordError }));
    }
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
                errors.email && { borderColor: '#e74c3c', borderWidth: 1 }
              ]}>
                <MaterialIcons 
                  name="email" 
                  size={20} 
                  color={errors.email ? '#e74c3c' : '#95a5a6'} 
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
              </View>
              {errors.email && (
                <Text style={patientLoginStyles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={patientLoginStyles.inputContainer}>
              <Text style={patientLoginStyles.label}>Mot de passe</Text>
              <View style={[
                patientLoginStyles.inputWrapper,
                errors.password && { borderColor: '#e74c3c', borderWidth: 1 }
              ]}>
                <MaterialIcons 
                  name="lock" 
                  size={20} 
                  color={errors.password ? '#e74c3c' : '#95a5a6'} 
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
                  style={{ padding: 4 }}
                >
                  <MaterialIcons 
                    name={showPassword ? "visibility" : "visibility-off"} 
                    size={20} 
                    color="#95a5a6" 
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={patientLoginStyles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Affichage des erreurs générales */}
            {errors.general && (
              <View style={patientLoginStyles.errorContainer}>
                <Text style={patientLoginStyles.errorMessage}>{errors.general}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                patientLoginStyles.button, 
                loading && patientLoginStyles.buttonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
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
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PatientLoginScreen; 