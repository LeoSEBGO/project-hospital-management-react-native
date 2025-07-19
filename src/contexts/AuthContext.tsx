import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, PatientLoginRequest, PatientLoginResponse } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  patient: PatientLoginResponse['patient'] | null;
  loading: boolean;
  patientLogin: (credentials: PatientLoginRequest) => Promise<void>;
  patientLogout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const  AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patient, setPatient] = useState<PatientLoginResponse['patient'] | null>(null);
  const [loading, setLoading] = useState(true);

  // Vérifier le statut d'authentification au démarrage
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('patientToken');
      const patientData = await AsyncStorage.getItem('patient');

      if (token && patientData) {
        const parsedPatient = JSON.parse(patientData);
        setPatient(parsedPatient);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setPatient(null);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut d\'auth:', error);
      setIsAuthenticated(false);
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  const patientLogin = async (credentials: PatientLoginRequest) => {
    try {
      setLoading(true);
      // On force le typage pour matcher la réponse réelle de l'API
      const response: any = await apiService.patientLogin(credentials);

      if (response.token && response.patient) {
        const { token, patient } = response;

        await AsyncStorage.setItem('patientToken', token);
        await AsyncStorage.setItem('patient', JSON.stringify(patient));

        setPatient(patient);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.message || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const patientLogout = async () => {
    try {
      setLoading(true);
      await apiService.patientLogout();
      setIsAuthenticated(false);
      setPatient(null);
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    patient,
    loading,
    patientLogin,
    patientLogout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}; 