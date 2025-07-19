import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getEnvironmentConfig, getApiUrl } from '../config/api';

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PatientLoginRequest {
  email: string;
  mot_de_passe: string;
}

export interface PatientLoginResponse {
  token: string;
  patient: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    contact?: string;
    service_id: number;
    statut_id: number;
    ajoute_par_id?: number;
    ajoute_le: string;
    modifie_le: string;
    created_at: string;
    updated_at: string;
    service?: Service;
    statut?: Statut;
  };
}

export interface Patient {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  contact?: string;
  service_id: number;
  statut_id: number;
  ajoute_par_id?: number;
  ajoute_le: string;
  modifie_le: string;
  created_at: string;
  updated_at: string;
  service?: Service;
  statut?: Statut;
}

export interface Statut {
  id: number;
  nom: 'EN_ATTENTE' | 'EN_CONSULTATION' | 'TERMINE';
  ordre: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface StatutHistorique {
  id: number;
  patient_id: number;
  statut_id: number;
  modifie_par_id?: number;
  modifie_le: string;
  created_at: string;
  updated_at: string;
  statut?: Statut;
  modifie_par?: Staff;
}

export interface Service {
  id: number;
  nom: string;
  description: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  service_id: number;
  created_at: string;
  updated_at: string;
}

export interface RendezVous {
  id: number;
  patient_id: number;
  service_id: number;
  statut_id: number;
  ajoute_par_id?: number;
  modifie_par_id?: number;
  rang: number;
  motif?: string;
  date_rdv?: string;
  actif: boolean;
  ajoute_le: string;
  modifie_le: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  service?: Service;
  statut?: Statut;
}

export interface CreateRendezVousRequest {
  service_id: number;
  date_rendez_vous: string;
  heure_rendez_vous: string;
  commentaire?: string;
}

export interface UpdateRendezVousRequest {
  date_rendez_vous?: string;
  heure_rendez_vous?: string;
  statut?: 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';
  rank?: number;
  commentaire?: string;
}

// Types pour la queue en temps réel
export interface QueuePosition {
  id: number;
  patientId: number;
  patient?: Patient;
  position: number;
  serviceId: number;
  service?: Service;
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  tempsEstime: number; // en minutes
  tempsAttente: number; // en minutes
  createdAt: string;
  updatedAt: string;
}

export interface QueueUpdate {
  type: 'POSITION_CHANGE' | 'STATUS_CHANGE' | 'NEW_PATIENT' | 'PATIENT_FINISHED';
  queuePosition: QueuePosition;
  message: string;
  timestamp: string;
}

export interface QueueStats {
  totalPatients: number;
  averageWaitTime: number; // en minutes
  estimatedWaitTime: number; // en minutes pour le patient actuel
  lastUpdate: string;
}

// Types pour les notifications temps réel
export interface RealTimeNotification {
  id: number;
  patientId: number;
  type: 'STATUT_CHANGE' | 'QUEUE_UPDATE' | 'RENDEZ_VOUS_REMINDER' | 'GENERAL';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;
  private config: any;

  constructor() {
    // Configuration selon l'environnement
    this.config = getEnvironmentConfig();
    this.baseURL = this.config.apiUrl;
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: this.config.timeout,
      headers: API_CONFIG.DEFAULT_HEADERS,
    });

    // Intercepteur pour ajouter le token dauthentification
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('patientToken');
        console.log('Token récupéré:', token ? 'Présent' : 'Absent');
        console.log('URL de la requête:', config.url);
        console.log('Headers:', config.headers);
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Token ajouté aux headers');
        } else {
          console.log('Aucun token trouvé dans AsyncStorage');
        }
        return config;
      },
      (error) => {
        console.log('Erreur dans l\'intercepteur de requête:', error);
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs de réponse
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide
          await AsyncStorage.removeItem('patientToken');
          await AsyncStorage.removeItem('patient');
        }
        return Promise.reject(error);
      }
    );
  }

  // Méthodes d'authentification patient
  async patientLogin(credentials: PatientLoginRequest): Promise<ApiResponse<PatientLoginResponse>> {
    try {
      console.log('[API] Tentative de connexion patient avec:', credentials);
      console.log('[API] URL appelée:', getApiUrl(API_CONFIG.ENDPOINTS.PATIENT_AUTH.LOGIN));
      
      const response = await this.api.post(getApiUrl(API_CONFIG.ENDPOINTS.PATIENT_AUTH.LOGIN), credentials);
      console.log('[API] Réponse reçue:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('[API] Erreur lors de la connexion:', error);
      console.error('[API] Détails de l\'erreur:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      throw this.handleError(error);
    }
  }

  async patientLogout(): Promise<void> {
    await AsyncStorage.removeItem('patientToken');
    await AsyncStorage.removeItem('patient');
  }

  // Méthodes pour les informations du patient connecté (lecture seulement)
  async getPatientById(id: number): Promise<ApiResponse<Patient>> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.PATIENTS.DETAIL(id)));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Récupérer les informations complètes du patient connecté
  async getCurrentPatient(): Promise<ApiResponse<Patient>> {
    try {
      const timestamp = Date.now();
      const response = await this.api.get(getApiUrl(`${API_CONFIG.ENDPOINTS.PATIENTS.ME}?t=${timestamp}`));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Récupérer le statut actuel du patient connecté
  async getPatientStatut(): Promise<any> {
    try {
      const response = await this.api.get(getApiUrl('/patients/me/statut'));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Récupérer l'historique des statuts du patient connecté
  async getPatientStatutHistorique(): Promise<any> {
    try {
      const response = await this.api.get(getApiUrl('/patients/me/statut-historique'));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Méthodes pour les services disponibles (lecture seulement)
  async getServices(): Promise<ApiResponse<Service[]>> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.SERVICES.LIST));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getService(id: number): Promise<ApiResponse<Service>> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.SERVICES.DETAIL(id)));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Méthodes pour les statuts disponibles (lecture seulement)
  async getStatuts(): Promise<ApiResponse<Statut[]>> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.STATUTS.LIST));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getStatutsActifs(): Promise<ApiResponse<Statut[]>> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.STATUTS.ACTIFS));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getStatutById(id: number): Promise<ApiResponse<Statut>> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.STATUTS.DETAIL(id)));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Méthode utilitaire pour gérer les erreurs
  private handleError(error: any): Error {
    if (error.response) {
      // Erreur de réponse du serveur
      const message = error.response.data?.message || 'Erreur de serveur';
      return new Error(message);
    } else if (error.request) {
      // Erreur de réseau
      return new Error('Erreur de connexion réseau');
    } else {
      // Autre erreur
      return new Error(error.message || 'Erreur inconnue');
    }
  }

  // Méthodes pour la queue
  async getQueuePosition(): Promise<ApiResponse<QueuePosition>> {
    try {
      const response = await this.api.get(getApiUrl('/patients/me/queue-position'));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getQueueStats(): Promise<ApiResponse<QueueStats>> {
    try {
      const response = await this.api.get(getApiUrl('/patients/me/queue-stats'));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Méthodes pour les notifications
  async getNotifications(): Promise<ApiResponse<RealTimeNotification[]>> {
    try {
      const response = await this.api.get(getApiUrl('/patients/me/notifications'));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.patch(getApiUrl(`/patients/me/notifications/${notificationId}/read`));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.patch(getApiUrl('/patients/me/notifications/read-all'));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Méthodes pour les rendez-vous
  async getRendezVous(): Promise<ApiResponse<RendezVous[]>> {
    try {
      const response = await this.api.get(getApiUrl('/patients/me/rendez-vous'));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getRendezVousById(id: number): Promise<ApiResponse<RendezVous>> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.RENDEZ_VOUS.DETAIL(id)));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createRendezVous(data: CreateRendezVousRequest): Promise<ApiResponse<RendezVous>> {
    try {
      const response = await this.api.post(getApiUrl(API_CONFIG.ENDPOINTS.RENDEZ_VOUS.CREATE), data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async updateRendezVous(id: number, data: UpdateRendezVousRequest): Promise<ApiResponse<RendezVous>> {
    try {
      const response = await this.api.put(getApiUrl(API_CONFIG.ENDPOINTS.RENDEZ_VOUS.UPDATE(id)), data);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async cancelRendezVous(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.delete(getApiUrl(API_CONFIG.ENDPOINTS.RENDEZ_VOUS.DELETE(id)));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getRendezVousByService(serviceId: number): Promise<ApiResponse<RendezVous[]>> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.RENDEZ_VOUS.BY_SERVICE(serviceId)));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Méthodes pour les staff (lecture seulement pour les patients)
  async getStaffByService(serviceId: number): Promise<ApiResponse<Staff[]>> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.STAFF.BY_SERVICE(serviceId)));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getStaffById(id: number): Promise<ApiResponse<Staff>> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.STAFF.DETAIL(id)));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Méthode pour vérifier la connexion
  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.HEALTH));
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// Instance singleton
export const apiService = new ApiService();
export default apiService; 