import React, { useEffect, useRef, useCallback, useState } from 'react'
import { DBQueryResult } from 'electron/main/vector-database/schema'
import posthog from 'posthog-js'
import { FaSearch } from 'react-icons/fa'
import { debounce } from 'lodash'
import { DBSearchPreview } from '../File/DBResultPreview'
import { useContentContext } from '@/contexts/ContentContext'

type SearchType = 'vector' | 'text' | 'hybrid'

interface SearchComponentProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: { vectorResults: DBQueryResult[]; textResults: DBQueryResult[] }
  setSearchResults: (results: { vectorResults: DBQueryResult[]; textResults: DBQueryResult[] }) => void
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
}) => {
  const { openContent: openTabContent } = useContentContext()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchType, setSearchType] = useState<SearchType>('vector')

  const handleSearch = useCallback(
    async (query: string) => {
      const results = await window.database.multiModalSearch(query, 50, searchType)
      setSearchResults(results)
    },
    [setSearchResults, searchType],
  )

  const debouncedSearch = useCallback(
    (query: string) => {
      const debouncedFn = debounce(() => handleSearch(query), 300)
      debouncedFn()
    },
    [handleSearch],
  )

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery)
    }
  }, [searchQuery, debouncedSearch, searchType])

  const openFileSelectSearch = useCallback(
    (path: string) => {
      openTabContent(path)
      posthog.capture('open_file_from_search')
    },
    [openTabContent],
  )

  return (
    <div className="h-below-titlebar overflow-y-auto overflow-x-hidden p-1">
      <div className="relative mr-1 rounded bg-neutral-800 p-2">
        <span className="absolute inset-y-0 left-0 mt-[2px] flex items-center pl-3">
          <FaSearch className="text-lg text-gray-200" size={14} />
        </span>
        <input
          ref={searchInputRef}
          type="text"
          className="mr-1 mt-1 h-8 w-full rounded-md border border-transparent bg-neutral-700 pl-7 pr-5 text-white focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Semantic search..."
        />
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as SearchType)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-neutral-700 text-white"
        >
          <option value="vector">Vector</option>
          <option value="text">Text</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      <div className="mt-2 w-full">
        {searchResults?.textResults?.length > 0 && (
          <div className="mt-4 w-full">
            <h3 className="mb-2 text-white">Text Search Results</h3>
            {searchResults.textResults.map((result, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <DBSearchPreview key={`text-${index}`} dbResult={result} onSelect={openFileSelectSearch} />
            ))}
          </div>
        )}
        {searchResults?.vectorResults?.length > 0 && (
          <div className="w-full">
            <h3 className="mb-2 text-white">Vector Search Results</h3>
            {searchResults.vectorResults.map((result, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <DBSearchPreview key={`vector-${index}`} dbResult={result} onSelect={openFileSelectSearch} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchComponent
