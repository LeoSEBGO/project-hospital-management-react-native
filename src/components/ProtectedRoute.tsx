import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, loading, validateToken } = useAuth();

  useEffect(() => {
    // Vérifier la validité du token au montage du composant
    if (isAuthenticated) {
      validateToken().then((isValid) => {
        if (!isValid) {
          Alert.alert(
            'Session expirée',
            'Votre session a expiré. Veuillez vous reconnecter.',
            [{ text: 'OK' }]
          );
        }
      }).catch((error) => {
        console.error('Erreur lors de la validation du token:', error);
        Alert.alert(
          'Erreur de connexion',
          'Impossible de vérifier votre session. Veuillez réessayer.',
          [{ text: 'OK' }]
        );
      });
    }
  }, [isAuthenticated, validateToken]);

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666', textAlign: 'center' }}>
          Vérification de l'authentification...
        </Text>
      </View>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher le fallback ou un message par défaut
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#e74c3c', marginBottom: 16, textAlign: 'center' }}>
          Accès non autorisé
        </Text>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 }}>
          Vous devez être connecté pour accéder à cette page.
        </Text>
      </View>
    );
  }

  // Si l'utilisateur est authentifié, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute; 