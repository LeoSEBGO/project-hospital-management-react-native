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
  validateToken: () => Promise<boolean>;
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

  // Validation périodique du token (toutes les 24 heures)
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        validateToken();
      }, 24 * 60 * 60 * 1000); // 24 heures

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('patientToken');

      if (token) {
        // Vérifier le token en récupérant le profil utilisateur
        const response = await apiService.getCurrentPatient();
        
        if (response.success && response.data) {
          // Token valide, mettre à jour les données
          setPatient(response.data);
          await AsyncStorage.setItem('patient', JSON.stringify(response.data));
          setIsAuthenticated(true);
          console.log('[AUTH] Utilisateur authentifié, statut mis à jour');
        } else {
          // Token invalide
          console.log('[AUTH] Token invalide, déconnexion...');
          await handleInvalidToken();
        }
      } else {
        console.log('[AUTH] Aucun token trouvé, utilisateur non authentifié');
        setIsAuthenticated(false);
        setPatient(null);
      }
    } catch (error: any) {
      console.error('[AUTH] Erreur lors de la vérification du statut d\'auth:', error);
      
      // Si c'est une erreur d'authentification, déconnecter
      if (error?.message?.includes('Token invalide') || 
          error?.message?.includes('401') || 
          error?.message?.includes('Unauthorized')) {
        console.log('[AUTH] Erreur d\'authentification, déconnexion...');
        await handleInvalidToken();
      } else {
        // Pour les autres erreurs, on ne déconnecte pas automatiquement
        console.log('[AUTH] Erreur non-authentification, statut non authentifié');
        setIsAuthenticated(false);
        setPatient(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidToken = async () => {
    console.log('[AUTH] Token invalide détecté, déconnexion...');
    try {
      await AsyncStorage.removeItem('patientToken');
      await AsyncStorage.removeItem('patient');
      console.log('[AUTH] Données de stockage nettoyées');
    } catch (error) {
      console.error('[AUTH] Erreur lors du nettoyage du stockage:', error);
    }
    setIsAuthenticated(false);
    setPatient(null);
    console.log('[AUTH] État d\'authentification mis à jour');
  };

  const patientLogin = async (credentials: PatientLoginRequest) => {
    try {
      setLoading(true);
      console.log('[AUTH] Début de connexion avec:', credentials.email);
      
      // On force le typage pour matcher la réponse réelle de l'API
      const response: any = await apiService.patientLogin(credentials);

      if (response.token && response.patient) {
        const { token, patient } = response;
        console.log('[AUTH] Connexion réussie pour:', patient.email);

        // Stocker les données d'authentification
        await AsyncStorage.setItem('patientToken', token);
        await AsyncStorage.setItem('patient', JSON.stringify(patient));

        // Mettre à jour l'état
        setPatient(patient);
        setIsAuthenticated(true);
        
        console.log('[AUTH] État d\'authentification mis à jour');
      } else {
        console.log('[AUTH] Réponse invalide:', response);
        throw new Error(response.message || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('[AUTH] Erreur de connexion:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const patientLogout = async () => {
    try {
      setLoading(true);
      console.log('[AUTH] Début de la déconnexion...');
      
      // Appeler l'API de déconnexion
      await apiService.patientLogout();
      
      // Nettoyer les données locales
      await handleInvalidToken();
      
      console.log('[AUTH] Déconnexion réussie');
    } catch (error) {
      console.error('[AUTH] Erreur de déconnexion:', error);
      // Même en cas d'erreur, nettoyer les données locales
      await handleInvalidToken();
    } finally {
      setLoading(false);
    }
  };

  const validateToken = async (): Promise<boolean> => {
    try {
      console.log('[AUTH] Début de validation du token...');
      const token = await AsyncStorage.getItem('patientToken');
      
      if (!token) {
        console.log('[AUTH] Aucun token trouvé');
        return false;
      }

      console.log('[AUTH] Token trouvé, validation via API...');
      
      // Vérifier le token en récupérant le profil utilisateur
      const response = await apiService.getCurrentPatient();
      
      if (response.success && response.data) {
        // Token valide, mettre à jour les données
        console.log('[AUTH] Token valide, mise à jour des données');
        setPatient(response.data);
        await AsyncStorage.setItem('patient', JSON.stringify(response.data));
        return true;
      } else {
        // Token invalide
        console.log('[AUTH] Token invalide selon la réponse API');
        await handleInvalidToken();
        return false;
      }
    } catch (error: any) {
      console.error('[AUTH] Erreur lors de la validation du token:', error);
      
      // Si c'est une erreur d'authentification, déconnecter
      if (error?.message?.includes('Token invalide') || 
          error?.message?.includes('401') || 
          error?.message?.includes('Unauthorized')) {
        console.log('[AUTH] Erreur d\'authentification détectée');
        await handleInvalidToken();
        return false;
      }
      
      // Pour les autres erreurs, on ne déconnecte pas automatiquement
      console.log('[AUTH] Erreur non-authentification, validation échouée');
      return false;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    patient,
    loading,
    patientLogin,
    patientLogout,
    checkAuthStatus,
    validateToken,
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