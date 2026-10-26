export type Customer = { id: string; name?: string; email: string };
export type Service = {
  id: string;
  definitionId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  timeZone: string;
};
export type Slot = {
  id: string;
  start: string;
  end?: string;
  timeZone: string;
  available: boolean;
};
export type Field = {
  type: "string" | "boolean" | "number" | "integer";
  title?: string;
  description?: string;
  enum?: (string | number | boolean)[];
  const?: unknown;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  "x-control-variant"?: "textarea";
};
export type Schema = {
  type?: "object";
  title?: string;
  description?: string;
  required?: string[];
  properties: Record<string, Field>;
};
export type Booking = {
  id: string;
  reference?: string;
  serviceId: string;
  serviceName: string;
  start: string;
  end?: string;
  timeZone: string;
  status: string;
  answers?: Record<string, unknown>;
  canReschedule: boolean;
};
export type AuthResult =
  | Customer
  | {
      kind: "challenge";
      challengeToken: string;
      twoFactorMethod?: string;
      message?: string;
      isNewDevice?: boolean;
    }
  | { kind: "passwordChangeRequired"; message?: string };
export interface BookingApi {
  session(): Promise<Customer | null>;
  signIn(input: { email: string; password: string }): Promise<AuthResult>;
  signUp(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResult>;
  verifyChallenge(input: {
    challengeToken: string;
    code: string;
    rememberDevice?: boolean;
  }): Promise<AuthResult>;
  changePassword(input: {
    password: string;
    newPassword: string;
  }): Promise<void>;
  signOut(): Promise<void>;
  services(): Promise<Service[]>;
  availability(input: {
    serviceId: string;
    date: string;
    timeZone: string;
  }): Promise<Slot[]>;
  intakeSchema(serviceId: string): Promise<Schema>;
  createBooking(input: {
    serviceId: string;
    slotId: string;
    answers: Record<string, unknown>;
  }): Promise<Booking>;
  bookings(): Promise<Booking[]>;
  booking(id: string): Promise<Booking>;
  rescheduleBooking(id: string, input: { slotId: string }): Promise<Booking>;
}
export type ApiError = Error & { status?: number; code?: string };
