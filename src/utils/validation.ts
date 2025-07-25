// Fonction de validation de l'email
export const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) {
    return 'L\'email est requis';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Format d\'email invalide';
  }
  
  if (email.length > 100) {
    return 'L\'email est trop long (max 100 caractères)';
  }
  
  return undefined;
};

// Fonction de validation du mot de passe
export const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'Le mot de passe est requis';
  }
  
  if (password.length < 6) {
    return 'Le mot de passe doit contenir au moins 6 caractères';
  }
  
  if (password.length > 50) {
    return 'Le mot de passe est trop long (max 50 caractères)';
  }
  
  return undefined;
};

// Fonction de validation du nom
export const validateName = (name: string): string | undefined => {
  if (!name.trim()) {
    return 'Le nom est requis';
  }
  
  if (name.trim().length < 2) {
    return 'Le nom doit contenir au moins 2 caractères';
  }
  
  if (name.length > 50) {
    return 'Le nom est trop long (max 50 caractères)';
  }
  
  return undefined;
};

// Fonction de validation du téléphone
export const validatePhone = (phone: string): string | undefined => {
  if (!phone.trim()) {
    return 'Le numéro de téléphone est requis';
  }
  
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,15}$/;
  if (!phoneRegex.test(phone.trim())) {
    return 'Format de téléphone invalide';
  }
  
  return undefined;
};

// Types pour les états de validation
export type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid';

export interface ValidationStates {
  [key: string]: ValidationState;
}

// Fonction utilitaire pour obtenir la couleur de bordure selon l'état de validation
export const getValidationBorderColor = (
  state: ValidationState, 
  hasError: boolean, 
  colors: any
): string => {
  if (hasError || state === 'invalid') {
    return colors.danger;
  } else if (state === 'valid') {
    return colors.success;
  } else if (state === 'validating') {
    return colors.warning;
  }
  return colors.border;
};

// Fonction utilitaire pour obtenir la couleur de l'icône selon l'état de validation
export const getValidationIconColor = (
  state: ValidationState, 
  hasError: boolean, 
  colors: any
): string => {
  if (hasError || state === 'invalid') {
    return colors.danger;
  } else if (state === 'valid') {
    return colors.success;
  } else if (state === 'validating') {
    return colors.warning;
  }
  return colors.textLight;
}; 