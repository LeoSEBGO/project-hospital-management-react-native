import { StyleSheet } from 'react-native';
import { colors, typography, spacing, layout } from '../common';

export const buttonStyles = StyleSheet.create({
  // Bouton principal
  primary: {
    backgroundColor: colors.primary,
    borderRadius: layout.borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Bouton secondaire
  secondary: {
    backgroundColor: colors.backgroundWhite,
    borderWidth: layout.borderWidth.sm,
    borderColor: colors.primary,
    borderRadius: layout.borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Bouton de danger
  danger: {
    backgroundColor: colors.danger,
    borderRadius: layout.borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Bouton désactivé
  disabled: {
    backgroundColor: colors.textLight,
    borderRadius: layout.borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Bouton petit
  small: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: layout.borderRadius.sm,
  },
  
  // Bouton moyen
  medium: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderRadius: layout.borderRadius.md,
  },
  
  // Bouton grand
  large: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: layout.borderRadius.lg,
  },
  
  // Texte du bouton principal
  primaryText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Texte du bouton secondaire
  secondaryText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Texte du bouton de danger
  dangerText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Texte du bouton désactivé
  disabledText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default buttonStyles; 