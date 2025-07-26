import { useState, useCallback } from 'react';
import { ValidationState } from '../utils/validation';
import validationService, { ValidationErrors, ValidationConfig } from './validationService';

export interface FormField {
  value: string;
  validationState: ValidationState;
  error?: string;
}

export interface FormState {
  [key: string]: FormField;
}

export interface UseFormReturn {
  formState: FormState;
  setFieldValue: (fieldName: string, value: string) => void;
  setFieldError: (fieldName: string, error?: string) => void;
  validateField: (fieldName: string, config: ValidationConfig) => void;
  validateForm: (fieldConfigs: Record<string, ValidationConfig>) => { isValid: boolean; errors: ValidationErrors };
  resetForm: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
}

export const useForm = (initialFields: Record<string, string> = {}): UseFormReturn => {
  const [formState, setFormState] = useState<FormState>(() => {
    const initialState: FormState = {};
    Object.keys(initialFields).forEach(fieldName => {
      initialState[fieldName] = {
        value: initialFields[fieldName] || '',
        validationState: 'idle',
      };
    });
    return initialState;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFieldValue = useCallback((fieldName: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        error: undefined,
        validationState: 'idle',
      },
    }));
  }, []);

  const setFieldError = useCallback((fieldName: string, error?: string) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error,
        validationState: error ? 'invalid' : 'valid',
      },
    }));
  }, []);

  const validateField = useCallback((fieldName: string, config: ValidationConfig) => {
    const field = formState[fieldName];
    if (!field) return;

    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        validationState: 'validating',
      },
    }));

    // Simulate async validation
    setTimeout(() => {
      const validation = validationService.validateField(fieldName, field.value, config);
      
      setFormState(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          validationState: validation.isValid ? 'valid' : 'invalid',
          error: validation.error,
        },
      }));
    }, 300);
  }, [formState]);

  const validateForm = useCallback((fieldConfigs: Record<string, ValidationConfig>) => {
    const fields: Record<string, { value: string; config: ValidationConfig }> = {};
    
    Object.keys(fieldConfigs).forEach(fieldName => {
      const field = formState[fieldName];
      if (field) {
        fields[fieldName] = {
          value: field.value,
          config: fieldConfigs[fieldName],
        };
      }
    });

    const { isValid, errors } = validationService.validateForm(fields);

    // Update form state with errors
    Object.entries(errors).forEach(([fieldName, error]) => {
      setFieldError(fieldName, error);
    });

    return { isValid, errors };
  }, [formState, setFieldError]);

  const resetForm = useCallback(() => {
    setFormState(prev => {
      const resetState: FormState = {};
      Object.keys(prev).forEach(fieldName => {
        resetState[fieldName] = {
          value: '',
          validationState: 'idle',
          error: undefined,
        };
      });
      return resetState;
    });
    setIsSubmitting(false);
  }, []);

  return {
    formState,
    setFieldValue,
    setFieldError,
    validateField,
    validateForm,
    resetForm,
    isSubmitting,
    setIsSubmitting,
  };
}; 