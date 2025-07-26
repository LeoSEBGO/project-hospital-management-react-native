import { Alert } from 'react-native';

export interface NotificationOptions {
  title?: string;
  message: string;
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
}

export class NotificationService {
  private static instance: NotificationService;

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
    });
  }

  showError(message: string, onPress?: () => void): void {
    this.showAlert({
      title: 'Erreur',
      message,
      buttons: [{ text: 'OK', onPress }],
    });
  }

  showWarning(message: string, onPress?: () => void): void {
    this.showAlert({
      title: 'Attention',
      message,
      buttons: [{ text: 'OK', onPress }],
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
    });
  }
}

export default NotificationService.getInstance(); 