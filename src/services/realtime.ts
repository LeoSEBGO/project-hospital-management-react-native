import { apiService, QueueUpdate, RealTimeNotification, Statut } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import notificationService from './notificationService';

// Types pour les événements temps réel
export interface RealtimeEvent {
  type: 'QUEUE_UPDATE' | 'STATUT_CHANGE' | 'NOTIFICATION' | 'HEARTBEAT' | 'CONNECTION_CONFIRMED' | 'HEARTBEAT_RESPONSE' | 'RENDEZ_VOUS_UPDATE' | 'GENERAL_NOTIFICATION';
  data: any;
  timestamp: string;
}

export interface RealtimeConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

class RealtimeService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private listeners: Map<string, Function[]> = new Map();
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  
  private config: RealtimeConfig = {
    url: __DEV__ 
      ? API_CONFIG.BASE_URL.replace('http://', 'ws://').replace('/api', '') + '/ws'
      : API_CONFIG.BASE_URL.replace('http://', 'wss://').replace('/api', '') + '/ws',
    reconnectInterval: 5000, // 5 secondes
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000, // 30 secondes
  };

  // Événements supportés
  private readonly EVENTS = {
    QUEUE_UPDATE: 'queue_update',
    STATUT_CHANGE: 'statut_change',
    NOTIFICATION: 'notification',
    RENDEZ_VOUS_UPDATE: 'rendez_vous_update',
    CONNECTION_OPEN: 'connection_open',
    CONNECTION_CLOSE: 'connection_close',
    CONNECTION_ERROR: 'connection_error',
  };

  constructor() {
    // Initialisation du service
  }

  // Connexion au WebSocket
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('[REALTIME] Connexion déjà en cours ou établie');
      return;
    }

    try {
      this.isConnecting = true;
      this.connectionStatus = 'connecting';
      
      // Obtenir le token d'authentification
      const token = await this.getAuthToken();
      if (!token) {
        console.log('[REALTIME] Pas de token disponible, connexion annulée');
        this.isConnecting = false;
        this.connectionStatus = 'error';
        notificationService.showWarningToast('Connexion temps réel impossible : session expirée');
        return;
      }

      console.log('[REALTIME] Tentative de connexion avec token...');
      
      // Créer la connexion WebSocket avec le token
      const wsUrl = __DEV__ 
        ? 'ws://10.208.186.231:3000/ws'
        : 'wss://10.208.186.231:3000/ws';
      
      this.ws = new WebSocket(`${wsUrl}?token=${token}`);
      
      console.log('[REALTIME] Tentative de connexion à:', wsUrl);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = (event: any) => this.handleMessage(event);
      this.ws.onclose = (event: any) => this.handleClose(event);
      this.ws.onerror = this.handleError.bind(this);

    } catch (error) {
      console.error('[REALTIME] Erreur de connexion WebSocket:', error);
      this.isConnecting = false;
      this.connectionStatus = 'error';
      notificationService.handleError(error, 'connexion WebSocket');
      this.scheduleReconnect();
    }
  }

  // Déconnexion
  disconnect(): void {
    console.log('[REALTIME] Déconnexion WebSocket...');
    this.clearTimers();
    this.connectionStatus = 'disconnected';
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    console.log('[REALTIME] Déconnexion terminée');
  }

  // Gestion de l'ouverture de connexion
  private handleOpen(): void {
    console.log('[REALTIME] Connexion WebSocket établie');
    this.isConnecting = false;
    this.connectionStatus = 'connected';
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.emit(this.EVENTS.CONNECTION_OPEN);
    
    // Envoyer un message de test pour vérifier la connexion
    this.sendHeartbeat();
    
    // Notifier l'utilisateur de la connexion réussie
    notificationService.showSuccessToast('Connexion temps réel établie');
  }

  // Gestion des messages reçus
  private handleMessage(event: MessageEvent): void {
    try {
      const data: RealtimeEvent = JSON.parse(event.data);
      console.log('[REALTIME] Message reçu:', data);
      
      switch (data.type) {
        case 'QUEUE_UPDATE':
          console.log('[REALTIME] Mise à jour de la file d\'attente:', data.data);
          this.emit(this.EVENTS.QUEUE_UPDATE, data.data as QueueUpdate);
          break;
        case 'STATUT_CHANGE':
          console.log('[REALTIME] Changement de statut:', data.data);
          this.emit(this.EVENTS.STATUT_CHANGE, data.data as Statut);
          break;
        case 'NOTIFICATION':
          console.log('[REALTIME] Nouvelle notification:', data.data);
          this.emit(this.EVENTS.NOTIFICATION, data.data as RealTimeNotification);
          break;
        case 'HEARTBEAT':
          console.log('[REALTIME] Heartbeat reçu, réponse...');
          this.sendHeartbeat();
          break;
        case 'CONNECTION_CONFIRMED':
          console.log('[REALTIME] Connexion WebSocket confirmée par le serveur');
          this.emit(this.EVENTS.CONNECTION_OPEN);
          break;
        case 'HEARTBEAT_RESPONSE':
          console.log('[REALTIME] Heartbeat confirmé par le serveur');
          break;
        case 'RENDEZ_VOUS_UPDATE':
          console.log('[REALTIME] Mise à jour de rendez-vous:', data.data);
          this.emit(this.EVENTS.RENDEZ_VOUS_UPDATE, data.data);
          break;
        case 'GENERAL_NOTIFICATION':
          console.log('[REALTIME] Notification générale:', data.data);
          this.emit(this.EVENTS.NOTIFICATION, data.data as RealTimeNotification);
          break;
        default:
          console.warn('[REALTIME] Type d\'événement inconnu:', data.type);
      }
    } catch (error) {
      console.error('[REALTIME] Erreur lors du parsing du message:', error);
      notificationService.handleError(error, 'parsing message WebSocket');
    }
  }

  // Gestion de la fermeture de connexion
  private async handleClose(event: CloseEvent): Promise<void> {
    console.log('[REALTIME] Connexion WebSocket fermée:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    
    this.clearTimers();
    this.isConnecting = false;
    this.connectionStatus = 'disconnected';
    this.emit(this.EVENTS.CONNECTION_CLOSE, event);
    
    // Tenter de se reconnecter si ce n'est pas une fermeture volontaire
    if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      console.log(`[REALTIME] Fermeture non volontaire (code: ${event.code}), tentative de reconnexion`);
      
      // Vérifier si l'utilisateur est toujours authentifié avant de tenter la reconnexion
      const token = await this.getAuthToken();
      if (token) {
        this.scheduleReconnect();
      } else {
        console.log('[REALTIME] Pas de token disponible, reconnexion annulée');
        notificationService.showWarningToast('Connexion temps réel perdue : session expirée');
      }
    } else if (event.code === 1000) {
      console.log('[REALTIME] Fermeture volontaire, pas de reconnexion');
      notificationService.showInfoToast('Connexion temps réel fermée');
    } else {
      console.log(`[REALTIME] Code de fermeture: ${event.code}, pas de reconnexion`);
      notificationService.showWarningToast('Connexion temps réel perdue');
    }
  }

  // Gestion des erreurs
  private handleError(error: Event): void {
    console.error('[REALTIME] Erreur WebSocket:', {
      type: error.type,
      target: error.target,
      timeStamp: error.timeStamp
    });
    
    // Réinitialiser l'état de connexion
    this.isConnecting = false;
    this.connectionStatus = 'error';
    
    // Déterminer le type d'erreur
    let errorMessage = 'Erreur WebSocket inconnue';
    if (error.type === 'error') {
      errorMessage = 'Impossible de se connecter au serveur WebSocket. Vérifiez que le serveur est démarré.';
    }
    
    this.emit(this.EVENTS.CONNECTION_ERROR, { error, message: errorMessage });
    
    // Notifier l'utilisateur de l'erreur
    notificationService.showErrorToast(errorMessage);
    
    // Si c'est une erreur de connexion, tenter de se reconnecter
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      console.log(`[REALTIME] Tentative de reconnexion après erreur (${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})`);
      this.scheduleReconnect();
    } else {
      console.log('[REALTIME] Nombre maximum de tentatives atteint, arrêt des reconnexions');
      notificationService.showErrorToast('Impossible de rétablir la connexion temps réel');
    }
  }

  // Programmer une tentative de reconnexion
  private async scheduleReconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.log('[REALTIME] Nombre maximum de tentatives atteint, arrêt des reconnexions');
      return;
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      console.log(`[REALTIME] Tentative de reconnexion ${this.reconnectAttempts}/${this.config.maxReconnectAttempts} dans ${this.config.reconnectInterval}ms`);
      
      // Vérifier si l'utilisateur est toujours authentifié avant de tenter la reconnexion
      const token = await this.getAuthToken();
      if (!token) {
        console.log('[REALTIME] Pas de token disponible, reconnexion annulée');
        return;
      }
      
      // Vérifier que la connexion n'est pas déjà établie
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log('[REALTIME] Connexion déjà établie, reconnexion annulée');
        return;
      }
      
      console.log('[REALTIME] Démarrage de la reconnexion...');
      this.connect();
    }, this.config.reconnectInterval);
  }

  // Démarrer le heartbeat
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  // Envoyer un heartbeat
  private sendHeartbeat(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'HEARTBEAT',
        timestamp: new Date().toISOString(),
      }));
    }
  }

  // Nettoyer les timers
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Obtenir le token d'authentification
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('patientToken');
    } catch (error) {
      console.error('[REALTIME] Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  // Écouter un événement
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // Arrêter d'écouter un événement
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Émettre un événement
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Erreur dans le callback:', error);
          notificationService.handleError(error, 'callback événement temps réel');
        }
      });
    }
  }

  // Vérifier si la connexion est active
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Obtenir le statut de la connexion
  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  // Configurer le service
  configure(config: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Tester la connexion WebSocket
  async testConnection(): Promise<boolean> {
    try {
      console.log('[REALTIME] Test de connexion WebSocket...');
      
      // Vérifier si on a un token
      const token = await this.getAuthToken();
      if (!token) {
        console.log('[REALTIME] Pas de token disponible pour le test');
        return false;
      }

      // Si pas connecté, tenter la connexion
      if (!this.isConnected()) {
        await this.connect();
        
        // Attendre un peu pour voir si la connexion s'établit
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            const connected = this.isConnected();
            console.log('[REALTIME] Test de connexion terminé, connecté:', connected);
            resolve(connected);
          }, 3000);

          const checkConnection = () => {
            if (this.isConnected()) {
              clearTimeout(timeout);
              console.log('[REALTIME] Connexion WebSocket établie avec succès');
              resolve(true);
            } else if (this.getConnectionStatus() === 'connecting') {
              setTimeout(checkConnection, 100);
            } else {
              clearTimeout(timeout);
              console.log('[REALTIME] Échec de la connexion WebSocket');
              resolve(false);
            }
          };
          
          checkConnection();
        });
      }

      const connected = this.isConnected();
      console.log('[REALTIME] Déjà connecté:', connected);
      return connected;
    } catch (error) {
      console.error('[REALTIME] Erreur lors du test de connexion:', error);
      notificationService.handleError(error, 'test connexion WebSocket');
      return false;
    }
  }

  // Obtenir des informations de débogage
  getDebugInfo(): any {
    return {
      connectionStatus: this.getConnectionStatus(),
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      config: this.config,
      listeners: Array.from(this.listeners.keys()),
    };
  }
}

// Instance singleton
export const realtimeService = new RealtimeService();
export default realtimeService; 