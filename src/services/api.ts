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
  date_rendez_vous?: string;
  heure_rendez_vous?: string;
  actif: boolean;
  ajoute_le: string;
  modifie_le: string;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  service?: Service;
  statut?: Statut;
}

export interface RendezVousHistorique {
  id: number;
  rendez_vous_id: number;
  patient_id: number;
  service_id: number;
  statut_id: number;
  ajoute_par_id?: number;
  modifie_par_id?: number;
  rang: number;
  motif?: string;
  date_rendez_vous?: string;
  heure_rendez_vous?: string;
  actif: boolean;
  action: 'CREATED' | 'UPDATED' | 'CANCELLED' | 'COMPLETED';
  commentaire?: string;
  created_at: string;
  updated_at: string;
  service?: Service;
  statut?: Statut;
}

export interface CreateRendezVousRequest {
  service_id: number;
  date_rendez_vous: string;
  heure_rendez_vous: string;
  motif?: string;
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
  id: string;
  patientId: number;
  position: number;
  serviceId: number;
  service: {
    id: number;
    nom: string;
    description: string;
  };
  statut: string;
  tempsEstime: number; // en minutes
  tempsAttente: number; // en minutes
  heureRendezVous: string;
  minutesRestantes: number;
  totalPatients: number;
  createdAt: string;
  updatedAt: string;
}

export interface QueueData {
  date: string;
  totalRendezVous: number;
  positions: QueuePosition[];
  resume: {
    prochainRendezVous: QueuePosition;
    totalPatientsEnAttente: number;
    tempsAttenteTotal: number;
  };
}

export interface QueueUpdate {
  type: 'POSITION_CHANGE' | 'STATUS_CHANGE' | 'NEW_PATIENT' | 'PATIENT_FINISHED';
  queueData: QueueData;
  message: string;
  timestamp: string;
}

export interface QueueStats {
  date: string;
  totalRendezVous: number;
  totalPatientsGlobal: number;
  averageWaitTimeGlobal: number;
  totalWaitTime: number;
  lastUpdate: string;
  services: Array<{
    serviceId: number;
    serviceName: string;
    totalPatients: number;
    averageWaitTime: number;
    estimatedWaitTime: number;
    patientPosition: number;
    heureRendezVous: string;
    statut: string;
  }>;
  resume: {
    prochainRendezVous: any;
    servicesAvecPlusDAttente: any[];
  };
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
  updatedAt: string;
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
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.PATIENTS.ME));
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
  async getQueuePosition(): Promise<ApiResponse<QueueData>> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.QUEUE.POSITION));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getQueueStats(): Promise<ApiResponse<QueueStats>> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.QUEUE.STATS));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Rejoindre la file d'attente
  async joinQueue(): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.post(getApiUrl(API_CONFIG.ENDPOINTS.QUEUE.JOIN));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Quitter la file d'attente
  async leaveQueue(): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.post(getApiUrl(API_CONFIG.ENDPOINTS.QUEUE.LEAVE));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Méthodes pour les notifications
  async getNotifications(): Promise<ApiResponse<RealTimeNotification[]>> {
    try {
      const response = await this.api.get(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.LIST));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.patch(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId)));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.patch(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ));
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

  async getRendezVousActifs(): Promise<ApiResponse<RendezVous[]>> {
    try {
      const response = await this.api.get(getApiUrl('/patients/me/rendez-vous/actifs'));
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getHorairesDisponibles(serviceId: number, date: string): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(getApiUrl('/patients/me/rendez-vous/horaires-disponibles'), {
        params: {
          service_id: serviceId,
          date_rendez_vous: date
        }
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getDatesOccupees(serviceId: number): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.get(getApiUrl('/patients/me/rendez-vous/dates-occupees'), {
        params: {
          service_id: serviceId
        }
      });
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

  async cancelRendezVous(id: number, raison?: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.delete(getApiUrl(API_CONFIG.ENDPOINTS.RENDEZ_VOUS.DELETE(id)), {
        data: { raison_annulation: raison }
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Récupérer l'historique des rendez-vous
  async getRendezVousHistorique(): Promise<ApiResponse<RendezVousHistorique[]>> {
    try {
      const response = await this.api.get(getApiUrl('/rendez-vous/historique'));
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