"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Pagination,
  Button
} from '@carbon/react';
import { View, ChevronUp, ChevronDown, Renew } from '@carbon/icons-react';

interface GlobalTableProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  headers: Array<{ key: string; header: string; width?: string }>;
  fetchUrl?: string; // If provided, uses server-side logic
  initialData?: any[]; // Fallback for local logic
  formatCell?: (cellId: string, value: any) => React.ReactNode;
  toolbarActions?: React.ReactNode; // Extra buttons for toolbar
  onViewDetails?: (rowId: any) => void;
  onPageDataChange?: (currentData: any[]) => void;
  hideSearch?: boolean;
  hidePagination?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onReload?: () => void | Promise<void>;
  hideReload?: boolean;
  refreshTrigger?: any;
  compact?: boolean;
}

export default function GlobalTable({
  title,
  description,
  headers,
  fetchUrl,
  initialData = [],
  formatCell,
  toolbarActions,
  onViewDetails,
  onPageDataChange,
  hideSearch = false,
  hidePagination = false,
  collapsible = false,
  defaultCollapsed = false,
  onReload,
  hideReload = false,
  refreshTrigger,
  compact = false
}: GlobalTableProps) {
  // State
  const [data, setData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // Pagination & Filter & Sort state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(true); // default sort descending

  // For Local Mode
  const isServerSide = !!fetchUrl;

  const fetchData = useCallback(async () => {
    if (!fetchUrl) return; // Ignore if client-side
    
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const url = new URL(fetchUrl);
      url.searchParams.set("skip", skip.toString());
      url.searchParams.set("limit", pageSize.toString());
      if (search) url.searchParams.set("search", search);
      if (sortKey) {
        url.searchParams.set("sort_by", sortKey);
        url.searchParams.set("sort_desc", sortDesc ? "true" : "false");
      }

      const res = await fetch(url.toString());
      const result = await res.json();
      
      // Assume backend returns { data: [...], total_count: X } 
      // OR fallback if backend returns just an array
      if (result.data && typeof result.total_count !== 'undefined') {
        setData(result.data);
        setTotalItems(result.total_count);
      } else if (Array.isArray(result)) {
        setData(result);
        setTotalItems(result.length);
      }
    } catch (err) {
      console.error("Failed to fetch table data", err);
    } finally {
      setLoading(false);
    }
  }, [fetchUrl, page, pageSize, search, sortKey, sortDesc]);

  // Effect to re-fetch on Server Side when params change or refreshTrigger changes
  useEffect(() => {
    if (isServerSide) {
      fetchData();
    }
  }, [fetchData, isServerSide, refreshTrigger]);

  // Derived state for Client Side
  const filteredData = useMemo(() => {
    if (isServerSide) return data;
    
    let result = [...initialData];
    
    // Search
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(row => 
        Object.values(row).some(val => 
          String(val).toLowerCase().includes(lowerSearch)
        )
      );
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal < bVal) return sortDesc ? 1 : -1;
        if (aVal > bVal) return sortDesc ? -1 : 1;
        return 0;
      });
    }

    return result;
  }, [isServerSide, data, initialData, search, sortKey, sortDesc]);

  // Set total items for pagination safely outside render
  useEffect(() => {
    if (!isServerSide) {
      setTotalItems(filteredData.length);
    }
  }, [isServerSide, filteredData.length]);

  const processedData = useMemo(() => {
    if (isServerSide) return data;
    const skip = (page - 1) * pageSize;
    return filteredData.slice(skip, skip + pageSize);
  }, [isServerSide, data, filteredData, page, pageSize]);

  useEffect(() => {
    if (onPageDataChange) {
      onPageDataChange(processedData);
    }
  }, [processedData, onPageDataChange]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc); // Toggle direction
    } else {
      setSortKey(key);
      setSortDesc(true); // Default new column to desc
    }
    setPage(1); // Reset to first page
  };

  const handleSearch = (e: any, val?: string) => {
    setSearch(val !== undefined ? val : (e?.target?.value || ""));
    setPage(1);
  };

  return (
    <div style={{ position: 'relative' }}>
      <DataTable rows={processedData} headers={headers}>
        {({ rows, headers: tableHeaders, getHeaderProps, getTableProps }: any) => (
          <TableContainer 
            title={
              collapsible ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center', width: '100%' }} onClick={() => setIsCollapsed(!isCollapsed)}>
                  <span>{title}</span>
                  {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
              ) : title
            } 
            description={description}
          >
            {!isCollapsed && (
              <>
            {(!hideSearch || toolbarActions) && (
              <TableToolbar>
                <TableToolbarContent>
                  {!hideSearch && (
                    <TableToolbarSearch 
                      onChange={handleSearch} 
                      placeholder="Search records..." 
                      persistent 
                    />
                  )}
                  {(!hideReload && (isServerSide || onReload)) && (
                    <Button 
                      kind="ghost" 
                      size="sm" 
                      renderIcon={Renew} 
                      iconDescription="Reload" 
                      hasIconOnly 
                      onClick={async () => {
                        if (isServerSide) {
                          await fetchData();
                        } else if (onReload) {
                          await onReload();
                        }
                      }} 
                    />
                  )}
                  {toolbarActions}
                </TableToolbarContent>
              </TableToolbar>
            )}
            
            <Table {...getTableProps()} size="xs">
              <TableHead>
                <TableRow>
                  {tableHeaders.map((header: any) => {
                    const origHeader = headers.find(h => h.key === header.key);
                    const w = origHeader?.width;
                    return (
                    <TableHeader 
                      {...getHeaderProps({ header })} 
                      key={header.key}
                      isSortable
                      isSortHeader={sortKey === header.key}
                      sortDirection={sortKey === header.key ? (sortDesc ? "DESC" : "ASC") : "NONE"}
                      onClick={() => handleSort(header.key)}
                      style={{ 
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        fontSize: compact ? "9.5px" : "inherit",
                        padding: compact ? "0.3rem" : "inherit",
                        ...(w ? { width: w } : {})
                      }}
                    >
                      {header.header}
                    </TableHeader>
                    );
                  })}
                  {onViewDetails && (
                    <TableHeader style={{ textAlign: "center", width: "50px", fontSize: compact ? "9.5px" : "inherit", padding: compact ? "0.3rem" : "inherit" }}>Actions</TableHeader>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row: any) => (
                  <TableRow key={row.id}>
                    {row.cells.map((cell: any) => {
                      const colKey = cell.id.split(':').pop();
                      const headerConf = headers.find(h => h.key === colKey);
                      return (
                        <TableCell key={cell.id} style={{ 
                          fontSize: compact ? "9.5px" : "11px", 
                          padding: compact ? "0.15rem 0.3rem" : "0.4rem",
                          ...(headerConf?.width ? { width: headerConf.width } : {})
                        }}>
                          {formatCell ? formatCell(cell.id, cell.value) : cell.value}
                        </TableCell>
                      );
                    })}
                    {onViewDetails && (
                      <TableCell style={{ padding: compact ? "0.15rem" : "0.2rem", textAlign: "center", width: "50px" }}>
                        <Button 
                          kind="ghost" 
                          size="sm" 
                          hasIconOnly 
                          tooltipPosition="left"
                          tooltipAlignment="center"
                          renderIcon={() => <View size={compact ? 12 : 16} fill="#4589ff" />} 
                          iconDescription="View Details" 
                          onClick={() => onViewDetails(row.id)} 
                          style={{
                            height: compact ? '24px' : 'auto',
                            width: compact ? '24px' : 'auto',
                            minHeight: compact ? '24px' : 'auto'
                          }}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={headers.length + (onViewDetails ? 1 : 0)} style={{ textAlign: "center", padding: "2rem" }}>
                      {loading ? "Loading..." : "No data available"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
              </>
            )}
          </TableContainer>
        )}
      </DataTable>

      {!isCollapsed && !hidePagination && (
        <Pagination
          totalItems={totalItems}
          page={page}
          pageSize={pageSize}
          pageSizes={[5, 10, 20, 50, 100]}
          onChange={(data: any) => {
            setPage(data.page);
            setPageSize(data.pageSize);
          }}
        />
      )}
    </div>
  );
}
