"use client";

import { Grid, Column, DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@carbon/react";
import { useEffect, useState } from "react";

export default function MonitoringPage() {
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/dashboard/trades");
        if (res.ok) setTrades(await res.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchTrades();
  }, []);

  const headers = [
    { key: "entry_time", header: "Entry Time" },
    { key: "symbol", header: "Symbol" },
    { key: "direction", header: "Direction" },
    { key: "entry_price", header: "Entry Price" },
    { key: "size", header: "Lot Size" },
    { key: "status", header: "Status" },
    { key: "pnl", header: "Realized PnL" },
  ];

  return (
    <Grid>
      <Column lg={16} md={8} sm={4} className="landing-page__banner">
        <h1 style={{ marginBottom: "1rem" }}>Monitoring & History</h1>
        <p style={{ marginBottom: "2rem" }}>View live open positions and historical trades.</p>
      </Column>
      
      <Column lg={16} md={8} sm={4}>
        <DataTable rows={trades} headers={headers}>
          {({ rows, headers, getHeaderProps, getTableProps }: any) => (
            <TableContainer title="Trade History" description="Executed and pending trades in MT5">
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header: any) => (
                      <TableHeader {...getHeaderProps({ header })} key={header.key}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row: any) => (
                    <TableRow key={row.id}>
                      {row.cells.map((cell: any) => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </Column>
    </Grid>
  );
}
