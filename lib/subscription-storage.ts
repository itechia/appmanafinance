import { storageHelpers } from "./storage-helpers"
import type { Subscription, PlanType } from "./types/subscription"

const STORAGE_KEY = "mana_subscriptions"

export const subscriptionStorage = {
  getSubscription(userId: string): Subscription | null {
    const subscriptions = storageHelpers.get<Subscription[]>(STORAGE_KEY) || []
    const userSub = subscriptions.find((sub) => sub.userId === userId)

    if (!userSub) return null

    // Check if subscription is expired
    if (userSub.expiresAt && new Date(userSub.expiresAt) < new Date()) {
      userSub.status = "expired"
      this.updateSubscription(userSub)
    }

    return userSub
  },

  createSubscription(subscription: Omit<Subscription, "id" | "createdAt" | "updatedAt">): Subscription {
    const subscriptions = storageHelpers.get<Subscription[]>(STORAGE_KEY) || []

    const newSubscription: Subscription = {
      ...subscription,
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    subscriptions.push(newSubscription)
    storageHelpers.set(STORAGE_KEY, subscriptions)

    return newSubscription
  },

  updateSubscription(subscription: Subscription): void {
    const subscriptions = storageHelpers.get<Subscription[]>(STORAGE_KEY) || []
    const index = subscriptions.findIndex((sub) => sub.id === subscription.id)

    if (index !== -1) {
      subscriptions[index] = {
        ...subscription,
        updatedAt: new Date(),
      }
      storageHelpers.set(STORAGE_KEY, subscriptions)
    }
  },

  upgradeToPro(
    userId: string,
    interval: "monthly" | "yearly",
    paymentMethod: "credit_card" | "pix" | "boleto",
    mercadoPagoSubscriptionId?: string,
  ): Subscription {
    const existingSub = this.getSubscription(userId)

    const expiresAt = new Date()
    if (interval === "monthly") {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    }

    const amount = interval === "monthly" ? 29.99 : 299.99

    if (existingSub) {
      const updatedSub: Subscription = {
        ...existingSub,
        plan: "pro",
        status: "active",
        expiresAt,
        paymentMethod,
        amount,
        interval,
        mercadoPagoSubscriptionId,
        updatedAt: new Date(),
      }
      this.updateSubscription(updatedSub)
      return updatedSub
    } else {
      return this.createSubscription({
        userId,
        plan: "pro",
        status: "active",
        startDate: new Date(),
        expiresAt,
        paymentMethod,
        amount,
        interval,
        mercadoPagoSubscriptionId,
      })
    }
  },

  cancelSubscription(userId: string): void {
    const subscription = this.getSubscription(userId)
    if (subscription) {
      subscription.status = "canceled"
      this.updateSubscription(subscription)
    }
  },

  deleteUserSubscription(userId: string): void {
    const subscriptions = storageHelpers.get<Subscription[]>(STORAGE_KEY) || []
    const filtered = subscriptions.filter((sub) => sub.userId !== userId)
    storageHelpers.set(STORAGE_KEY, filtered)
  },

  getUserPlan(userId: string): PlanType {
    const subscription = this.getSubscription(userId)

    if (!subscription || subscription.status !== "active") {
      return "free"
    }

    return subscription.plan
  },

  isProUser(userId: string): boolean {
    return this.getUserPlan(userId) === "pro"
  },
}
