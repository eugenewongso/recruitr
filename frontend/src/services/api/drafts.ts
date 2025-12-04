/**
 * Drafts API client
 */

import apiClient from "./base";

export interface OutreachDraft {
  id: string;
  user_id: string;
  name: string;
  participant_ids: string[];
  participants: Array<{
    id: string;
    name: string;
    role: string;
    company_name?: string;
  }>;
  generated_emails?: Array<{
    subject: string;
    body: string;
    participant_name: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface SaveDraftRequest {
  name: string;
  participant_ids: string[];
  participants: Array<{
    id: string;
    name: string;
    role: string;
    company_name?: string;
  }>;
  generated_emails?: Array<{
    subject: string;
    body: string;
    participant_name: string;
  }>;
}

/**
 * Save an outreach draft
 */
export const saveDraft = async (data: SaveDraftRequest): Promise<OutreachDraft> => {
  const response = await apiClient.post("/researcher/drafts", data);
  return response.data;
};

/**
 * Get all drafts
 */
export const getDrafts = async (): Promise<{ drafts: OutreachDraft[]; count: number }> => {
  const response = await apiClient.get("/researcher/drafts");
  return response.data;
};

/**
 * Get a specific draft
 */
export const getDraft = async (draftId: string): Promise<OutreachDraft> => {
  const response = await apiClient.get(`/researcher/drafts/${draftId}`);
  return response.data;
};

/**
 * Update an existing draft
 */
export const updateDraft = async (draftId: string, data: SaveDraftRequest): Promise<OutreachDraft> => {
  const response = await apiClient.put(`/researcher/drafts/${draftId}`, data);
  return response.data;
};

/**
 * Delete a draft
 */
export const deleteDraft = async (draftId: string): Promise<void> => {
  await apiClient.delete(`/researcher/drafts/${draftId}`);
};

