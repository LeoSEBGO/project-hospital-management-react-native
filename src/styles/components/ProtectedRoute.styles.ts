import { StyleSheet } from 'react-native';
import { colors } from '../common/colors';
import { spacing } from '../common/spacing';
import { typography } from '../common/typography';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: typography.fontSize.base,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 