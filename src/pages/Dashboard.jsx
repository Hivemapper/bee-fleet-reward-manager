import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";

function MaskedId({ value }) {
  const [visible, setVisible] = useState(false);
  if (!value || value === "—") return "—";
  const masked = value.slice(0, -4) + "****";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{visible ? value : masked}</span>
      <button
        className="text-primary hover:underline text-[11px]"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </span>
  );
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmt(date) {
  return date.toISOString().slice(0, 10);
}

function mountBadgeVariant(rating) {
  if (rating == null) return "outline";
  if (rating >= 4) return "default";
  if (rating >= 2) return "secondary";
  return "destructive";
}

export default function Dashboard({ hasApiKey, onGoToSettings, onSelectDriver }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const week = fmt(getMonday(new Date()));
    try {
      // Fetch devices
      const devRes = await fetch("/api/devices");
      if (devRes.status === 401) {
        const errData = await devRes.json().catch(() => ({}));
        setError(errData.error || "API key not configured.");
        setLoading(false);
        return;
      }
      if (!devRes.ok) {
        setError("Failed to load devices from Bee Maps API.");
        setLoading(false);
        return;
      }
      const devData = await devRes.json();
      const devices = devData.devices || [];

      // Fetch rewards for current week
      const rewRes = await fetch(`/api/rewards?rewardPeriod=${week}`);
      const rewData = rewRes.ok ? await rewRes.json() : {};
      const rewardsList = rewData.devicesWithRewards || [];

      // Index rewards by device id
      const rewardsById = {};
      for (const r of rewardsList) {
        if (r.device?.id) rewardsById[r.device.id] = r;
      }

      // Fetch locations for all devices in parallel
      const locationResults = await Promise.all(
        devices.map(async (d) => {
          try {
            const res = await fetch(`/api/location?deviceId=${d.id}`);
            if (!res.ok) return { id: d.id, location: null };
            const data = await res.json();
            return {
              id: d.id,
              city: data.city || "",
              state: data.state || "",
              country: data.country || "",
              timestamp: data.timestamp,
            };
          } catch {
            return { id: d.id, location: null };
          }
        })
      );
      const locById = {};
      for (const loc of locationResults) {
        locById[loc.id] = loc;
      }

      // Build rows
      setRows(
        devices.map((d) => {
          const rw = rewardsById[d.id] || {};
          const loc = locById[d.id] || {};
          return {
            id: d.id,
            name: (d.name || "—").trim(),
            description: d.description || "",
            serialNumber: d.serialNumber || "—",
            vehiclePlate: d.vehiclePlate || "",
            city: loc.city || "",
            state: loc.state || "",
            country: loc.country || "",
            lastSeen: loc.timestamp || null,
            honeyRewards: rw.rewardAmountHoney ?? null,
            mountRating: rw.rewardMountRating ?? null,
          };
        })
      );
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasApiKey) fetchData();
    else setLoading(false);
  }, [hasApiKey, fetchData]);

  if (!hasApiKey) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">No API key configured.</p>
          <Button variant="outline" onClick={onGoToSettings}>
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    );
  }

  function formatLocation(row) {
    if (row.city || row.state) {
      const parts = [row.city, row.state].filter(Boolean);
      return parts.join(", ");
    }
    return "—";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fleet Drivers</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading...
          </div>
        ) : error ? (
          <div className="py-4 px-4 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">
            No devices found.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead className="text-right">HONEY</TableHead>
                <TableHead className="text-center">Mount Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <button
                      className="font-medium text-primary hover:underline text-left"
                      onClick={() => onSelectDriver(row)}
                    >
                      {row.name}
                    </button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatLocation(row)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <MaskedId value={row.serialNumber} />
                  </TableCell>
                  <TableCell className="text-right">
                    {row.honeyRewards != null
                      ? row.honeyRewards.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.mountRating != null ? (
                      <Badge variant={mountBadgeVariant(row.mountRating)}>
                        {row.mountRating}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
