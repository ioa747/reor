
import React, { useEffect, useRef } from "react";

import { DBQueryResult } from "electron/main/database/Schema";
import posthog from "posthog-js";
import { FaSearch } from "react-icons/fa";

import { DBSearchPreview } from "../File/DBResultPreview";

interface SearchComponentProps {
  onFileSelect: (path: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: DBQueryResult[];
  setSearchResults: (results: DBQueryResult[]) => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  onFileSelect,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null); // Reference for the input field

  const handleSearch = async (query: string) => {
    const results: DBQueryResult[] = await window.database.search(query, 50);
    setSearchResults(results);
  };

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);
  const debouncedSearch = debounce((query: string) => handleSearch(query), 300);

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery]);

  const openFileSelectSearch = (path: string) => {
    onFileSelect(path);
    posthog.capture("open_file_from_search")
  }

  return (
    <div className="p-1 h-below-titlebar overflow-y-auto overflow-x-hidden">
      <div className="relative p-2 bg-neutral-800 rounded mr-1">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 mt-[2px]">
          <FaSearch className="text-gray-200 text-lg" size={14} />
        </span>
        <input
          ref={searchInputRef}
          type="text"
          className="mt-1 w-full pl-7 mr-1 pr-5 h-8 bg-neutral-700 text-white rounded-md border border-transparent focus:outline-none focus:border-white focus:ring-1 focus:ring-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Semantic search..."
        />
      </div>
      <div className="mt-2 w-full">
        {searchResults.length > 0 && (
          <div className="w-full">
            {searchResults.map((result, index) => (
              <DBSearchPreview
                key={index}
                dbResult={result}
                onSelect={openFileSelectSearch}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const debounce = <F extends (...args: string[]) => Promise<void>>(
  func: F,
  delay: number
): ((...args: Parameters<F>) => void) => {
  let debounceTimer: NodeJS.Timeout;

  return (...args: Parameters<F>) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func(...args), delay);
  };
};

export default SearchComponent;
