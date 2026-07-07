export type AuthRole = "rider" | "driver";

export type AuthGender = "male" | "female" | "other";

export type AuthOtpChannel = "email" | "phone";
export type VerifyOtpPurpose = "signup" | "forgot-password";

export interface AuthLocationInput {
  lat: number;
  lng: number;
  address?: string;
}

export interface AuthLocationResponse {
  lat: number;
  lng: number;
  address?: string;
}

export interface AuthLocationPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface AuthUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  location: AuthLocationResponse;
  gender: AuthGender;
  role: AuthRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  profileCompleted: boolean;
  profileCompletionRequired: boolean;
}

export interface VerifyOtpResponse {
  message: string;
  user?: AuthUserResponse;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  location: AuthLocationInput;
  gender: AuthGender;
  role: AuthRole;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface ForgotPasswordRequest {
  phoneNumber: string;
}

export interface ResendOtpRequest {
  phoneNumber: string;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
  purpose: VerifyOtpPurpose;
}

export interface ResetPasswordRequest {
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface AuthUserView {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  location: AuthLocationResponse;
  gender: AuthGender;
  role: AuthRole;
  isVerified: boolean;
  isBlocked?: boolean;
  createdAt: Date;
  updatedAt: Date;
  profileCompleted: boolean;
  profileCompletionRequired: boolean;
  onlineStatus?: "online" | "offline";
  adminApproved?: "pending" | "approved" | "declined";
  rideTakenCount?: number;
  rideGivenCount?: number;
}
