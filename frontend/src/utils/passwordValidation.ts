export type PasswordValidation = {
  minLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
};

export function validatePassword(password: string): PasswordValidation {
  return {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^a-zA-Z0-9]/.test(password),
  };
}

export function countPasswordRules(validation: PasswordValidation): number {
  return Object.values(validation).filter(Boolean).length;
}

export function isPasswordValid(validation: PasswordValidation): boolean {
  return countPasswordRules(validation) === 5;
}

export type PasswordStrength = "none" | "weak" | "fair" | "good" | "strong";

export function getPasswordStrength(ruleCount: number): PasswordStrength {
  if (ruleCount <= 0) return "none";
  if (ruleCount <= 2) return "weak";
  if (ruleCount === 3) return "fair";
  if (ruleCount === 4) return "good";
  return "strong";
}
