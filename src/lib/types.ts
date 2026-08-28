export type Role = "user" | "admin";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Position {
  id: string;
  sku: string;
  description: string | null;
  location: string;
  quantity: number;
  min_alert: number | null;
  last_counted_at: string | null;
  updated_at: string;
}

export interface CountSession {
  id: string;
  code: string;
  applied_at: string;
  applied_by: string | null;
  items: CountItem[];
}

export interface CountItem {
  sku: string;
  location: string;
  quantity: number;
  description?: string | null;
  expiry?: string | null;
}

export interface AppSettings {
  id: number;
  default_min_alert: number;
  email_enabled: boolean;
  resend_api_key: string | null;
  alert_from: string | null;
  alert_emails: string[];
  updated_at: string;
}

export interface PublicSettings {
  default_min_alert: number;
  email_enabled: boolean;
}
