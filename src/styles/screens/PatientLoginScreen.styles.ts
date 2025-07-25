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
    fontSize: typography.fontSize['2xl'],
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
    backgroundColor: 'transparent',
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    flex: 1,
    paddingVertical: spacing.base,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundWhite,
    borderRadius: layout.borderRadius.md,
    paddingHorizontal: spacing.base,
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: colors.textLight,
    shadowOpacity: 0.1,
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
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fdf2f2',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '500',
    flex: 1,
  },
});

export default patientLoginStyles; 