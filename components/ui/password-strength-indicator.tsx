import { Check, X } from "lucide-react"
import { validatePassword } from "@/lib/utils/password-validator"

interface PasswordStrengthIndicatorProps {
  password: string
  showRequirements?: boolean
}

export function PasswordStrengthIndicator({ password, showRequirements = true }: PasswordStrengthIndicatorProps) {
  const strength = validatePassword(password)

  if (!password) return null

  return (
    <div className="space-y-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-1 flex-1 rounded-full transition-colors ${
                level <= strength.score ? strength.color : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Força da senha: <span className="font-medium">{strength.label}</span>
        </p>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-1 text-xs">
          <RequirementItem met={strength.requirements.minLength} text="Mínimo 8 caracteres" />
          <RequirementItem met={strength.requirements.hasUpperCase} text="Letra maiúscula" />
          <RequirementItem met={strength.requirements.hasNumber} text="Número" />
          <RequirementItem met={strength.requirements.hasSpecialChar} text="Caractere especial (!@#$%...)" />
        </div>
      )}
    </div>
  )
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
      <span className={met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>{text}</span>
    </div>
  )
}
