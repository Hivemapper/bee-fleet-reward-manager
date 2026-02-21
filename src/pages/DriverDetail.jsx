import { useState, useEffect } from "react";
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

const NUM_WEEKS = 12;

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

function weekLabel(mondayStr) {
  const mon = new Date(mondayStr + "T00:00:00");
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  const opts = { month: "short", day: "numeric" };
  return `${mon.toLocaleDateString("en-US", opts)} – ${sun.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}

function mountBadgeVariant(rating) {
  if (rating == null) return "outline";
  if (rating >= 4) return "default";
  if (rating >= 2) return "secondary";
  return "destructive";
}

function getRecentWeeks(n) {
  const weeks = [];
  const current = getMonday(new Date());
  for (let i = 0; i < n; i++) {
    const d = new Date(current);
    d.setDate(d.getDate() - i * 7);
    weeks.push(fmt(d));
  }
  return weeks;
}

export default function DriverDetail({ driver, onBack }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeeks() {
      setLoading(true);
      const weeks = getRecentWeeks(NUM_WEEKS);

      const results = await Promise.all(
        weeks.map(async (w) => {
          try {
            const res = await fetch(`/api/rewards?rewardPeriod=${w}`);
            if (!res.ok) return { week: w, data: null };
            const data = await res.json();
            const list = data.devicesWithRewards || [];
            const match = list.find((r) => r.device?.id === driver.id);
            return { week: w, data: match || null };
          } catch {
            return { week: w, data: null };
          }
        })
      );

      setRows(
        results.map(({ week, data }) => ({
          week,
          honeyRewards: data?.rewardAmountHoney ?? null,
          mountRating: data?.rewardMountRating ?? null,
        }))
      );
      setLoading(false);
    }

    fetchWeeks();
  }, [driver.id]);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drivers
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{driver.name}</CardTitle>
          <CardDescription>
            {driver.description && <span>{driver.description} · </span>}
            <span className="font-mono text-xs">{driver.serialNumber}</span>
            {driver.vehiclePlate && (
              <span> · Plate: {driver.vehiclePlate}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading weekly rewards...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead className="text-right">HONEY Rewards</TableHead>
                  <TableHead className="text-center">Mount Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.week}>
                    <TableCell className="font-medium">
                      {weekLabel(row.week)}
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
    </div>
  );
}
