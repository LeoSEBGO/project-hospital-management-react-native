import { StyleSheet } from 'react-native';
import { colors, typography, spacing, layout } from '../common';

export const patientLoginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing['3xl'],
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.backgroundWhite,
    borderWidth: layout.borderWidth.sm,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.md,
    padding: spacing.base,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundWhite,
    borderWidth: layout.borderWidth.sm,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.md,
    paddingHorizontal: spacing.base,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: layout.borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.textLight,
  },
  buttonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  infoContainer: {
    marginTop: spacing['2xl'],
    padding: spacing.base,
    backgroundColor: colors.backgroundInfo,
    borderRadius: layout.borderRadius.md,
    borderLeftWidth: layout.borderWidth.xl,
    borderLeftColor: colors.borderInfo,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.normal,
    textAlign: 'center',
  },
});

export default patientLoginStyles; 