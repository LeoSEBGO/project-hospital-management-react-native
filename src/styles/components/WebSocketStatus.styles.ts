import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2c3e50',
  },
  detailedContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#3498db',
  },
  reconnectButton: {
    backgroundColor: '#27ae60',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  debugInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
}); 