import { apiService, QueueUpdate, RealTimeNotification, Statut } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
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
      return;
    }

    try {
      this.isConnecting = true;
      
      // Obtenir le token d'authentification
      const token = await this.getAuthToken();
      if (!token) {
        console.log('[REALTIME] Pas de token disponible, connexion annulée');
        this.isConnecting = false;
        return;
      }

      console.log('[REALTIME] Tentative de connexion avec token...');
      
      // Créer la connexion WebSocket avec le token
      this.ws = new WebSocket(`${this.config.url}?token=${token}`);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = (event: any) => this.handleMessage(event);
      this.ws.onclose = (event: any) => this.handleClose(event);
      this.ws.onerror = this.handleError.bind(this);

    } catch (error) {
      console.error('Erreur de connexion WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  // Déconnexion
  disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Gestion de l'ouverture de connexion
  private handleOpen(): void {
    console.log('Connexion WebSocket établie');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.emit(this.EVENTS.CONNECTION_OPEN);
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
    }
  }

  // Gestion de la fermeture de connexion
  private async handleClose(event: CloseEvent): Promise<void> {
    console.log('[REALTIME] Connexion WebSocket fermée:', event.code, event.reason);
    this.clearTimers();
    this.emit(this.EVENTS.CONNECTION_CLOSE, event);
    
    // Tenter de se reconnecter si ce n'est pas une fermeture volontaire
    if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      // Vérifier si l'utilisateur est toujours authentifié avant de tenter la reconnexion
      const token = await this.getAuthToken();
      if (token) {
        this.scheduleReconnect();
      } else {
        console.log('[REALTIME] Pas de token disponible, reconnexion annulée');
      }
    }
  }

  // Gestion des erreurs
  private handleError(error: Event): void {
    console.error('Erreur WebSocket:', error);
    this.emit(this.EVENTS.CONNECTION_ERROR, error);
  }

  // Programmer une tentative de reconnexion
  private async scheduleReconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      console.log(`[REALTIME] Tentative de reconnexion ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
      
      // Vérifier si l'utilisateur est toujours authentifié avant de tenter la reconnexion
      const token = await this.getAuthToken();
      if (!token) {
        console.log('[REALTIME] Pas de token disponible, reconnexion annulée');
        return;
      }
      
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
      console.error('Erreur lors de la récupération du token:', error);
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
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }

  // Configurer le service
  configure(config: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Instance singleton
export const realtimeService = new RealtimeService();
export default realtimeService; 