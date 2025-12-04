/**
 * Search bar component for natural language queries.
 * 
 * TODO: Implement search bar with input and button.
 */

import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading = false }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe your ideal participant... (e.g., 'Find remote product managers who use Trello')"
          className="input min-h-[100px] resize-none pr-24"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="btn-primary absolute bottom-4 right-4"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {/* TODO: Add quick filter buttons (remote, tools, etc.) */}
      {/* TODO: Add example queries */}
    </form>
  );
};

export default SearchBar;

