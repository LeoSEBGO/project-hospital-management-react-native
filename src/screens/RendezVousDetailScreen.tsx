import React, { useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { RendezVous } from '../services/api';
import styles from '../styles/screens/RendezVousDetailScreen.styles';
import { realtimeService } from '../services/realtime';
import apiService from '../services/api';

interface RendezVousDetailScreenProps {
  rendezVous: RendezVous;
  onBack: () => void;
}

const RendezVousDetailScreen: React.FC<RendezVousDetailScreenProps> = ({ 
  rendezVous, 
  onBack 
}) => {
  const rendezVousId = rendezVous.id;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return '#f39c12';
      case 'CONFIRME':
        return '#27ae60';
      case 'ANNULE':
        return '#e74c3c';
      case 'TERMINE':
        return '#95a5a6';
      default:
        return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'CONFIRME':
        return 'Confirmé';
      case 'ANNULE':
        return 'Annulé';
      case 'TERMINE':
        return 'Terminé';
      default:
        return 'Inconnu';
    }
  };

  const handleCancelRendezVous = () => {
    Alert.alert(
      'Annuler le rendez-vous',
      'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
      [
        { text: 'Non', style: 'cancel' },
        { 
          text: 'Oui, annuler', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`[RENDEZ_VOUS_DETAIL] Tentative d'annulation du rendez-vous ${rendezVous.id}`);
              
              const response = await apiService.cancelRendezVous(rendezVous.id, 'Annulé par le patient');
              
              if (response.success) {
                Alert.alert(
                  'Succès', 
                  'Rendez-vous annulé avec succès',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        console.log('[RENDEZ_VOUS_DETAIL] Retour à la liste après annulation');
                        onBack();
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Erreur', response.message || 'Impossible d\'annuler le rendez-vous');
              }
            } catch (error: any) {
              console.error('[RENDEZ_VOUS_DETAIL] Erreur lors de l\'annulation:', error);
              
              let errorMessage = 'Erreur lors de l\'annulation du rendez-vous';
              
              if (error.message) {
                if (error.message.includes('déjà été annulé')) {
                  errorMessage = 'Ce rendez-vous a déjà été annulé';
                } else if (error.message.includes('pas autorisé')) {
                  errorMessage = 'Vous n\'êtes pas autorisé à annuler ce rendez-vous';
                } else if (error.message.includes('ne peut pas être annulé')) {
                  errorMessage = error.message;
                } else if (error.message.includes('connexion réseau')) {
                  errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
                } else {
                  errorMessage = error.message;
                }
              }
              
              Alert.alert('Erreur', errorMessage);
            }
          }
        },
      ]
    );
  };

  useEffect(() => {
    // Écouter les mises à jour temps réel
    const handleRendezVousUpdate = (update: any) => {
      console.log('[RENDEZ_VOUS_DETAIL] Mise à jour reçue:', update);
      
      // Si c'est la mise à jour de ce rendez-vous spécifique
      if (update.rendezVousId === rendezVousId) {
        // Recharger les données du rendez-vous
        // loadRendezVousData(); // This function is not defined in the original file
        
        // Afficher une notification
        Alert.alert(
          'Mise à jour de rendez-vous',
          update.message || 'Votre rendez-vous a été mis à jour',
          [{ text: 'OK' }]
        );
      }
    };

    const handleNotification = (notification: any) => {
      console.log('[RENDEZ_VOUS_DETAIL] Notification reçue:', notification);
      
      if (notification.type === 'RENDEZ_VOUS_UPDATE' && 
          notification.data?.rendezVousId === rendezVousId) {
        // Recharger les données
        // loadRendezVousData(); // This function is not defined in the original file
        
        // Afficher une notification
        Alert.alert(
          notification.title || 'Mise à jour',
          notification.message,
          [{ text: 'OK' }]
        );
      }
    };

    // S'abonner aux événements
    realtimeService.on('RENDEZ_VOUS_UPDATE', handleRendezVousUpdate);
    realtimeService.on('NOTIFICATION', handleNotification);

    // Nettoyer les écouteurs
    return () => {
      realtimeService.off('RENDEZ_VOUS_UPDATE', handleRendezVousUpdate);
      realtimeService.off('NOTIFICATION', handleNotification);
    };
  }, [rendezVousId]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#3498db" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du rendez-vous</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statut du rendez-vous */}
        <View style={styles.section}>
          <View style={[styles.statusCard, { backgroundColor: getStatusColor(rendezVous.statut?.nom || '') }]}>
            <MaterialIcons name="event" size={32} color="#fff" />
            <Text style={styles.statusTitle}>{getStatusText(rendezVous.statut?.nom || '')}</Text>
            <Text style={styles.statusSubtitle}>
              Rendez-vous #{rendezVous.id}
            </Text>
          </View>
        </View>

        {/* Informations du service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="local-hospital" size={20} color="#3498db" />
              <Text style={styles.infoLabel}>Service:</Text>
              <Text style={styles.infoValue}>{rendezVous.service?.nom || 'Service inconnu'}</Text>
            </View>
            {rendezVous.service?.description && (
              <View style={styles.infoRow}>
                <MaterialIcons name="description" size={20} color="#3498db" />
                <Text style={styles.infoLabel}>Description:</Text>
                <Text style={styles.infoValue}>{rendezVous.service.description}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Date et heure */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date et heure</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="event" size={20} color="#3498db" />
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>
                {rendezVous.date_rendez_vous ? formatDate(rendezVous.date_rendez_vous) : 'Date à définir'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={20} color="#3498db" />
              <Text style={styles.infoLabel}>Heure:</Text>
              <Text style={styles.infoValue}>
                {rendezVous.heure_rendez_vous ? rendezVous.heure_rendez_vous : 'Non spécifiée'}
              </Text>
            </View>
          </View>
        </View>

        {/* Position dans la file */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Position</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="queue" size={20} color="#3498db" />
              <Text style={styles.infoLabel}>Rang:</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{rendezVous.rang}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Commentaire */}
        {rendezVous.motif && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Motif de consultation</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialIcons name="note" size={20} color="#3498db" />
                <Text style={styles.infoLabel}>Motif:</Text>
              </View>
              <Text style={styles.commentText}>{rendezVous.motif}</Text>
            </View>
          </View>
        )}

        {/* Informations de création */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={20} color="#3498db" />
              <Text style={styles.infoLabel}>Créé le:</Text>
              <Text style={styles.infoValue}>
                {formatDate(rendezVous.created_at)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="update" size={20} color="#3498db" />
              <Text style={styles.infoLabel}>Modifié le:</Text>
              <Text style={styles.infoValue}>
                {formatDate(rendezVous.updated_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {(rendezVous.statut?.nom === 'EN_ATTENTE' || rendezVous.statut?.nom === 'EN_CONSULTATION') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelRendezVous}
            >
              <MaterialIcons name="cancel" size={20} color="#fff" />
              <Text style={styles.cancelButtonText}>Annuler le rendez-vous</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default RendezVousDetailScreen; 