'use client';

/**
 * AdminForm Component with Zod Validation
 *
 * Phase 4, Week 8 Extended - Internal Tools & DX Checklist
 *
 * Features:
 * - Zod schema validation
 * - Type-safe form fields
 * - Error display with field-level messages
 * - Loading states
 * - Dirty tracking
 * - Reset functionality
 */

import React, { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'url'
  | 'tel'
  | 'hidden';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  options?: SelectOption[]; // For select, radio
  rows?: number; // For textarea
  min?: number; // For number
  max?: number; // For number
  step?: number; // For number
  pattern?: string; // For text validation
  autoComplete?: string;
  className?: string;
}

export interface AdminFormProps<T extends z.ZodType> {
  schema: T;
  fields: FormField[];
  initialValues?: Partial<z.infer<T>>;
  onSubmit: (values: z.infer<T>) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  title?: string;
  description?: string;
  isLoading?: boolean;
  className?: string;
  layout?: 'vertical' | 'horizontal' | 'inline';
  showReset?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
}

interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getInitialValues<T extends z.ZodType>(
  schema: T,
  fields: FormField[],
  initialValues?: Partial<z.infer<T>>
): z.infer<T> {
  const defaults: Record<string, unknown> = {};

  fields.forEach((field) => {
    if (initialValues && field.name in initialValues) {
      defaults[field.name] = initialValues[field.name as keyof typeof initialValues];
    } else {
      // Set default based on field type
      switch (field.type) {
        case 'checkbox':
          defaults[field.name] = false;
          break;
        case 'number':
          defaults[field.name] = field.min ?? 0;
          break;
        default:
          defaults[field.name] = '';
      }
    }
  });

  return defaults as z.infer<T>;
}

function formatZodError(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  error.issues.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });

  return errors;
}

// ============================================================================
// FORM FIELD COMPONENT
// ============================================================================

interface FormFieldComponentProps {
  field: FormField;
  value: unknown;
  error?: string;
  touched: boolean;
  onChange: (name: string, value: unknown) => void;
  onBlur: (name: string) => void;
  disabled?: boolean;
  layout: 'vertical' | 'horizontal' | 'inline';
}

function FormFieldComponent({
  field,
  value,
  error,
  touched,
  onChange,
  onBlur,
  disabled,
  layout,
}: FormFieldComponentProps) {
  const hasError = touched && error;
  const inputId = `field-${field.name}`;
  const errorId = `${inputId}-error`;

  const baseInputClasses = `
    block w-full rounded-md border px-3 py-2 text-sm
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:cursor-not-allowed disabled:opacity-50
    ${
      hasError
        ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500'
    }
  `;

  const labelClasses = `
    block text-sm font-medium
    ${hasError ? 'text-red-700' : 'text-gray-700'}
  `;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    let newValue: unknown = e.target.value;

    if (field.type === 'checkbox' && e.target instanceof HTMLInputElement) {
      newValue = e.target.checked;
    } else if (field.type === 'number') {
      newValue = e.target.value === '' ? '' : Number(e.target.value);
    }

    onChange(field.name, newValue);
  };

  const handleBlur = () => {
    onBlur(field.name);
  };

  const renderInput = () => {
    const commonProps = {
      id: inputId,
      name: field.name,
      disabled: disabled || field.disabled,
      onBlur: handleBlur,
      'aria-invalid': hasError ? 'true' as const : 'false' as const,
      'aria-describedby': hasError ? errorId : undefined,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            value={value as string}
            onChange={handleChange}
            placeholder={field.placeholder}
            rows={field.rows ?? 4}
            className={`${baseInputClasses} resize-y`}
          />
        );

      case 'select':
        return (
          <select
            {...commonProps}
            value={value as string}
            onChange={handleChange}
            className={baseInputClasses}
          >
            <option value="">{field.placeholder ?? 'Select...'}</option>
            {field.options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              {...commonProps}
              type="checkbox"
              checked={value as boolean}
              onChange={handleChange}
              className={`
                h-4 w-4 rounded border-gray-300 text-blue-600
                focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                disabled:cursor-not-allowed disabled:opacity-50
                ${hasError ? 'border-red-500' : ''}
              `}
            />
            <label htmlFor={inputId} className="ml-2 text-sm text-gray-700">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`${inputId}-${option.value}`}
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={disabled || field.disabled || option.disabled}
                  className={`
                    h-4 w-4 border-gray-300 text-blue-600
                    focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                    disabled:cursor-not-allowed disabled:opacity-50
                    ${hasError ? 'border-red-500' : ''}
                  `}
                />
                <label
                  htmlFor={`${inputId}-${option.value}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'hidden':
        return (
          <input
            type="hidden"
            name={field.name}
            value={value as string}
          />
        );

      default:
        return (
          <input
            {...commonProps}
            type={field.type}
            value={value as string | number}
            onChange={handleChange}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            pattern={field.pattern}
            autoComplete={field.autoComplete}
            className={baseInputClasses}
          />
        );
    }
  };

  // Hidden fields don't need wrappers
  if (field.type === 'hidden') {
    return renderInput();
  }

  // Checkbox has inline label
  if (field.type === 'checkbox') {
    return (
      <div className={`${field.className ?? ''}`}>
        {renderInput()}
        {field.description && (
          <p className="mt-1 text-xs text-gray-500">{field.description}</p>
        )}
        {hasError && (
          <p id={errorId} className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Layout-based wrapper
  const wrapperClasses = {
    vertical: 'space-y-1',
    horizontal: 'sm:grid sm:grid-cols-3 sm:items-start sm:gap-4',
    inline: 'flex items-center gap-2',
  };

  return (
    <div className={`${wrapperClasses[layout]} ${field.className ?? ''}`}>
      <label htmlFor={inputId} className={labelClasses}>
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <div className={layout === 'horizontal' ? 'sm:col-span-2' : ''}>
        {renderInput()}
        {field.description && (
          <p className="mt-1 text-xs text-gray-500">{field.description}</p>
        )}
        {hasError && (
          <p id={errorId} className="mt-1 text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN ADMIN FORM COMPONENT
// ============================================================================

export function AdminForm<T extends z.ZodType>({
  schema,
  fields,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  title,
  description,
  isLoading = false,
  className = '',
  layout = 'vertical',
  showReset = false,
  validateOnBlur = true,
  validateOnChange = false,
}: AdminFormProps<T>) {
  const initial = useMemo(
    () => getInitialValues(schema, fields, initialValues),
    [schema, fields, initialValues]
  );

  const [state, setState] = useState<FormState<z.infer<T>>>({
    values: initial,
    errors: {},
    touched: {},
    isSubmitting: false,
    isDirty: false,
  });

  const validateField = useCallback(
    (name: string, value: unknown): string | undefined => {
      // Create a partial schema validation
      const valuesToValidate = { ...(state.values as Record<string, unknown>), [name]: value };
      const result = schema.safeParse(valuesToValidate);
      if (!result.success) {
        const error = result.error.issues.find((e) => e.path.includes(name));
        return error?.message;
      }
      return undefined;
    },
    [schema, state.values]
  );

  const validateForm = useCallback((): boolean => {
    const result = schema.safeParse(state.values);
    if (!result.success) {
      setState((prev) => ({
        ...prev,
        errors: formatZodError(result.error),
      }));
      return false;
    }
    setState((prev) => ({ ...prev, errors: {} }));
    return true;
  }, [schema, state.values]);

  const handleChange = useCallback(
    (name: string, value: unknown) => {
      setState((prev) => {
        const newValues = { ...(prev.values as Record<string, unknown>), [name]: value } as z.infer<T>;
        const newErrors = { ...prev.errors };

        if (validateOnChange) {
          const error = validateField(name, value);
          if (error) {
            newErrors[name] = error;
          } else {
            delete newErrors[name];
          }
        }

        return {
          ...prev,
          values: newValues,
          errors: newErrors,
          isDirty: true,
        };
      });
    },
    [validateOnChange, validateField]
  );

  const handleBlur = useCallback(
    (name: string) => {
      setState((prev) => {
        const newTouched = { ...prev.touched, [name]: true };
        const newErrors = { ...prev.errors };

        if (validateOnBlur) {
          const error = validateField(name, prev.values[name as keyof typeof prev.values]);
          if (error) {
            newErrors[name] = error;
          } else {
            delete newErrors[name];
          }
        }

        return {
          ...prev,
          touched: newTouched,
          errors: newErrors,
        };
      });
    },
    [validateOnBlur, validateField]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = fields.reduce(
      (acc, field) => ({ ...acc, [field.name]: true }),
      {}
    );
    setState((prev) => ({ ...prev, touched: allTouched }));

    // Validate entire form
    if (!validateForm()) {
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      await onSubmit(state.values);
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleReset = () => {
    setState({
      values: initial,
      errors: {},
      touched: {},
      isSubmitting: false,
      isDirty: false,
    });
  };

  const formDisabled = isLoading || state.isSubmitting;
  const hasErrors = Object.keys(state.errors).length > 0;

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Header */}
      {(title || description) && (
        <div className="border-b border-gray-200 pb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}

      {/* Form errors summary */}
      {hasErrors && Object.keys(state.touched).length > 0 && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h3>
              <ul className="mt-2 list-inside list-disc text-sm text-red-700">
                {Object.entries(state.errors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Fields */}
      <div
        className={`space-y-4 ${
          layout === 'inline' ? 'flex flex-wrap items-end gap-4' : ''
        }`}
      >
        {fields.map((field) => (
          <FormFieldComponent
            key={field.name}
            field={field}
            value={state.values[field.name as keyof typeof state.values]}
            error={state.errors[field.name]}
            touched={state.touched[field.name] ?? false}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={formDisabled}
            layout={layout}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
        {showReset && state.isDirty && (
          <button
            type="button"
            onClick={handleReset}
            disabled={formDisabled}
            className="
              rounded-md px-4 py-2 text-sm font-medium
              text-gray-600 hover:text-gray-900
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            Reset
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={formDisabled}
            className="
              rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium
              text-gray-700 shadow-sm hover:bg-gray-50
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {cancelLabel}
          </button>
        )}

        <button
          type="submit"
          disabled={formDisabled}
          className="
            inline-flex items-center justify-center rounded-md border border-transparent
            bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          {(isLoading || state.isSubmitting) && (
            <svg
              className="-ml-1 mr-2 h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// HOOK FOR PROGRAMMATIC FORM CONTROL
// ============================================================================

export function useAdminForm<T extends z.ZodType>(
  schema: T,
  initialValues?: Partial<z.infer<T>>
) {
  const [values, setValues] = useState<z.infer<T>>(
    (initialValues ?? {}) as z.infer<T>
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setValue = (name: string, value: unknown) => {
    setValues((prev) => ({ ...(prev as Record<string, unknown>), [name]: value } as z.infer<T>));
  };

  const validate = (): boolean => {
    const result = schema.safeParse(values);
    if (!result.success) {
      setErrors(formatZodError(result.error));
      return false;
    }
    setErrors({});
    return true;
  };

  const reset = () => {
    setValues((initialValues ?? {}) as z.infer<T>);
    setErrors({});
  };

  return {
    values,
    errors,
    setValue,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}

export default AdminForm;
