import { StyleSheet } from 'react-native';
import { colors, spacing, layout } from '../common';

export const headerStyles = StyleSheet.create({
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e8e8e8',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      },
      headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
      },
      headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
      },
      connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
      },
      statusText: {
        fontSize: 12,
        color: '#495057',
        fontWeight: '600',
        marginLeft: 6,
      },
      actionButton: {
        padding: 10,
        borderRadius: 25,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
      },
      headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 8,
        textAlign: 'center',
      },
      headerSubtitle: {
        fontSize: 14,
        color: '#7f8c8d',
        textAlign: 'center',
        lineHeight: 20,
      },
      headerWifiOn: {
        color: '#27ae60',
      },
      headerWifiOff: {
        color: '#e74c3c',
      }
})