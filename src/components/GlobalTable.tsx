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
import { View } from '@carbon/icons-react';

interface GlobalTableProps {
  title: React.ReactNode;
  headers: Array<{ key: string; header: string }>;
  fetchUrl?: string; // If provided, uses server-side logic
  initialData?: any[]; // Fallback for local logic
  formatCell?: (cellId: string, value: any) => React.ReactNode;
  toolbarActions?: React.ReactNode; // Extra buttons for toolbar
  onViewDetails?: (rowId: any) => void;
}

export default function GlobalTable({
  title,
  headers,
  fetchUrl,
  initialData = [],
  formatCell,
  toolbarActions,
  onViewDetails
}: GlobalTableProps) {
  // State
  const [data, setData] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  
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

  // Effect to re-fetch on Server Side when params change
  useEffect(() => {
    if (isServerSide) {
      fetchData();
    }
  }, [fetchData, isServerSide]);

  // Derived state for Client Side
  const processedData = useMemo(() => {
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

    setTotalItems(result.length); // Update total for pagination

    // Pagination
    const skip = (page - 1) * pageSize;
    return result.slice(skip, skip + pageSize);
  }, [isServerSide, data, initialData, search, sortKey, sortDesc, page, pageSize]);

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
          <TableContainer title={title}>
            <TableToolbar>
              <TableToolbarContent>
                <TableToolbarSearch 
                  onChange={handleSearch} 
                  placeholder="Search records..." 
                  persistent 
                />
                {toolbarActions}
              </TableToolbarContent>
            </TableToolbar>
            
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {tableHeaders.map((header: any) => (
                    <TableHeader 
                      {...getHeaderProps({ header })} 
                      key={header.key}
                      isSortable
                      isSortHeader={sortKey === header.key}
                      sortDirection={sortKey === header.key ? (sortDesc ? "DESC" : "ASC") : "NONE"}
                      onClick={() => handleSort(header.key)}
                      style={{ cursor: "pointer" }}
                    >
                      {header.header}
                    </TableHeader>
                  ))}
                  {onViewDetails && (
                    <TableHeader>Actions</TableHeader>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row: any) => (
                  <TableRow key={row.id}>
                    {row.cells.map((cell: any) => (
                      <TableCell key={cell.id} style={{ fontSize: "12px", padding: "0.5rem" }}>
                        {formatCell ? formatCell(cell.id, cell.value) : cell.value}
                      </TableCell>
                    ))}
                    {onViewDetails && (
                      <TableCell style={{ padding: "0.2rem" }}>
                        <Button 
                          kind="ghost" 
                          size="sm" 
                          hasIconOnly 
                          renderIcon={() => <View size={16} fill="#4589ff" />} 
                          iconDescription="View Details" 
                          onClick={() => onViewDetails(row.id)} 
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
          </TableContainer>
        )}
      </DataTable>

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
    </div>
  );
}
