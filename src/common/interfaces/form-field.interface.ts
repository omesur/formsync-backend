// Definir los tipos de campo permitidos
export type FormFieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'file' | 'textarea' | 'email' | 'password'; 

export interface FormFieldOption {
    value: string | number;
    label: string;
}

export interface FormFieldValidations {
    minLength?: number;
    maxLength?: number;
    pattern?: string; // Regex
    min?: number; // Para tipo number/date
    max?: number; // Para tipo number/date
    allowedMimeTypes?: string[]; // Para tipo file
}

export interface FormFieldDefinition {
    id: string; // UUID o similar generado en frontend
    order: number;
    name: string; // Debe ser único en el formulario
    label: string;
    type: FormFieldType;
    required: boolean;
    placeholder?: string;
    options?: FormFieldOption[]; // Solo para 'select', 'radio'
    validations?: FormFieldValidations;
    defaultValue?: any; // Valor por defecto opcional
}