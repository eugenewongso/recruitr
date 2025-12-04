/**
 * Recommendations API Service
 *
 * Handles fetching personalized search query suggestions.
 */

import apiClient from "./base";

export interface SearchSuggestion {
  suggestions: string[];
  is_personalized: boolean;
  based_on: {
    searches: number;
    saved_participants: number;
  };
}

/**
 * Get personalized search query suggestions for the current user.
 *
 * @param limit - Number of suggestions to fetch (default: 4)
 * @returns Promise resolving to search suggestions
 */
export const getSearchSuggestions = async (
  limit: number = 4
): Promise<SearchSuggestion> => {
  const response = await apiClient.get<SearchSuggestion>(
    "/researcher/search-suggestions",
    {
      params: { limit },
    }
  );
  return response.data;
};
