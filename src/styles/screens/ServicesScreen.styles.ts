import { StyleSheet } from 'react-native';
import { colors } from '../common/colors';
import { spacing } from '../common/spacing';
import { typography } from '../common/typography';

export default StyleSheet.create({
  // Container principal
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // Écran de chargement
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
  },

  // Header
  header: {
    marginTop: 20,
    backgroundColor: '#fff',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },


  // Contenu principal
  content: {
    flex: 1,
    padding: spacing.lg,
  },

  // Section des filtres
  filtersSection: {
    marginBottom: spacing.xl,
  },
  filtersTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },



  // Filtre par date
  dateFilterLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  dateFilterContainer: {
    marginBottom: spacing.md,
  },

  // DatePicker
  datePickerButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },



  // Section liste des services
  servicesListSection: {
    marginBottom: spacing.lg,
  },
  servicesListTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Carte de service
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  serviceCardName: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  serviceCardStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  serviceCardStatusActive: {
    backgroundColor: '#d4edda',
  },
  serviceCardStatusInactive: {
    backgroundColor: '#f8d7da',
  },
  serviceCardStatusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
  },
  serviceCardStatusTextActive: {
    color: '#155724',
  },
  serviceCardStatusTextInactive: {
    color: '#721c24',
  },
  serviceCardDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  serviceCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceCardStatsText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  serviceCardButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
  },
  serviceCardButtonActive: {
    backgroundColor: colors.primary,
  },
  serviceCardButtonInactive: {
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
  serviceCardButtonText: {
    fontSize: typography.fontSize.xs,
    color: '#fff',
    fontWeight: '500',
  },
}); 