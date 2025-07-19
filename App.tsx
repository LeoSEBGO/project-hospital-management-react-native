/**
 * HosMApp - Application de Suivi Patient
 * 
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import PatientLoginScreen from './src/screens/PatientLoginScreen';
import PatientDashboardScreen from './src/screens/PatientDashboardScreen';

// Composant principal de l'application
const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#2c3e50' : '#fff'}
      />
      {isAuthenticated ? <PatientDashboardScreen /> : <PatientLoginScreen />}
    </View>
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
