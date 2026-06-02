export type UserRole = "user" | "coach" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}
