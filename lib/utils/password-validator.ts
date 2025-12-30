export interface PasswordStrength {
  score: number // 0-4
  label: string
  color: string
  requirements: {
    minLength: boolean
    hasUpperCase: boolean
    hasNumber: boolean
    hasSpecialChar: boolean
  }
}

export function validatePassword(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  }

  const metRequirements = Object.values(requirements).filter(Boolean).length

  let score = 0
  let label = "Muito fraca"
  let color = "bg-red-500"

  if (metRequirements === 4) {
    score = 4
    label = "Muito forte"
    color = "bg-green-500"
  } else if (metRequirements === 3) {
    score = 3
    label = "Forte"
    color = "bg-green-400"
  } else if (metRequirements === 2) {
    score = 2
    label = "Média"
    color = "bg-yellow-500"
  } else if (metRequirements === 1) {
    score = 1
    label = "Fraca"
    color = "bg-orange-500"
  }

  return { score, label, color, requirements }
}

export function isPasswordValid(password: string): boolean {
  const strength = validatePassword(password)
  return Object.values(strength.requirements).every(Boolean)
}
