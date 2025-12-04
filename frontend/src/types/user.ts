/**
 * User and authentication types.
 */

export enum UserRole {
  RESEARCHER = 'researcher',
  PARTICIPANT = 'participant', // Phase 2
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
  
  // Researcher fields
  companyName?: string;
  jobTitle?: string;
  
  // Participant linking (Phase 2)
  participantProfileId?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName?: string;
  role: UserRole;
  companyName?: string;
  jobTitle?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken?: string;
}

