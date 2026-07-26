'use client';

import * as React from 'react';
import { ToggleLeft, ToggleRight, Filter, Search } from 'lucide-react';

interface MapToolbarProps {
  showSuppliers: boolean;
  setShowSuppliers: (val: boolean) => void;
  showFacilities: boolean;
  setShowFacilities: (val: boolean) => void;
  selectedMode: string;
  setSelectedMode: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export function MapToolbar({
  showSuppliers,
  setShowSuppliers,
  showFacilities,
  setShowFacilities,
  selectedMode,
  setSelectedMode,
  searchQuery,
  setSearchQuery,
}: MapToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-card border rounded-md mb-2 text-sm justify-between">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-medium">Layers:</span>
          <button
            onClick={() => setShowSuppliers(!showSuppliers)}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            {showSuppliers ? (
              <ToggleRight className="text-primary h-5 w-5" />
            ) : (
              <ToggleLeft className="text-muted-foreground h-5 w-5" />
            )}
            <span>Suppliers</span>
          </button>
          <button
            onClick={() => setShowFacilities(!showFacilities)}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            {showFacilities ? (
              <ToggleRight className="text-primary h-5 w-5" />
            ) : (
              <ToggleLeft className="text-muted-foreground h-5 w-5" />
            )}
            <span>Facilities</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="rounded border bg-background px-2 py-1 text-xs"
            aria-label="Filter routes by transport mode"
          >
            <option value="ALL">All Modes</option>
            <option value="TRUCK">Truck</option>
            <option value="RAIL">Rail</option>
            <option value="AIR">Air</option>
            <option value="SEA">Sea</option>
          </select>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 pr-3 py-1 text-xs rounded border bg-background w-48 focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Search map markers"
        />
      </div>
    </div>
  );
}
