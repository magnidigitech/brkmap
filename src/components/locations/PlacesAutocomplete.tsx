'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, Plus, Building2, Landmark, Home, Stethoscope, Sparkles } from 'lucide-react';
import { PlaceSearchResult } from '@/lib/google/places';

interface PlacesAutocompleteProps {
  onSelectPlace: (place: PlaceSearchResult) => void;
  placeholder?: string;
}

export default function PlacesAutocomplete({
  onSelectPlace,
  placeholder = 'Search Google Maps location (e.g., Tadikonda party office, Mangalagiri)...',
}: PlacesAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val || val.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    try {
      const res = await fetch(`/api/locations?q=${encodeURIComponent(val)}&google=true`);
      const data = await res.json();
      if (data.success && data.places) {
        setResults(data.places);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Error fetching place suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (place: PlaceSearchResult) => {
    setQuery(place.name);
    setIsOpen(false);
    onSelectPlace(place);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'PARTY_OFFICE':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'GOVERNMENT_OFFICE':
        return <Landmark className="w-4 h-4 text-amber-600" />;
      case 'RESIDENCE':
        return <Home className="w-4 h-4 text-emerald-600" />;
      case 'HOSPITAL':
        return <Stethoscope className="w-4 h-4 text-rose-600" />;
      default:
        return <MapPin className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-sm"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100 max-h-64 overflow-y-auto">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            <span>Google Places (New) Suggestions</span>
            <span className="flex items-center gap-1 text-blue-600"><Sparkles className="w-3 h-3" /> Live Search</span>
          </div>

          {results.length === 0 && !loading ? (
            <div className="p-3 text-center text-xs text-slate-500">
              No matching locations found for "{query}".
            </div>
          ) : (
            results.map((place) => (
              <div
                key={place.placeId}
                onClick={() => handleSelect(place)}
                className="p-2.5 hover:bg-blue-50 cursor-pointer transition-colors flex items-start gap-2.5 group"
              >
                <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-700 transition-colors">
                  {getCategoryIcon(place.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                    {place.name}
                  </h5>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{place.formattedAddress}</p>
                </div>
                <button
                  type="button"
                  className="p-1 rounded-md text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
