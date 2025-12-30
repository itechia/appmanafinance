/**
 * Helper functions for localStorage/sessionStorage with JSON handling
 * Provides type-safe storage operations with error handling
 * SSR-safe: checks if running in browser before accessing storage
 */

const isBrowser = typeof window !== "undefined"

export class StorageHelper {
  private storageType: "local" | "session"

  constructor(storageType: "local" | "session" = "local") {
    this.storageType = storageType
  }

  private get storage(): Storage | null {
    if (!isBrowser) return null
    return this.storageType === "local" ? window.localStorage : window.sessionStorage
  }

  /**
   * Get item from storage and parse as JSON
   */
  get<T>(key: string): T | null {
    if (!this.storage) return null
    try {
      const item = this.storage.getItem(key)
      if (item === null) return null
      return JSON.parse(item) as T
    } catch (error) {
      console.error(`[Storage] Error getting ${key}:`, error)
      return null
    }
  }

  /**
   * Set item in storage as JSON string
   */
  set<T>(key: string, value: T): boolean {
    if (!this.storage) return false
    try {
      const serialized = JSON.stringify(value)
      this.storage.setItem(key, serialized)
      return true
    } catch (error) {
      console.error(`[Storage] Error setting ${key}:`, error)
      return false
    }
  }

  /**
   * Remove item from storage
   */
  remove(key: string): boolean {
    if (!this.storage) return false
    try {
      this.storage.removeItem(key)
      return true
    } catch (error) {
      console.error(`[Storage] Error removing ${key}:`, error)
      return false
    }
  }

  /**
   * Clear all items from storage
   */
  clear(): boolean {
    if (!this.storage) return false
    try {
      this.storage.clear()
      return true
    } catch (error) {
      console.error("[Storage] Error clearing storage:", error)
      return false
    }
  }

  /**
   * Check if key exists in storage
   */
  has(key: string): boolean {
    if (!this.storage) return false
    return this.storage.getItem(key) !== null
  }

  /**
   * Get all keys from storage
   */
  keys(): string[] {
    if (!this.storage) return []
    return Object.keys(this.storage)
  }
}

export const localStorageHelper = new StorageHelper("local")
export const sessionStorageHelper = new StorageHelper("session")

// Shorter aliases for convenience
export const localStorage = localStorageHelper
export const sessionStorage = sessionStorageHelper

export const storageHelpers = localStorageHelper
