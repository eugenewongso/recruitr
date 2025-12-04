import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes.
 * Combines clsx for optimal Tailwind class merging.
 *
 * @param inputs - Class names or class objects
 * @returns Merged class string
 *
 * @example
 * cn("px-2 py-1", "bg-red-500", { "text-white": true })
 * // Returns: "px-2 py-1 bg-red-500 text-white"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
