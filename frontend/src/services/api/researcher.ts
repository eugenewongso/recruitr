/**
 * Researcher API client
 */

import apiClient from "./base";

export interface SearchParams {
  query: string;
  top_k?: number;
  page?: number;
  limit?: number;
  filters?: {
    remote?: boolean;
    company_size?: string;
    location?: string;
  };
}

export interface SearchResponse {
  results: any[];
  count: number;
  total_count: number;
  retrieval_time_ms: number;
  method: string;
  query: string;
  page: number;
  limit: number;
  total_pages: number;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  participant_name: string;
}

export interface GenerateOutreachResponse {
  emails: GeneratedEmail[];
  count: number;
}

/**
 * Search for participants
 */
export const searchParticipants = async (
  params: SearchParams
): Promise<SearchResponse> => {
  const response = await apiClient.post("/researcher/search", params);
  return response.data;
};

/**
 * Save a participant
 */
export const saveParticipant = async (participantId: string): Promise<void> => {
  await apiClient.post(`/researcher/save/${participantId}`, {});
};

/**
 * Unsave a participant
 */
export const unsaveParticipant = async (
  participantId: string
): Promise<void> => {
  await apiClient.delete(`/researcher/save/${participantId}`);
};

/**
 * Get saved participants
 */
export const getSavedParticipants = async (): Promise<any[]> => {
  const response = await apiClient.get("/researcher/saved");
  return response.data;
};

/**
 * Generate outreach emails for participants
 */
export const generateOutreach = async (
  participantIds: string[]
): Promise<GenerateOutreachResponse> => {
  const response = await apiClient.post("/researcher/generate-outreach", {
    participant_ids: participantIds,
  });
  return response.data;
};

/**
 * Search history types and functions
 */
export interface SearchHistoryItem {
  id: string;
  user_id: string;
  query_text: string;
  filters?: Record<string, any>;
  search_type: string;
  results_count: number;
  top_result_ids?: string[];
  created_at: string;
}

export interface SearchHistoryResponse {
  history: SearchHistoryItem[];
  count: number;
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface LogSearchRequest {
  query_text: string;
  filters?: Record<string, any>;
  search_type?: string;
  results_count: number;
  top_result_ids?: string[];
}

/**
 * Log a search to history
 */
export const logSearch = async (data: LogSearchRequest): Promise<void> => {
  await apiClient.post("/researcher/searches/log", data);
};

/**
 * Get search history
 */
export const getSearchHistory = async (
  page: number = 1,
  limit: number = 10
): Promise<SearchHistoryResponse> => {
  const response = await apiClient.get("/researcher/searches", {
    params: { page, limit },
  });
  return response.data;
};

/**
 * Delete a search from history
 */
export const deleteSearchHistory = async (searchId: string): Promise<void> => {
  await apiClient.delete(`/researcher/searches/${searchId}`);
};

/**
 * Re-run a search from history
 */
export const rerunSearch = async (
  historyItem: SearchHistoryItem
): Promise<SearchResponse> => {
  const params: SearchParams = {
    query: historyItem.query_text,
    filters: historyItem.filters,
  };
  return searchParticipants(params);
};

/**
 * Analytics types and functions
 */
export interface AnalyticsStats {
  total_searches: number;
  searches_this_month: number;
  recent_searches: number;
  saved_participants: number;
  high_quality_matches: number;
}

export interface AnalyticsInsights {
  most_active_day: string;
  avg_matches_per_search: number;
  most_searched_role: string;
  most_used_tool_filter: string;
}

export interface ActivityDataPoint {
  date: string;
  count: number;
}

export interface AnalyticsResponse {
  stats: AnalyticsStats;
  insights: AnalyticsInsights;
  activity_data: ActivityDataPoint[];
}

/**
 * Get analytics data
 */
export const getAnalytics = async (): Promise<AnalyticsResponse> => {
  const response = await apiClient.get("/researcher/analytics");
  return response.data;
};

/**
 * Notifications types and functions
 */
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "alert" | "warning";
  related_entity_type?: string;
  related_entity_id?: string;
  read: boolean;
  created_at: string;
  read_at?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  count: number;
  unread_count: number;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type?: "info" | "success" | "alert" | "warning";
  related_entity_type?: string;
  related_entity_id?: string;
}

/**
 * Get notifications
 */
export const getNotifications = async (
  limit: number = 50,
  unreadOnly: boolean = false
): Promise<NotificationsResponse> => {
  const response = await apiClient.get("/researcher/notifications", {
    params: { limit, unread_only: unreadOnly },
  });
  return response.data;
};

/**
 * Create a notification
 */
export const createNotification = async (
  data: CreateNotificationRequest
): Promise<Notification> => {
  const response = await apiClient.post("/researcher/notifications", data);
  return response.data;
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (
  notificationId: string
): Promise<void> => {
  await apiClient.patch(`/researcher/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (): Promise<void> => {
  await apiClient.post("/researcher/notifications/mark-all-read");
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  notificationId: string
): Promise<void> => {
  await apiClient.delete(`/researcher/notifications/${notificationId}`);
};

/**
 * Profile types and functions
 */
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  company_name?: string;
  job_title?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  company_name?: string;
  job_title?: string;
}

/**
 * Get current user's profile
 */
export const getProfile = async (): Promise<Profile> => {
  const response = await apiClient.get("/researcher/profile");
  return response.data;
};

/**
 * Update current user's profile
 */
export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<Profile> => {
  const response = await apiClient.put("/researcher/profile", data);
  return response.data;
};
