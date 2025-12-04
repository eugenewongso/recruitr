/**
 * Match Quality Utilities
 *
 * Converts RRF (Reciprocal Rank Fusion) scores to user-friendly labels and colors.
 * RRF scores typically range from 0.009 to 0.033, which look misleadingly low as percentages.
 */

export interface MatchInfo {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

/**
 * Get match quality label and styling based on RRF score.
 *
 * @param score - RRF score (typically 0.009 to 0.033)
 * @returns Match information with label and Tailwind CSS classes
 */
export function getMatchLabel(score: number): MatchInfo {
  // RRF scores typically range from 0.009 to 0.033
  // Higher scores = better matches

  if (score >= 0.028) {
    return {
      label: "Excellent Match",
      colorClass: "text-green-700",
      bgClass: "bg-green-50",
      borderClass: "border-green-200",
    };
  }

  if (score >= 0.023) {
    return {
      label: "Great Match",
      colorClass: "text-blue-700",
      bgClass: "bg-blue-50",
      borderClass: "border-blue-200",
    };
  }

  if (score >= 0.018) {
    return {
      label: "Good Match",
      colorClass: "text-teal-700",
      bgClass: "bg-teal-50",
      borderClass: "border-teal-200",
    };
  }

  if (score >= 0.013) {
    return {
      label: "Fair Match",
      colorClass: "text-amber-700",
      bgClass: "bg-amber-50",
      borderClass: "border-amber-200",
    };
  }

  return {
    label: "Possible Match",
    colorClass: "text-gray-700",
    bgClass: "bg-gray-50",
    borderClass: "border-gray-200",
  };
}
