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

const PatientLoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { patientLogin, loading } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      console.log('[LOGIN] Tentative avec:', { email, mot_de_passe: password });
      await patientLogin({ email, mot_de_passe: password });
      console.log('[LOGIN] Succès');
    } catch (error: any) {
      console.log('[LOGIN] Erreur:', error);
      Alert.alert('Erreur de connexion', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={patientLoginStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={patientLoginStyles.scrollContainer}>
        <View style={patientLoginStyles.content}>
          <Text style={patientLoginStyles.title}>HosMApp</Text>
          <Text style={patientLoginStyles.subtitle}>Suivi Patient</Text>
          
          <View style={patientLoginStyles.form}>
            <View style={patientLoginStyles.inputContainer}>
              <Text style={patientLoginStyles.label}>Email</Text>
              <View style={patientLoginStyles.inputWrapper}>
                <MaterialIcons name="email" size={20} color="#95a5a6" style={patientLoginStyles.inputIcon} />
                <TextInput
                  style={patientLoginStyles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Entrez votre adresse email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={patientLoginStyles.inputContainer}>
              <Text style={patientLoginStyles.label}>Mot de passe</Text>
              <View style={patientLoginStyles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color="#95a5a6" style={patientLoginStyles.inputIcon} />
                <TextInput
                  style={patientLoginStyles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Entrez votre mot de passe"
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[patientLoginStyles.button, loading && patientLoginStyles.buttonDisabled]}
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