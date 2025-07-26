import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { apiService, RendezVous } from '../services/api';
import { colors, spacing } from '../styles/common';

interface RendezVousEditScreenProps {
  rendezVous: RendezVous;
  onBack: () => void;
  onRendezVousUpdated?: (updatedRendezVous: RendezVous) => void;
}

const RendezVousEditScreen: React.FC<RendezVousEditScreenProps> = ({ 
  rendezVous, 
  onBack, 
  onRendezVousUpdated 
}) => {
  const [motif, setMotif] = useState(rendezVous.motif || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateRendezVous = async () => {
    if (!motif.trim()) {
      setError('Le motif est requis');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiService.updateRendezVous(rendezVous.id, {
        motif: motif.trim()
      });

      if (response.success) {
        Alert.alert(
          'Rendez-vous mis à jour',
          'Le motif de votre rendez-vous a été mis à jour avec succès.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onRendezVousUpdated && response.data) {
                  onRendezVousUpdated(response.data);
                }
                onBack();
              }
            }
          ]
        );
      } else {
        setError(response.message || 'Erreur lors de la mise à jour du rendez-vous');
      }
    } catch (error: any) {
      setError(error.message || 'Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl }}>
          <TouchableOpacity onPress={onBack} style={{ padding: spacing.sm, marginRight: spacing.md }}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.textPrimary }}>
            Modifier le rendez-vous
          </Text>
        </View>

        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.lg }}>
          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.lg }}>
              Informations du rendez-vous
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <MaterialIcons name="medical-services" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: colors.textLight, marginBottom: 2 }}>Service</Text>
                <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: '600' }}>
                  {rendezVous.service?.nom || 'Service non spécifié'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <MaterialIcons name="event" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: colors.textLight, marginBottom: 2 }}>Date</Text>
                <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: '600' }}>
                  {formatDate(rendezVous.date_rendez_vous || '')}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <MaterialIcons name="schedule" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: colors.textLight, marginBottom: 2 }}>Heure</Text>
                <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: '600' }}>
                  {formatTime(rendezVous.heure_rendez_vous || '')}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <MaterialIcons name="info" size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: colors.textLight, marginBottom: 2 }}>Statut</Text>
                <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: '600', textTransform: 'capitalize' }}>
                  {rendezVous.statut?.nom || 'Statut non défini'}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ marginBottom: spacing.xl }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.lg }}>
              Motif du rendez-vous *
            </Text>
            
            <View style={{ 
              borderWidth: 1,
              borderColor: error ? colors.danger : colors.border,
              borderRadius: 8,
              backgroundColor: colors.white
            }}>
              <TextInput
                value={motif}
                onChangeText={(text) => {
                  setMotif(text);
                  if (error) setError(null);
                }}
                placeholder="Décrivez le motif de votre rendez-vous..."
                style={{ 
                  fontSize: 16, 
                  color: colors.textPrimary,
                  padding: spacing.md,
                  minHeight: 100,
                  textAlignVertical: 'top'
                }}
                multiline
                numberOfLines={4}
                autoCapitalize="sentences"
              />
            </View>
            
            {error && (
              <Text style={{ color: colors.danger, fontSize: 14, marginTop: spacing.xs }}>
                {error}
              </Text>
            )}
          </View>

          <View style={{ 
            backgroundColor: colors.backgroundInfo, 
            padding: spacing.md, 
            borderRadius: 8, 
            marginBottom: spacing.lg 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <MaterialIcons name="info" size={20} color={colors.info} style={{ marginRight: spacing.sm, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.info, fontSize: 14, fontWeight: '600', marginBottom: spacing.xs }}>
                  Note importante
                </Text>
                <Text style={{ color: colors.info, fontSize: 14 }}>
                  Seul le motif de votre rendez-vous peut être modifié. 
                  Pour changer la date, l'heure ou le service, veuillez annuler ce rendez-vous 
                  et en créer un nouveau.
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={{ 
              backgroundColor: colors.primary, 
              paddingVertical: spacing.md, 
              borderRadius: 8, 
              alignItems: 'center',
              opacity: isSubmitting ? 0.7 : 1
            }}
            onPress={handleUpdateRendezVous}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: spacing.sm }} />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  Mettre à jour le rendez-vous
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RendezVousEditScreen; 