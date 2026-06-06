/**
 * Creation/modification date: 01/06/2026
 * Path: src/app/(auth)/register/_components/RegisterFormFields.tsx
 * Description: All 5 form fields for the registration form. Receives the
 *              current values and change handlers, plus a disabled flag.
 */

"use client";

import { Building, User, Mail } from "lucide-react";
import { FormField } from "./FormField";
import { PasswordField } from "./PasswordField";

interface RegisterFormFieldsProps {
  companyName: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  onCompanyNameChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  disabled?: boolean;
}

export function RegisterFormFields({
  companyName,
  name,
  email,
  password,
  confirmPassword,
  onCompanyNameChange,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  disabled = false,
}: RegisterFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        id="companyName"
        name="companyName"
        label="Nombre de la empresa"
        icon={Building}
        placeholder="Mi Empresa S.L."
        value={companyName}
        onChange={onCompanyNameChange}
        disabled={disabled}
      />
      <FormField
        id="name"
        name="name"
        label="Nombre completo"
        icon={User}
        placeholder="Juan García"
        value={name}
        onChange={onNameChange}
        disabled={disabled}
      />
      <FormField
        id="email"
        name="email"
        type="email"
        label="Correo electrónico"
        icon={Mail}
        placeholder="tu@empresa.com"
        value={email}
        onChange={onEmailChange}
        disabled={disabled}
        autoComplete="email"
      />
      <PasswordField
        id="password"
        name="password"
        label="Contraseña"
        placeholder="Mínimo 8 caracteres"
        value={password}
        onChange={onPasswordChange}
        disabled={disabled}
      />
      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Repetir contraseña"
        placeholder="Repete tu contraseña"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        disabled={disabled}
      />
    </div>
  );
}
