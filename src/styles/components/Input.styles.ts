import { StyleSheet } from 'react-native';
import { colors, typography, spacing, layout } from '../common';

export const inputStyles = StyleSheet.create({
  // Conteneur d'input
  container: {
    marginBottom: spacing.lg,
  },
  
  // Label
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  
  // Input de base
  base: {
    backgroundColor: colors.backgroundWhite,
    borderWidth: layout.borderWidth.sm,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.md,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  
  // Input avec focus
  focused: {
    backgroundColor: colors.backgroundWhite,
    borderWidth: layout.borderWidth.sm,
    borderColor: colors.primary,
    borderRadius: layout.borderRadius.md,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  
  // Input avec erreur
  error: {
    backgroundColor: colors.backgroundWhite,
    borderWidth: layout.borderWidth.sm,
    borderColor: colors.danger,
    borderRadius: layout.borderRadius.md,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  
  // Input désactivé
  disabled: {
    backgroundColor: colors.backgroundLight,
    borderWidth: layout.borderWidth.sm,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.md,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  
  // Zone de texte
  textArea: {
    backgroundColor: colors.backgroundWhite,
    borderWidth: layout.borderWidth.sm,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.md,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  
  // Texte d'aide
  helpText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  
  // Texte d'erreur
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});

export default inputStyles; 