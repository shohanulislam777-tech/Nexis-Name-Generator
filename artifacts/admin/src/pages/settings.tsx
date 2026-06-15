import React from "react";
import {
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings } from "lucide-react";

export default function SettingsPage() {
  const { data: settings, isLoading } = useGetSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = React.useState<Record<string, any>>({});
  const [hasEdits, setHasEdits] = React.useState(false);

  React.useEffect(() => {
    if (settings) {
      setForm(settings as unknown as Record<string, any>);
    }
  }, [settings]);

  const { mutate: updateSettings, isPending } = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        setHasEdits(false);
        toast({ title: "Settings saved", description: "Configuration updated." });
      },
      onError: () => {
        toast({ title: "Save failed", description: "Could not save settings.", variant: "destructive" });
      },
    },
  });

  function update(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
    setHasEdits(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateSettings({ data: form });
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground font-mono text-sm">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight uppercase font-mono">System Settings</h1>
        {hasEdits && (
          <span className="text-xs text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
            Unsaved changes
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General */}
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
              <Settings className="h-3.5 w-3.5" />
              General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingField
              label="App Name"
              value={form.appName ?? ""}
              onChange={(v) => update("appName", v)}
              placeholder="Nexis"
            />
            <SettingField
              label="Support URL"
              value={form.supportUrl ?? ""}
              onChange={(v) => update("supportUrl", v)}
              placeholder="https://nexis.dev/support"
              type="url"
            />
          </CardContent>
        </Card>

        {/* License Defaults */}
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">License Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingField
              label="Default Max Devices"
              value={String(form.defaultMaxDevices ?? 1)}
              onChange={(v) => update("defaultMaxDevices", Number(v))}
              type="number"
              min="1"
              max="100"
            />
            <SettingField
              label="Trial Duration (days)"
              value={String(form.defaultTrialDays ?? 7)}
              onChange={(v) => update("defaultTrialDays", Number(v))}
              type="number"
              min="1"
              max="365"
            />
            <SettingField
              label="Heartbeat Interval (minutes)"
              value={String(form.heartbeatIntervalMinutes ?? 60)}
              onChange={(v) => update("heartbeatIntervalMinutes", Number(v))}
              type="number"
              min="5"
              max="1440"
            />
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleSetting
              label="Require Device Binding"
              description="Licenses must be tied to a specific device."
              checked={!!form.requireDeviceBinding}
              onChange={(v) => update("requireDeviceBinding", v)}
            />
            <ToggleSetting
              label="Allow Self-Deactivation"
              description="Users can remove their device binding without admin intervention."
              checked={!!form.allowSelfDeactivation}
              onChange={(v) => update("allowSelfDeactivation", v)}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending || !hasEdits} className="font-mono text-xs uppercase tracking-wider">
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "Saving..." : "Save Configuration"}
          </Button>
          {hasEdits && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (settings) setForm(settings as unknown as Record<string, any>);
                setHasEdits(false);
              }}
            >
              Discard
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function SettingField({
  label, value, onChange, placeholder, type = "text", min, max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        className="bg-background border-border font-mono text-sm"
      />
    </div>
  );
}

function ToggleSetting({
  label, description, checked, onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
