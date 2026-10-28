export type DispatchRole =
  'owner' | 'coordinator' | 'driver' | 'plant_manager' | 'customer';

export interface DispatchUser {
  id: string;
  email: string;
  name: string;
  role: DispatchRole;
  passwordHash: string;
  passwordSalt: string;
  associatedId?: string; // e.g. driverId for driver, plantId for plant_manager, clientName for customer
  companyName?: string;
  phoneEncrypted?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserSessionPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: DispatchRole;
  associatedId?: string;
  companyName?: string;
  iat: number;
  exp: number;
}
