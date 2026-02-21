import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KeyRound, Check, AlertCircle } from "lucide-react";

export default function Settings({ onSaved }) {
  const [apiKey, setApiKey] = useState("");
  const [hint, setHint] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // 'ok' | 'error'

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setHint(data.apiKeyHint || ""));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("ok");
      setApiKey("");
      // Refresh hint
      const check = await fetch("/api/settings");
      const data = await check.json();
      setHint(data.apiKeyHint || "");
      // Notify parent after short delay so user sees success
      setTimeout(() => onSaved?.(), 600);
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            API Settings
          </CardTitle>
          <CardDescription>
            Enter your Bee Maps API key to connect to the fleet data. Access it
            via{" "}
            <a
              href="https://beemaps.com/settings/fleets/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary hover:text-primary/80"
            >
              beemaps.com/settings/fleets/integrations
            </a>
            .
            {hint && (
              <span className="block mt-1 text-xs">
                Current key: <code className="bg-muted px-1 rounded">{hint}</code>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your Bee Maps API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" variant="primary" disabled={saving || !apiKey.trim()}>
                {saving ? "Saving..." : "Save API Key"}
              </Button>
              {status === "ok" && (
                <span className="flex items-center gap-1 text-sm text-[#1a7f37]">
                  <Check className="h-4 w-4" /> Saved
                </span>
              )}
              {status === "error" && (
                <span className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" /> Failed to save
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
