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
import { apiService } from '../services/api';
import patientRegisterStyles from '../styles/screens/PatientRegisterScreen.styles';
import { colors, spacing } from '../styles/common';
import { 
  validateEmail, 
  validatePassword, 
  validateContact,
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
  password?: string;
  confirmPassword?: string;
  contact?: string;
  general?: string;
  [key: string]: string | undefined;
}

interface PatientRegisterScreenProps {
  onBack?: () => void;
  onRegisterSuccess?: () => void;
}

const PatientRegisterScreen: React.FC<PatientRegisterScreenProps> = ({ 
  onBack, 
  onRegisterSuccess 
}) => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contact, setContact] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [validationStates, setValidationStates] = useState<ValidationStates>({
    nom: 'idle',
    prenom: 'idle',
    email: 'idle',
    password: 'idle',
    confirmPassword: 'idle',
    contact: 'idle'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { patientLogin } = useAuth();

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
      if (password && validationStates.password === 'idle') {
        validateField('password');
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [password]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (confirmPassword && validationStates.confirmPassword === 'idle') {
        validateField('confirmPassword');
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [confirmPassword]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (contact && validationStates.contact === 'idle') {
        validateField('contact');
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [contact]);

  // Validation des mots de passe
  useEffect(() => {
    if (confirmPassword && password) {
      if (confirmPassword !== password) {
        setValidationStates(prev => ({ ...prev, confirmPassword: 'invalid' }));
        setErrors(prev => ({ ...prev, confirmPassword: 'Les mots de passe ne correspondent pas' }));
      } else {
        setValidationStates(prev => ({ ...prev, confirmPassword: 'valid' }));
        setErrors(prev => ({ ...prev, confirmPassword: undefined }));
      }
    }
  }, [confirmPassword, password]);

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
    
    // Valider le mot de passe
    const passwordError = validatePassword(password);
    if (passwordError) {
      newErrors.password = passwordError;
      setValidationStates(prev => ({ ...prev, password: 'invalid' }));
      isValid = false;
    } else {
      setValidationStates(prev => ({ ...prev, password: 'valid' }));
    }
    
    // Valider la confirmation du mot de passe
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
      setValidationStates(prev => ({ ...prev, confirmPassword: 'invalid' }));
      isValid = false;
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      setValidationStates(prev => ({ ...prev, confirmPassword: 'invalid' }));
      isValid = false;
    } else {
      setValidationStates(prev => ({ ...prev, confirmPassword: 'valid' }));
    }
    
    // Valider le contact (optionnel mais si fourni, doit être valide)
    if (contact) {
      setValidationStates(prev => ({ ...prev, contact: 'valid' }));
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Fonction de nettoyage des erreurs
  const clearErrors = () => {
    setErrors({});
    setValidationStates({
      nom: 'idle',
      prenom: 'idle',
      email: 'idle',
      password: 'idle',
      confirmPassword: 'idle',
      contact: 'idle'
    });
  };

  // Fonction de validation d'un champ spécifique
  const validateField = (field: keyof ValidationStates) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'nom':
        if (!nom.trim()) {
          newErrors.nom = 'Le nom est requis';
          setValidationStates(prev => ({ ...prev, nom: 'invalid' }));
        } else if (nom.trim().length < 2) {
          newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
          setValidationStates(prev => ({ ...prev, nom: 'invalid' }));
        } else {
          delete newErrors.nom;
          setValidationStates(prev => ({ ...prev, nom: 'valid' }));
        }
        break;
        
      case 'prenom':
        if (!prenom.trim()) {
          newErrors.prenom = 'Le prénom est requis';
          setValidationStates(prev => ({ ...prev, prenom: 'invalid' }));
        } else if (prenom.trim().length < 2) {
          newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
          setValidationStates(prev => ({ ...prev, prenom: 'invalid' }));
        } else {
          delete newErrors.prenom;
          setValidationStates(prev => ({ ...prev, prenom: 'valid' }));
        }
        break;
        
      case 'email':
        const emailError = validateEmail(email);
        if (emailError) {
          newErrors.email = emailError;
          setValidationStates(prev => ({ ...prev, email: 'invalid' }));
        } else {
          delete newErrors.email;
          setValidationStates(prev => ({ ...prev, email: 'valid' }));
        }
        break;
        
      case 'password':
        const passwordError = validatePassword(password);
        if (passwordError) {
          newErrors.password = passwordError;
          setValidationStates(prev => ({ ...prev, password: 'invalid' }));
        } else {
          delete newErrors.password;
          setValidationStates(prev => ({ ...prev, password: 'valid' }));
        }
        break;
        
      case 'confirmPassword':
        if (!confirmPassword) {
          newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
          setValidationStates(prev => ({ ...prev, confirmPassword: 'invalid' }));
        } else if (confirmPassword !== password) {
          newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
          setValidationStates(prev => ({ ...prev, confirmPassword: 'invalid' }));
        } else {
          delete newErrors.confirmPassword;
          setValidationStates(prev => ({ ...prev, confirmPassword: 'valid' }));
        }
        break;
        
      case 'contact':
        const contactError = validateContact(contact);
        if (contactError) {
          newErrors.contact = contactError;
          setValidationStates(prev => ({ ...prev, contact: 'invalid' }));
        } else {
          delete newErrors.contact;
          setValidationStates(prev => ({ ...prev, contact: 'valid' }));
        }
        break;
    }
    
    setErrors(newErrors);
  };

  // Fonction de gestion de l'inscription
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearErrors();

    try {
      const response = await apiService.patientRegister({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim().toLowerCase(),
        mot_de_passe: password,
        contact: contact.trim() || undefined
      });

      if (response.success) {
        Alert.alert(
          'Inscription réussie',
          'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.',
          [
            {
              text: 'Se connecter',
              onPress: async () => {
                // Connexion automatique après inscription
                try {
                  await patientLogin({
                    email: email.trim().toLowerCase(),
                    mot_de_passe: password
                  });
                  if (onRegisterSuccess) {
                    onRegisterSuccess();
                  }
                } catch (error: any) {
                  Alert.alert('Erreur', 'Connexion automatique échouée. Veuillez vous connecter manuellement.');
                }
              }
            },
            {
              text: 'OK',
              onPress: () => {
                if (onBack) {
                  onBack();
                }
              }
            }
          ]
        );
      } else {
        setErrors({ general: response.message || 'Erreur lors de l\'inscription' });
      }
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

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
      setValidationStates(prev => ({ ...prev, password: 'idle' }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
      setValidationStates(prev => ({ ...prev, confirmPassword: 'idle' }));
    }
  };

  const handleContactChange = (text: string) => {
    setContact(text);
    if (errors.contact) {
      setErrors(prev => ({ ...prev, contact: undefined }));
      setValidationStates(prev => ({ ...prev, contact: 'idle' }));
    }
  };

  // Fonctions pour obtenir les couleurs de bordure et d'icône
  const getBorderColor = (field: keyof ValidationStates) => {
    return getValidationBorderColor(validationStates[field], !!errors[field], colors);
  };

  const getIconColor = (field: keyof ValidationStates) => {
    return getValidationIconColor(validationStates[field], !!errors[field], colors);
  };

  return (
    <KeyboardAvoidingView 
      style={patientRegisterStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={patientRegisterStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={patientRegisterStyles.header}>
          <Text style={patientRegisterStyles.title}>Créer un compte</Text>
          <Text style={patientRegisterStyles.subtitle}>
            Rejoignez-nous pour prendre vos rendez-vous en ligne
          </Text>
        </View>

        {/* Formulaire */}
        <View style={patientRegisterStyles.form}>
          {/* Erreur générale */}
          {errors.general && (
            <View style={patientRegisterStyles.errorContainer}>
              <MaterialIcons name="error" size={20} color={colors.error} />
              <Text style={patientRegisterStyles.errorText}>{errors.general}</Text>
            </View>
          )}

          {/* Nom */}
          <View style={patientRegisterStyles.inputContainer}>
            <Text style={patientRegisterStyles.label}>Nom *</Text>
            <View style={[
              patientRegisterStyles.inputWrapper,
              { borderColor: getBorderColor('nom') }
            ]}>
              <MaterialIcons 
                name="person" 
                size={20} 
                color={getIconColor('nom')} 
              />
              <TextInput
                style={patientRegisterStyles.input}
                placeholder="Votre nom"
                value={nom}
                onChangeText={handleNomChange}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
              />
              {validationStates.nom === 'valid' && (
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
              )}
            </View>
            {errors.nom && (
              <Text style={patientRegisterStyles.errorText}>{errors.nom}</Text>
            )}
          </View>

          {/* Prénom */}
          <View style={patientRegisterStyles.inputContainer}>
            <Text style={patientRegisterStyles.label}>Prénom *</Text>
            <View style={[
              patientRegisterStyles.inputWrapper,
              { borderColor: getBorderColor('prenom') }
            ]}>
              <MaterialIcons 
                name="person" 
                size={20} 
                color={getIconColor('prenom')} 
              />
              <TextInput
                style={patientRegisterStyles.input}
                placeholder="Votre prénom"
                value={prenom}
                onChangeText={handlePrenomChange}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
              />
              {validationStates.prenom === 'valid' && (
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
              )}
            </View>
            {errors.prenom && (
              <Text style={patientRegisterStyles.errorText}>{errors.prenom}</Text>
            )}
          </View>

          {/* Email */}
          <View style={patientRegisterStyles.inputContainer}>
            <Text style={patientRegisterStyles.label}>Email *</Text>
            <View style={[
              patientRegisterStyles.inputWrapper,
              { borderColor: getBorderColor('email') }
            ]}>
              <MaterialIcons 
                name="email" 
                size={20} 
                color={getIconColor('email')} 
              />
              <TextInput
                style={patientRegisterStyles.input}
                placeholder="votre.email@exemple.com"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={100}
              />
              {validationStates.email === 'valid' && (
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
              )}
            </View>
            {errors.email && (
              <Text style={patientRegisterStyles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Mot de passe */}
          <View style={patientRegisterStyles.inputContainer}>
            <Text style={patientRegisterStyles.label}>Mot de passe *</Text>
            <View style={[
              patientRegisterStyles.inputWrapper,
              { borderColor: getBorderColor('password') }
            ]}>
              <MaterialIcons 
                name="lock" 
                size={20} 
                color={getIconColor('password')} 
              />
              <TextInput
                style={patientRegisterStyles.input}
                placeholder="Votre mot de passe"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={50}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={patientRegisterStyles.passwordToggle}
              >
                <MaterialIcons 
                  name={showPassword ? "visibility" : "visibility-off"} 
                  size={20}
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={patientRegisterStyles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Confirmation du mot de passe */}
          <View style={patientRegisterStyles.inputContainer}>
            <Text style={patientRegisterStyles.label}>Confirmer le mot de passe *</Text>
            <View style={[
              patientRegisterStyles.inputWrapper,
              { borderColor: getBorderColor('confirmPassword') }
            ]}>
              <MaterialIcons 
                name="lock" 
                size={20} 
                color={getIconColor('confirmPassword')} 
              />
              <TextInput
                style={patientRegisterStyles.input}
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={50}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={patientRegisterStyles.passwordToggle}
              >
                <MaterialIcons 
                  name={showConfirmPassword ? "visibility" : "visibility-off"} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={patientRegisterStyles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Contact (optionnel) */}
          <View style={patientRegisterStyles.inputContainer}>
            <Text style={patientRegisterStyles.label}>Téléphone</Text>
            <View style={[
              patientRegisterStyles.inputWrapper,
              { borderColor: getBorderColor('contact') }
            ]}>
              <MaterialIcons 
                name="phone" 
                size={20} 
                color={getIconColor('contact')} 
              />
              <TextInput
                style={patientRegisterStyles.input}
                placeholder="0612345678"
                value={contact}
                onChangeText={handleContactChange}
                keyboardType="phone-pad"
                maxLength={15}
              />
              {validationStates.contact === 'valid' && (
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
              )}
            </View>
            {errors.contact && (
              <Text style={patientRegisterStyles.errorText}>{errors.contact}</Text>
            )}
          </View>

          {/* Bouton d'inscription */}
          <TouchableOpacity
            style={[
              patientRegisterStyles.registerButton,
              isSubmitting && patientRegisterStyles.registerButtonDisabled
            ]}
            onPress={handleRegister}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={patientRegisterStyles.registerButtonText}>
                Créer mon compte
              </Text>
            )}
          </TouchableOpacity>

          {/* Lien vers la connexion */}
          <View style={patientRegisterStyles.loginLink}>
            <Text style={patientRegisterStyles.loginText}>
              Vous avez déjà un compte ?{' '}
            </Text>
            <TouchableOpacity onPress={onBack}>
              <Text style={patientRegisterStyles.loginLinkText}>
                Se connecter
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PatientRegisterScreen; 