import { StyleSheet } from 'react-native';
import { colors, spacing } from '../common';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
  },
  description: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
}); 