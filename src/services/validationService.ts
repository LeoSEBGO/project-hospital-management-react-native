import { ValidationState, ValidationStates } from '../utils/validation';

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export interface ValidationConfig {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidation?: (value: string) => string | undefined;
}

export class ValidationService {
  private static instance: ValidationService;
  private validationStates: ValidationStates = {};

  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  validateField(
    fieldName: string,
    value: string,
    config: ValidationConfig
  ): { isValid: boolean; error?: string } {
    // Required validation
    if (config.required && !value.trim()) {
      return { isValid: false, error: 'Ce champ est requis' };
    }

    // Skip other validations if empty and not required
    if (!value.trim() && !config.required) {
      return { isValid: true };
    }

    // Min length validation
    if (config.minLength && value.trim().length < config.minLength) {
      return { 
        isValid: false, 
        error: `Ce champ doit contenir au moins ${config.minLength} caractères` 
      };
    }

    // Max length validation
    if (config.maxLength && value.trim().length > config.maxLength) {
      return { 
        isValid: false, 
        error: `Ce champ ne peut pas dépasser ${config.maxLength} caractères` 
      };
    }

    // Pattern validation
    if (config.pattern && !config.pattern.test(value)) {
      return { isValid: false, error: 'Format invalide' };
    }

    // Custom validation
    if (config.customValidation) {
      const customError = config.customValidation(value);
      if (customError) {
        return { isValid: false, error: customError };
      }
    }

    return { isValid: true };
  }

  validateForm(
    fields: Record<string, { value: string; config: ValidationConfig }>
  ): { isValid: boolean; errors: ValidationErrors } {
    const errors: ValidationErrors = {};
    let isValid = true;

    Object.entries(fields).forEach(([fieldName, { value, config }]) => {
      const validation = this.validateField(fieldName, value, config);
      if (!validation.isValid) {
        errors[fieldName] = validation.error;
        isValid = false;
      }
    });

    return { isValid, errors };
  }

  updateValidationState(
    fieldName: string,
    state: ValidationState
  ): void {
    this.validationStates[fieldName] = state;
  }

  getValidationState(fieldName: string): ValidationState {
    return this.validationStates[fieldName] || 'idle';
  }

  resetValidationStates(): void {
    this.validationStates = {};
  }
}

export default ValidationService.getInstance(); 