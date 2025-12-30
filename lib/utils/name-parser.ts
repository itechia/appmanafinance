/**
 * Utilitário para parsear nome completo em firstName e lastName
 */
export function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  const parts = trimmed.split(/\s+/)

  if (parts.length === 0) {
    return { firstName: "", lastName: "" }
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" }
  }

  // Primeiro nome é o primeiro elemento
  const firstName = parts[0]

  // Sobrenome é tudo depois do primeiro nome
  const lastName = parts.slice(1).join(" ")

  return { firstName, lastName }
}
