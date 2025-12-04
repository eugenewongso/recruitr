/**
 * Participant types.
 */

export interface Participant {
  id: string;
  name: string;
  email?: string;
  
  // Professional info
  role: string;
  industry?: string;
  companyName?: string;
  companySize?: string;
  
  // Work details
  remote: boolean;
  teamSize?: number;
  experienceYears?: number;
  
  // Skills & tools
  tools: string[];
  skills: string[];
  
  // Description
  description?: string;
  
  // Metadata
  isSynthetic: boolean;
  acceptingInterviews: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantWithScore extends Participant {
  relevanceScore: number;
  matchReasons: string[];
}

