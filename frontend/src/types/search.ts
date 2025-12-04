/**
 * Search types.
 */

import { ParticipantWithScore } from './participant';

export interface SearchFilters {
  remote?: boolean;
  tools?: string[];
  role?: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  companySize?: string;
  minExperience?: number;
}

export interface SearchRequest {
  query: string;
  top_k?: number;  // Backend uses top_k instead of limit
  filters?: SearchFilters;
}

export interface SearchResponse {
  query: string;
  count: number;  // Backend returns count instead of totalResults
  results: any[];  // Backend returns array of {participant, score, rank}
  retrieval_time_ms: number;  // Backend uses snake_case
  method: string;  // Retrieval method (BM25, SBERT, Hybrid)
  filters?: Record<string, any>;
}

export interface GenerateOutreachRequest {
  participantId: string;
  projectName: string;
  projectDescription: string;
  tone?: string;
  length?: string;
}

export interface GenerateOutreachResponse {
  message: string;
  participant: Record<string, any>;
  metadata?: Record<string, any>;
}

