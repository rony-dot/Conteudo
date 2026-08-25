export type Role = "mentor" | "mentee" | "admin";

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  slug: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  expertise: string[];
  hourly_rate_cents: number | null;
  currency: string;
  timezone: string;
  is_published: boolean;
  mp_connected: boolean;
  created_at: string;
}

export interface MentorPaymentAccount {
  mentor_id: string;
  provider: string;
  mp_user_id: string | null;
  access_token: string;
  refresh_token: string | null;
  public_key: string | null;
  expires_at: string | null;
  connected_at: string;
  updated_at: string;
}

export interface AvailabilityRule {
  id: string;
  mentor_id: string;
  weekday: number; // 0 = domingo ... 6 = sábado
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
}

export interface AvailabilityException {
  id: string;
  mentor_id: string;
  date: string; // "YYYY-MM-DD"
  is_blocked: boolean;
}

export interface Booking {
  id: string;
  mentor_id: string;
  mentee_id: string;
  start_at: string;
  end_at: string;
  duration_min: number;
  price_cents: number;
  platform_fee_cents: number;
  status: BookingStatus;
  meeting_url: string | null;
  mp_payment_id: string | null;
  hold_expires_at: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  provider: string;
  provider_payment_id: string | null;
  amount_cents: number;
  status: string;
  raw: unknown;
  created_at: string;
}

/** Um horário disponível gerado a partir das regras do mentor. */
export interface Slot {
  start: string; // ISO
  end: string; // ISO
}
