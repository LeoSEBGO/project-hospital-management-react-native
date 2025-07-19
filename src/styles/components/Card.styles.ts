import { StyleSheet } from 'react-native';
import { colors, spacing, layout } from '../common';

export const cardStyles = StyleSheet.create({
  // Carte de base
  base: {
    backgroundColor: colors.backgroundWhite,
    borderRadius: layout.borderRadius.lg,
    padding: spacing.lg,
    ...layout.shadow.sm,
  },
  
  // Carte avec ombre moyenne
  elevated: {
    backgroundColor: colors.backgroundWhite,
    borderRadius: layout.borderRadius.lg,
    padding: spacing.lg,
    ...layout.shadow.md,
  },
  
  // Carte avec ombre importante
  prominent: {
    backgroundColor: colors.backgroundWhite,
    borderRadius: layout.borderRadius.xl,
    padding: spacing.xl,
    ...layout.shadow.lg,
  },
  
  // Carte d'information
  info: {
    backgroundColor: colors.backgroundInfo,
    borderRadius: layout.borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: layout.borderWidth.xl,
    borderLeftColor: colors.borderInfo,
  },
  
  // Carte de statut
  status: {
    backgroundColor: colors.backgroundWhite,
    borderRadius: layout.borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: layout.borderWidth.xl,
    ...layout.shadow.sm,
  },
  
  // Carte de service
  service: {
    backgroundColor: colors.backgroundWhite,
    borderRadius: layout.borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
    ...layout.shadow.sm,
  },
  
  // Carte de rendez-vous
  appointment: {
    backgroundColor: colors.backgroundWhite,
    borderRadius: layout.borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
    ...layout.shadow.sm,
  },
  
  // Carte de notification
  notification: {
    backgroundColor: colors.backgroundWhite,
    borderRadius: layout.borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...layout.shadow.sm,
  },
  
  // Carte de notification non lue
  notificationUnread: {
    backgroundColor: colors.backgroundLight,
    borderRadius: layout.borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderLeftWidth: layout.borderWidth.xl,
    borderLeftColor: colors.notificationUnread,
    ...layout.shadow.sm,
  },
});

export default cardStyles; 