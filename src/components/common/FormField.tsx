import React from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing } from '../../styles/common';
import { ValidationState } from '../../utils/validation';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: string;
  validationState?: ValidationState;
  error?: string;
  isSubmitting?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  onValidationPress?: () => void;
  showValidationButton?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  validationState = 'idle',
  error,
  isSubmitting = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  onValidationPress,
  showValidationButton = false,
}) => {
  const getBorderColor = () => {
    if (error) return colors.danger;
    if (validationState === 'valid') return colors.success;
    if (validationState === 'invalid') return colors.danger;
    return colors.border;
  };

  const getIconColor = () => {
    if (error) return colors.danger;
    if (validationState === 'valid') return colors.success;
    if (validationState === 'invalid') return colors.danger;
    return colors.textLight;
  };

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{ 
        fontSize: 16, 
        fontWeight: '600', 
        color: colors.textPrimary, 
        marginBottom: spacing.sm 
      }}>
        {label}
      </Text>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: getBorderColor(),
        borderRadius: 8,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.white,
        opacity: editable ? 1 : 0.5
      }}>
        {icon && (
          <MaterialIcons 
            name={icon as any} 
            size={20} 
            color={getIconColor()} 
            style={{ marginRight: spacing.sm }}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          style={{ 
            flex: 1, 
            fontSize: 16, 
            color: colors.textPrimary,
            paddingVertical: spacing.md,
            minHeight: multiline ? 100 : undefined,
            textAlignVertical: multiline ? 'top' : 'center'
          }}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
        />
        {validationState === 'valid' && (
          <MaterialIcons 
            name="check-circle" 
            size={20} 
            color={colors.success} 
            style={{ marginLeft: spacing.sm }}
          />
        )}
        {validationState === 'validating' && (
          <ActivityIndicator size="small" color={colors.warning} style={{ marginLeft: spacing.sm }} />
        )}
        {showValidationButton && value && validationState !== 'valid' && !isSubmitting && (
          <MaterialIcons 
            name="check" 
            size={20} 
            color={colors.primary} 
            style={{ marginLeft: spacing.sm }}
            onPress={onValidationPress}
          />
        )}
      </View>
      {error && (
        <Text style={{ color: colors.danger, fontSize: 14, marginTop: spacing.xs }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default FormField; 