import { Alert, ToastAndroid, Platform } from 'react-native';

export interface NotificationOptions {
  title?: string;
  message: string;
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export interface ToastOptions {
  message: string;
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export class NotificationService {
  private static instance: NotificationService;
  private toastQueue: ToastOptions[] = [];
  private isShowingToast = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  showAlert(options: NotificationOptions): void {
    const { title = 'Information', message, buttons = [{ text: 'OK' }] } = options;
    
    Alert.alert(title, message, buttons);
  }

  showSuccess(message: string, onPress?: () => void): void {
    this.showAlert({
      title: 'Succès',
      message,
      buttons: [{ text: 'OK', onPress }],
      type: 'success',
    });
  }

  showError(message: string, onPress?: () => void): void {
    this.showAlert({
      title: 'Erreur',
      message,
      buttons: [{ text: 'OK', onPress }],
      type: 'error',
    });
  }

  showWarning(message: string, onPress?: () => void): void {
    this.showAlert({
      title: 'Attention',
      message,
      buttons: [{ text: 'OK', onPress }],
      type: 'warning',
    });
  }

  showConfirmation(
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.showAlert({
      title: 'Confirmation',
      message,
      buttons: [
        { text: 'Annuler', onPress: onCancel, style: 'cancel' },
        { text: 'Confirmer', onPress: onConfirm, style: 'destructive' },
      ],
    });
  }

  showInfo(message: string, onPress?: () => void): void {
    this.showAlert({
      title: 'Information',
      message,
      buttons: [{ text: 'OK', onPress }],
      type: 'info',
    });
  }

  // Méthodes pour les notifications toast (Android)
  showToast(options: ToastOptions): void {
    const { message, duration = 3000, type = 'info' } = options;
    
    if (Platform.OS === 'android') {
      let toastType: number;
      switch (type) {
        case 'success':
          toastType = ToastAndroid.SHORT;
          break;
        case 'error':
          toastType = ToastAndroid.LONG;
          break;
        case 'warning':
          toastType = ToastAndroid.SHORT;
          break;
        default:
          toastType = ToastAndroid.SHORT;
      }
      
      ToastAndroid.show(message, toastType);
    } else {
      // Pour iOS, on utilise une alerte simple
      this.showAlert({
        title: this.getToastTitle(type),
        message,
        duration,
        type,
      });
    }
  }

  showSuccessToast(message: string, duration?: number): void {
    this.showToast({
      message,
      duration,
      type: 'success',
    });
  }

  showErrorToast(message: string, duration?: number): void {
    this.showToast({
      message,
      duration,
      type: 'error',
    });
  }

  showWarningToast(message: string, duration?: number): void {
    this.showToast({
      message,
      duration,
      type: 'warning',
    });
  }

  showInfoToast(message: string, duration?: number): void {
    this.showToast({
      message,
      duration,
      type: 'info',
    });
  }

  private getToastTitle(type: string): string {
    switch (type) {
      case 'success':
        return 'Succès';
      case 'error':
        return 'Erreur';
      case 'warning':
        return 'Attention';
      case 'info':
        return 'Information';
      default:
        return 'Information';
    }
  }

  // Méthode pour gérer les erreurs de manière centralisée
  handleError(error: any, context?: string): void {
    console.error(`[NOTIFICATION_SERVICE] Erreur${context ? ` dans ${context}` : ''}:`, error);
    
    let message = 'Une erreur inattendue s\'est produite';
    
    if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.response?.status) {
      switch (error.response.status) {
        case 401:
          message = 'Session expirée. Veuillez vous reconnecter.';
          break;
        case 403:
          message = 'Accès refusé.';
          break;
        case 404:
          message = 'Ressource non trouvée.';
          break;
        case 500:
          message = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          message = `Erreur ${error.response.status}`;
      }
    }
    
    this.showErrorToast(message);
  }

  // Méthode pour gérer les succès de manière centralisée
  handleSuccess(message: string, showToast: boolean = true): void {
    if (showToast) {
      this.showSuccessToast(message);
    } else {
      this.showSuccess(message);
    }
  }
}

export default NotificationService.getInstance(); 