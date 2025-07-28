import { Platform } from 'react-native';

// Configuration de l'API
export const API_CONFIG = {
  // URL de base de l'API
  BASE_URL: __DEV__ 
    ? 'http://172.100.0.106:3000/api'  // Pour développement local
    : 'http://localhost:3000/api',

  // Timeout des requêtes (en millisecondes)
  TIMEOUT: 10000,

  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },

  // Configuration CORS pour le développement
  CORS_CONFIG: {
    origin: '*',
    credentials: true,
  },

  // Endpoints de l'API
  ENDPOINTS: {
    // Authentification staff/admin
    AUTH: {
      LOGIN: '/auth/login',
      PROFILE: '/auth/profile',
      CHANGE_PASSWORD: '/auth/change-password',
      CREATE_STAFF: '/auth/staff',
    },
    // Authentification patient
    PATIENT_AUTH: {
      LOGIN: '/auth-patient/login',
      REGISTER: '/auth-patient/register',
    },
    // Patients
    PATIENTS: {
      LIST: '/patients',
      DETAIL: (id: string|number) => `/patients/${id}`,
      ME: '/mobile-app-patient/me',
      PROFILE: '/mobile-app-patient/me/profile',
      VALIDATE_PASSWORD: '/mobile-app-patient/me/validate-password',
      PASSWORD: '/mobile-app-patient/me/password',
      CREATE: '/patients',
      UPDATE: (id: string|number) => `/patients/${id}`,
      CHANGE_STATUS: '/patients/change-status',
      DELETE: (id: string|number) => `/patients/${id}`,
    },
    // Services
    SERVICES: {
      LIST: '/mobile-app-patient/services',
      DETAIL: (id: string|number) => `/mobile-app-patient/services/${id}`,
      CREATE: '/services',
      UPDATE: (id: string|number) => `/services/${id}`,
      DELETE: (id: string|number) => `/services/${id}`,
    },
    // Statuts
    STATUTS: {
      LIST: '/statuts',
      ACTIFS: '/statuts/actifs',
      DETAIL: (id: string|number) => `/statuts/${id}`,
      CREATE: '/statuts',
      UPDATE: (id: string|number) => `/statuts/${id}`,
      DELETE: (id: string|number) => `/statuts/${id}`,
    },
    // Rendez-vous
    RENDEZ_VOUS: {
      LIST: '/mobile-app-patient/me/rendez-vous',
      DETAIL: (id: string|number) => `/mobile-app-patient/me/rendez-vous/${id}`,
      CREATE: '/mobile-app-patient/me/rendez-vous',
      UPDATE: (id: string|number) => `/mobile-app-patient/me/rendez-vous/${id}`,
      DELETE: (id: string|number) => `/mobile-app-patient/me/rendez-vous/${id}`,
      BY_SERVICE: (serviceId: string|number) => `/mobile-app-patient/rendez-vous/service/${serviceId}`,
      HISTORIQUE: '/mobile-app-patient/rendez-vous/historique',
      HORAIRES_DISPONIBLES: (serviceId: string|number) => `/mobile-app-patient/horaires-disponibles/${serviceId}`,
      DATES_OCCUPEES: (serviceId: string|number) => `/mobile-app-patient/dates-occupees/${serviceId}`,
    },
    // Staff
    STAFF: {
      LIST: '/staff',
      DETAIL: (id: string|number) => `/staff/${id}`,
      CREATE: '/staff',
      UPDATE: (id: string|number) => `/staff/${id}`,
      DELETE: (id: string|number) => `/staff/${id}`,
      BY_SERVICE: (serviceId: string|number) => `/staff/service/${serviceId}`,
    },
    // Notifications
    NOTIFICATIONS: {
      LIST: '/mobile-app-patient/notifications/me',
      MARK_READ: (id: string|number) => `/mobile-app-patient/notifications/me/${id}/read`,
      MARK_ALL_READ: '/mobile-app-patient/notifications/me/read-all',
      DELETE: (id: string|number) => `/notifications/me/${id}`,
      DELETE_ALL: '/notifications/me',
    },
    // Queue
    QUEUE: {
      POSITION: (serviceId: string|number) => `/mobile-app-patient/queue/position/${serviceId}`,
      STATS: (serviceId: string|number) => `/mobile-app-patient/queue/stats/${serviceId}`,
      UPDATE_RANKS: '/mobile-app-patient/queue/update-ranks',
      JOIN: '/mobile-app-patient/queue/join',
      LEAVE: '/mobile-app-patient/queue/leave',
    },
    // Staff (pour compatibilité, mais non implémenté pour mobile)
    STAFF_MOBILE: {
      BY_SERVICE: (serviceId: string|number) => `/mobile-app-patient/staff/service/${serviceId}`,
      BY_ID: (id: string|number) => `/mobile-app-patient/staff/${id}`,
    },
    // Divers
    HEALTH: '/health', // à appeler sans /api devant
    ROOT: '/',
  },

  // Messages d'erreur personnalisés
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Erreur de connexion réseau. Vérifiez votre connexion internet.',
    TIMEOUT_ERROR: 'La requête a pris trop de temps. Veuillez réessayer.',
    SERVER_ERROR: 'Erreur du serveur. Veuillez réessayer plus tard.',
    UNAUTHORIZED: 'Vous n\'êtes pas autorisé à accéder à cette ressource.',
    NOT_FOUND: 'La ressource demandée n\'a pas été trouvée.',
    VALIDATION_ERROR: 'Les données fournies sont invalides.',
    PATIENT_NOT_FOUND: 'Patient non trouvé. Vérifiez votre email et mot de passe.',
    INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
    QUEUE_NOT_FOUND: 'Vous n\'êtes pas dans la file d\'attente.',
    QUEUE_FULL: 'La file d\'attente est pleine. Veuillez réessayer plus tard.',
  },

  // Codes de statut HTTP importants
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },
};

// Fonction pour obtenir l'URL complète d'un endpoint
export const getApiUrl = (endpoint: string): string => {
  // Pour le health check, il faut retirer /api
  if (endpoint === '/health' || endpoint === '/') {
    return API_CONFIG.BASE_URL.replace('/api', '') + endpoint;
  }
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Fonction pour vérifier si l'application est en mode développement
export const isDevelopment = (): boolean => {
  return __DEV__;
};

// Fonction pour obtenir la configuration selon l'environnement
export const getEnvironmentConfig = () => {
  let apiUrl = API_CONFIG.BASE_URL;
  
  if (isDevelopment()) {
    if (Platform.OS === 'android') {
      apiUrl = 'http://10.0.2.2:3000/api';
    } else if (Platform.OS === 'ios') {
      apiUrl = 'http://localhost:3000/api';
    } else {
      apiUrl = 'http://localhost:3000/api';
    }
  }
  
  return {
    apiUrl,
    timeout: API_CONFIG.TIMEOUT,
    enableLogging: isDevelopment(),
  };
}; 