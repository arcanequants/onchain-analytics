'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';

// ============================================================================
// Types
// ============================================================================

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  filterType?: 'text' | 'select' | 'date' | 'number' | 'boolean';
  filterOptions?: { label: string; value: string }[];
  hidden?: boolean;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  key: string;
  value: string | number | boolean;
  operator?: 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalItems: number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  // Identification
  getRowId?: (row: T) => string | number;
  // Sorting
  sortable?: boolean;
  defaultSort?: SortConfig;
  onSortChange?: (sort: SortConfig | null) => void;
  // Filtering
  filterable?: boolean;
  filters?: FilterConfig[];
  onFilterChange?: (filters: FilterConfig[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  // Pagination
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number, pageSize: number) => void;
  totalItems?: number;
  // Selection
  selectable?: boolean;
  selectedIds?: Set<string | number>;
  onSelectionChange?: (selectedIds: Set<string | number>) => void;
  // Actions
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
  bulkActions?: React.ReactNode;
  // Styling
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
  className?: string;
  // Loading/Empty states
  loading?: boolean;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function compareValues(a: unknown, b: unknown, direction: 'asc' | 'desc'): number {
  const multiplier = direction === 'asc' ? 1 : -1;

  if (a === null || a === undefined) return 1 * multiplier;
  if (b === null || b === undefined) return -1 * multiplier;

  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b) * multiplier;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * multiplier;
  }

  if (a instanceof Date && b instanceof Date) {
    return (a.getTime() - b.getTime()) * multiplier;
  }

  return String(a).localeCompare(String(b)) * multiplier;
}

function matchesFilter<T>(row: T, filter: FilterConfig): boolean {
  const value = getNestedValue(row, filter.key);
  const filterValue = filter.value;

  switch (filter.operator || 'contains') {
    case 'eq':
      return value === filterValue;
    case 'contains':
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    case 'gt':
      return Number(value) > Number(filterValue);
    case 'lt':
      return Number(value) < Number(filterValue);
    case 'gte':
      return Number(value) >= Number(filterValue);
    case 'lte':
      return Number(value) <= Number(filterValue);
    default:
      return true;
  }
}

// ============================================================================
// Sub-components
// ============================================================================

interface TableHeaderCellProps {
  column: Column<unknown>;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  compact?: boolean;
}

function TableHeaderCell({ column, sortConfig, onSort, compact }: TableHeaderCellProps) {
  const isSorted = sortConfig?.key === column.key;
  const canSort = column.sortable !== false;

  return (
    <th
      className={`
        ${compact ? 'px-3 py-2' : 'px-4 py-3'}
        text-left text-xs font-medium text-gray-500 uppercase tracking-wider
        ${column.width ? '' : 'whitespace-nowrap'}
        ${canSort ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
        ${column.align === 'center' ? 'text-center' : ''}
        ${column.align === 'right' ? 'text-right' : ''}
      `}
      style={{ width: column.width }}
      onClick={() => canSort && onSort(column.key as string)}
    >
      <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : ''} ${column.align === 'center' ? 'justify-center' : ''}`}>
        <span>{column.header}</span>
        {canSort && (
          <span className="flex flex-col">
            {isSorted ? (
              sortConfig.direction === 'asc' ? (
                <ChevronUpIcon className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 text-blue-600" />
              )
            ) : (
              <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />
            )}
          </span>
        )}
      </div>
    </th>
  );
}

interface FilterBarProps {
  columns: Column<unknown>[];
  filters: FilterConfig[];
  onFilterChange: (filters: FilterConfig[]) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
}

function FilterBar({
  columns,
  filters,
  onFilterChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const filterableColumns = columns.filter(c => c.filterable);

  const updateFilter = (key: string, value: string) => {
    const existing = filters.findIndex(f => f.key === key);
    if (!value) {
      onFilterChange(filters.filter(f => f.key !== key));
    } else if (existing >= 0) {
      const updated = [...filters];
      updated[existing] = { ...updated[existing], value };
      onFilterChange(updated);
    } else {
      onFilterChange([...filters, { key, value, operator: 'contains' }]);
    }
  };

  const clearFilters = () => {
    onFilterChange([]);
    onSearchChange('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || 'Search...'}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        {filterableColumns.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center gap-2 px-3 py-2 border rounded-lg text-sm
              ${showFilters || filters.length > 0
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
            `}
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
            {filters.length > 0 && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {filters.length}
              </span>
            )}
          </button>
        )}

        {/* Clear All */}
        {(filters.length > 0 || searchValue) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Inputs */}
      {showFilters && filterableColumns.length > 0 && (
        <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {filterableColumns.map((col) => {
            const currentFilter = filters.find(f => f.key === col.key);

            if (col.filterType === 'select' && col.filterOptions) {
              return (
                <div key={col.key as string} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{col.header}</label>
                  <select
                    value={(currentFilter?.value as string) || ''}
                    onChange={(e) => updateFilter(col.key as string, e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    {col.filterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }

            return (
              <div key={col.key as string} className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">{col.header}</label>
                <input
                  type={col.filterType === 'number' ? 'number' : col.filterType === 'date' ? 'date' : 'text'}
                  value={(currentFilter?.value as string) || ''}
                  onChange={(e) => updateFilter(col.key as string, e.target.value)}
                  placeholder={`Filter ${col.header.toLowerCase()}...`}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 w-40"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function Pagination({
  page,
  pageSize,
  totalItems,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700">
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </span>

        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {getPageNumbers().map((p, i) => (
          <React.Fragment key={i}>
            {p === '...' ? (
              <span className="px-2 text-gray-400">...</span>
            ) : (
              <button
                onClick={() => onPageChange(p as number)}
                className={`
                  px-3 py-1.5 text-sm rounded
                  ${page === p
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'}
                `}
              >
                {p}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main DataTable Component
// ============================================================================

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  getRowId = (row) => (row.id as string | number) || JSON.stringify(row),
  // Sorting
  sortable = true,
  defaultSort,
  onSortChange,
  // Filtering
  filterable = true,
  filters: externalFilters,
  onFilterChange,
  searchable = true,
  searchPlaceholder,
  // Pagination
  paginated = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  totalItems: externalTotalItems,
  // Selection
  selectable = false,
  selectedIds: externalSelectedIds,
  onSelectionChange,
  // Actions
  onRowClick,
  rowActions,
  bulkActions,
  // Styling
  striped = true,
  hoverable = true,
  compact = false,
  stickyHeader = false,
  className = '',
  // States
  loading = false,
  emptyState,
  loadingState,
}: DataTableProps<T>) {
  // Internal state
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(defaultSort || null);
  const [internalFilters, setInternalFilters] = useState<FilterConfig[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string | number>>(new Set());

  // Use external or internal state
  const filters = externalFilters ?? internalFilters;
  const selectedIds = externalSelectedIds ?? internalSelectedIds;

  const handleFilterChange = useCallback((newFilters: FilterConfig[]) => {
    if (onFilterChange) {
      onFilterChange(newFilters);
    } else {
      setInternalFilters(newFilters);
    }
    setPage(1);
  }, [onFilterChange]);

  const handleSelectionChange = useCallback((newSelection: Set<string | number>) => {
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    } else {
      setInternalSelectedIds(newSelection);
    }
  }, [onSelectionChange]);

  // Filter, search, and sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const value = getNestedValue(row, col.key as string);
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply filters
    filters.forEach((filter) => {
      result = result.filter((row) => matchesFilter(row, filter));
    });

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) =>
        compareValues(
          getNestedValue(a, sortConfig.key),
          getNestedValue(b, sortConfig.key),
          sortConfig.direction
        )
      );
    }

    return result;
  }, [data, columns, searchValue, filters, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return processedData;

    const start = (page - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, paginated, page, pageSize]);

  const totalItems = externalTotalItems ?? processedData.length;

  // Handlers
  const handleSort = useCallback((key: string) => {
    const newSort: SortConfig | null =
      sortConfig?.key === key
        ? sortConfig.direction === 'asc'
          ? { key, direction: 'desc' }
          : null
        : { key, direction: 'asc' };

    setSortConfig(newSort);
    onSortChange?.(newSort);
  }, [sortConfig, onSortChange]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    onPageChange?.(newPage, pageSize);
  }, [pageSize, onPageChange]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    onPageChange?.(1, newSize);
  }, [onPageChange]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedData.length) {
      handleSelectionChange(new Set());
    } else {
      handleSelectionChange(new Set(paginatedData.map(getRowId)));
    }
  }, [paginatedData, selectedIds, handleSelectionChange, getRowId]);

  const handleSelectRow = useCallback((rowId: string | number) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(rowId)) {
      newSelection.delete(rowId);
    } else {
      newSelection.add(rowId);
    }
    handleSelectionChange(newSelection);
  }, [selectedIds, handleSelectionChange]);

  // Visible columns
  const visibleColumns = columns.filter((c) => !c.hidden);

  // Render
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Filter/Search Bar */}
      {(filterable || searchable) && (
        <div className="px-4 py-3 border-b border-gray-200">
          <FilterBar
            columns={visibleColumns as Column<unknown>[]}
            filters={filters}
            onFilterChange={handleFilterChange}
            searchValue={searchValue}
            onSearchChange={(v) => { setSearchValue(v); setPage(1); }}
            searchPlaceholder={searchPlaceholder}
          />
        </div>
      )}

      {/* Bulk Actions */}
      {selectable && selectedIds.size > 0 && bulkActions && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
          <span className="text-sm text-blue-700 font-medium">
            {selectedIds.size} selected
          </span>
          {bulkActions}
          <button
            onClick={() => handleSelectionChange(new Set())}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={`bg-gray-50 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {selectable && (
                <th className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} w-10`}>
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {visibleColumns.map((col) => (
                <TableHeaderCell
                  key={col.key as string}
                  column={col as Column<unknown>}
                  sortConfig={sortable ? sortConfig : null}
                  onSort={handleSort}
                  compact={compact}
                />
              ))}
              {rowActions && (
                <th className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} w-20`}>
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              // Loading state
              loadingState ? (
                <tr>
                  <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}>
                    {loadingState}
                  </td>
                </tr>
              ) : (
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {selectable && (
                      <td className={compact ? 'px-3 py-2' : 'px-4 py-3'}>
                        <div className="h-4 w-4 bg-gray-200 rounded" />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td key={col.key as string} className={compact ? 'px-3 py-2' : 'px-4 py-3'}>
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </td>
                    ))}
                    {rowActions && (
                      <td className={compact ? 'px-3 py-2' : 'px-4 py-3'}>
                        <div className="h-4 w-16 bg-gray-200 rounded" />
                      </td>
                    )}
                  </tr>
                ))
              )
            ) : paginatedData.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={visibleColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  {emptyState || (
                    <div className="text-gray-500">
                      <p className="text-lg font-medium">No data found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              // Data rows
              paginatedData.map((row, index) => {
                const rowId = getRowId(row);
                const isSelected = selectedIds.has(rowId);

                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick?.(row)}
                    className={`
                      ${striped && index % 2 === 1 ? 'bg-gray-50' : ''}
                      ${hoverable ? 'hover:bg-gray-100' : ''}
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''}
                    `}
                  >
                    {selectable && (
                      <td
                        className={compact ? 'px-3 py-2' : 'px-4 py-3'}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => {
                      const value = getNestedValue(row, col.key as string);
                      const content = col.render
                        ? col.render(value, row, index)
                        : String(value ?? '');

                      return (
                        <td
                          key={col.key as string}
                          className={`
                            ${compact ? 'px-3 py-2' : 'px-4 py-3'}
                            text-sm text-gray-900
                            ${col.align === 'center' ? 'text-center' : ''}
                            ${col.align === 'right' ? 'text-right' : ''}
                          `}
                        >
                          {content}
                        </td>
                      );
                    })}
                    {rowActions && (
                      <td
                        className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-right`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {rowActions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalItems > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          pageSizeOptions={pageSizeOptions}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}

// ============================================================================
// Utility Exports
// ============================================================================

export function useDataTable<T>({
  defaultSort,
  defaultPageSize = 10,
}: {
  defaultSort?: SortConfig;
  defaultPageSize?: number;
} = {}) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(defaultSort || null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  const reset = useCallback(() => {
    setSortConfig(defaultSort || null);
    setFilters([]);
    setPage(1);
    setSelectedIds(new Set());
  }, [defaultSort]);

  return {
    sortConfig,
    setSortConfig,
    filters,
    setFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    selectedIds,
    setSelectedIds,
    reset,
  };
}

export default DataTable;
