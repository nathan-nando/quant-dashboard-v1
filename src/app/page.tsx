"use client";

import { Grid, Column, Tile, Button, DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from "@carbon/react";
import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';

const CandlestickChart = dynamic(() => import('../components/CandlestickChart'), { ssr: false });

export default function Home() {
  const [state, setState] = useState<any>(null);
  const [signals, setSignals] = useState<any[]>([]);

  useEffect(() => {
    // 1. Subscribe to lightning-fast SSE for ALL live state (Price, Regime, Execution, Signals)
    const eventSource = new EventSource("http://127.0.0.1:8000/api/dashboard/stream");
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setState(payload);
        if (payload.recent_signals) {
          setSignals(payload.recent_signals);
        }
      } catch (err) {
        console.error("Failed to parse SSE state data", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const signalHeaders = [
    { key: "timestamp", header: "Time" },
    { key: "symbol", header: "Symbol" },
    { key: "direction", header: "Signal" },
    { key: "status", header: "Status" },
  ];

  return (
    <Grid>
      
      <Column lg={4} md={4} sm={4}>
        <Tile>
          <h4>Live Price (Bid / Ask)</h4>
          <h2 style={{marginTop: "1rem"}}>
            {state?.price ? (
              <>
                <span style={{color: "#24a148"}}>{state.price.bid?.toFixed(2) || "0.00"}</span>
                <span style={{color: "#6f6f6f", margin: "0 8px"}}>/</span>
                <span style={{color: "#fa4d56"}}>{state.price.ask?.toFixed(2) || "0.00"}</span>
              </>
            ) : "Loading..."}
          </h2>
        </Tile>
      </Column>
      
      <Column lg={4} md={4} sm={4}>
        <Tile>
          <h4>Regime</h4>
          <h2 style={{marginTop: "1rem", color: "#4589ff"}}>{state?.regime || "UNKNOWN"}</h2>
        </Tile>
      </Column>

      <Column lg={4} md={4} sm={4}>
        <Tile>
          <h4>Auto Execution</h4>
          <h2 style={{marginTop: "1rem", color: state?.auto_execution ? "#24a148" : "#fa4d56"}}>
            {state?.auto_execution ? "ACTIVE" : "DISABLED"}
          </h2>
        </Tile>
      </Column>

      <Column lg={16} md={8} sm={4} style={{marginTop: "2rem"}}>
        <Tile style={{ padding: 0, overflow: 'hidden' }}>
          <CandlestickChart symbol="XAUUSD" />
        </Tile>
      </Column>

      <Column lg={16} md={8} sm={4} style={{marginTop: "2rem"}}>
        <DataTable rows={signals} headers={signalHeaders}>
          {({ rows, headers, getHeaderProps, getTableProps }: any) => (
            <TableContainer title={<span style={{ fontSize: "14px", fontWeight: "normal" }}>Recent Signals</span>}>
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
