export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            cards: {
                Row: {
                    balance: number | null
                    brand: string | null
                    closing_day: number | null
                    color: string | null
                    created_at: string
                    due_day: number | null
                    id: string
                    last_digits: string | null
                    limit: number | null
                    name: string
                    type: string
                    used: number | null
                    workspace_id: string
                }
                Insert: {
                    balance?: number | null
                    brand?: string | null
                    closing_day?: number | null
                    color?: string | null
                    created_at?: string
                    due_day?: number | null
                    id?: string
                    last_digits?: string | null
                    limit?: number | null
                    name: string
                    type: string
                    used?: number | null
                    workspace_id: string
                }
                Update: {
                    balance?: number | null
                    brand?: string | null
                    closing_day?: number | null
                    color?: string | null
                    created_at?: string
                    due_day?: number | null
                    id?: string
                    last_digits?: string | null
                    limit?: number | null
                    name?: string
                    type?: string
                    used?: number | null
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "cards_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            categories: {
                Row: {
                    color: string | null
                    created_at: string
                    icon: string | null
                    id: string
                    name: string
                    type: string
                    workspace_id: string
                }
                Insert: {
                    color?: string | null
                    created_at?: string
                    icon?: string | null
                    id?: string
                    name: string
                    type: string
                    workspace_id: string
                }
                Update: {
                    color?: string | null
                    created_at?: string
                    icon?: string | null
                    id?: string
                    name?: string
                    type?: string
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "categories_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            goals: {
                Row: {
                    category: string | null
                    color: string | null
                    created_at: string
                    current_amount: number | null
                    deadline: string | null
                    icon: string | null
                    id: string
                    name: string
                    target_amount: number
                    workspace_id: string
                }
                Insert: {
                    category?: string | null
                    color?: string | null
                    created_at?: string
                    current_amount?: number | null
                    deadline?: string | null
                    icon?: string | null
                    id?: string
                    name: string
                    target_amount: number
                    workspace_id: string
                }
                Update: {
                    category?: string | null
                    color?: string | null
                    created_at?: string
                    current_amount?: number | null
                    deadline?: string | null
                    icon?: string | null
                    id?: string
                    name?: string
                    target_amount?: number
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "goals_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            transactions: {
                Row: {
                    account_id: string | null
                    account_type: string | null
                    amount: number
                    card_function: string | null
                    category_id: string | null
                    category_name: string | null
                    created_at: string
                    date: string
                    description: string
                    id: string
                    installments: number | null
                    notes: string | null
                    status: string | null
                    type: string
                    workspace_id: string
                }
                Insert: {
                    account_id?: string | null
                    account_type?: string | null
                    amount: number
                    card_function?: string | null
                    category_id?: string | null
                    category_name?: string | null
                    created_at?: string
                    date: string
                    description: string
                    id?: string
                    installments?: number | null
                    notes?: string | null
                    status?: string | null
                    type: string
                    workspace_id: string
                }
                Update: {
                    account_id?: string | null
                    account_type?: string | null
                    amount?: number
                    card_function?: string | null
                    category_id?: string | null
                    category_name?: string | null
                    created_at?: string
                    date?: string
                    description?: string
                    id?: string
                    installments?: number | null
                    notes?: string | null
                    status?: string | null
                    type?: string
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "transactions_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            users: {
                Row: {
                    avatar_url: string | null
                    bio: string | null
                    birth_date: string | null
                    connection_token: string | null
                    cpf: string | null
                    created_at: string
                    currency: string | null
                    data_retention: string | null
                    email: string
                    first_name: string | null
                    id: string
                    language: string | null
                    last_name: string | null
                    notification_preferences: Json | null
                    phone: string | null
                    subscription_end_date: string | null
                    subscription_id: string | null
                    subscription_plan: string | null
                    subscription_provider: string | null
                    subscription_status: string | null
                    theme: string | null
                    timezone: string | null
                    whatsapp: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    bio?: string | null
                    birth_date?: string | null
                    connection_token?: string | null
                    cpf?: string | null
                    created_at?: string
                    currency?: string | null
                    data_retention?: string | null
                    email: string
                    first_name?: string | null
                    id: string
                    language?: string | null
                    last_name?: string | null
                    notification_preferences?: Json | null
                    phone?: string | null
                    subscription_end_date?: string | null
                    subscription_id?: string | null
                    subscription_plan?: string | null
                    subscription_provider?: string | null
                    subscription_status?: string | null
                    theme?: string | null
                    timezone?: string | null
                    whatsapp?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    bio?: string | null
                    birth_date?: string | null
                    connection_token?: string | null
                    cpf?: string | null
                    created_at?: string
                    currency?: string | null
                    data_retention?: string | null
                    email?: string
                    first_name?: string | null
                    id?: string
                    language?: string | null
                    last_name?: string | null
                    notification_preferences?: Json | null
                    phone?: string | null
                    subscription_end_date?: string | null
                    subscription_id?: string | null
                    subscription_plan?: string | null
                    subscription_provider?: string | null
                    subscription_status?: string | null
                    theme?: string | null
                    timezone?: string | null
                    whatsapp?: string | null
                }
                Relationships: []
            }
            wallets: {
                Row: {
                    balance: number | null
                    color: string | null
                    created_at: string
                    icon: string | null
                    id: string
                    name: string
                    workspace_id: string
                }
                Insert: {
                    balance?: number | null
                    color?: string | null
                    created_at?: string
                    icon?: string | null
                    id?: string
                    name: string
                    workspace_id: string
                }
                Update: {
                    balance?: number | null
                    color?: string | null
                    created_at?: string
                    icon?: string | null
                    id?: string
                    name?: string
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "wallets_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            workspace_members: {
                Row: {
                    created_at: string
                    id: string
                    role: string
                    status: string
                    user_id: string
                    workspace_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    role: string
                    status?: string
                    user_id: string
                    workspace_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    role?: string
                    status?: string
                    user_id?: string
                    workspace_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "workspace_members_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "workspace_members_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                ]
            }
            workspaces: {
                Row: {
                    created_at: string
                    id: string
                    name: string
                    owner_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                    owner_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    name?: string
                    owner_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "workspaces_owner_id_fkey"
                        columns: ["owner_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
