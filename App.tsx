/**
 * HosMApp - Application de Suivi Patient
 * 
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import PatientLoginScreen from './src/screens/PatientLoginScreen';
import PatientRegisterScreen from './src/screens/PatientRegisterScreen';
import PatientDashboardScreen from './src/screens/PatientDashboardScreen';
import {SafeAreaView} from 'react-native';

// Composant principal de l'application
const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login');

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#2c3e50' : '#fff'}
      />
      {isAuthenticated ? (
        <PatientDashboardScreen />
      ) : authScreen === 'login' ? (
        <PatientLoginScreen onNavigateToRegister={() => setAuthScreen('register')} />
      ) : (
        <PatientRegisterScreen onBack={() => setAuthScreen('login')} />
      )}
    </SafeAreaView>
  );
};

// Composant racine avec le provider d'authentification
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default App;
