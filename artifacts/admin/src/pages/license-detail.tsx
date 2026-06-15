import React from "react";
import { useParams, Link } from "wouter";
import {
  useGetLicense,
  getGetLicenseQueryKey,
  useSuspendLicense,
  useActivateLicenseAdmin,
  useRevokeLicense,
  useRenewLicense,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ArrowLeft, Monitor, Activity, AlertTriangle, CheckCircle, Ban, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LicenseDetail() {
  const { id } = useParams<{ id: string }>();
  const licenseId = Number(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: license, isLoading } = useGetLicense(licenseId, {
    query: { queryKey: getGetLicenseQueryKey(licenseId), enabled: !!licenseId },
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getGetLicenseQueryKey(licenseId) });
  }

  const { mutate: suspend, isPending: suspending } = useSuspendLicense({
    mutation: { onSuccess: () => { invalidate(); toast({ title: "License suspended" }); } },
  });
  const { mutate: activate, isPending: activating } = useActivateLicenseAdmin({
    mutation: { onSuccess: () => { invalidate(); toast({ title: "License activated" }); } },
  });
  const { mutate: revoke, isPending: revoking } = useRevokeLicense({
    mutation: { onSuccess: () => { invalidate(); toast({ title: "License revoked" }); } },
  });
  const { mutate: renew, isPending: renewing } = useRenewLicense({
    mutation: { onSuccess: () => { invalidate(); toast({ title: "License renewed by 90 days" }); } },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground font-mono text-sm">Loading license data...</p>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground font-mono text-sm">License not found.</p>
      </div>
    );
  }

  const anyPending = suspending || activating || revoking || renewing;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/licenses">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground mt-0.5">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-bold font-mono tracking-tight">{license.key}</h1>
            <StatusBadge status={license.status} />
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            License #{license.id} · Created {license.createdAt ? format(new Date(license.createdAt), "MMM d, yyyy") : "—"}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {license.status !== "active" && (
          <Button
            size="sm"
            variant="outline"
            className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 font-mono text-xs uppercase"
            disabled={anyPending}
            onClick={() => activate({ params: { id: licenseId } })}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            {activating ? "Activating..." : "Activate"}
          </Button>
        )}
        {license.status === "active" && (
          <Button
            size="sm"
            variant="outline"
            className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10 font-mono text-xs uppercase"
            disabled={anyPending}
            onClick={() => suspend({ params: { id: licenseId } })}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            {suspending ? "Suspending..." : "Suspend"}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10 font-mono text-xs uppercase"
          disabled={anyPending}
          onClick={() => {
            const newExpiry = new Date();
            newExpiry.setDate(newExpiry.getDate() + 90);
            renew({ params: { id: licenseId }, data: { expiresAt: newExpiry.toISOString() } });
          }}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          {renewing ? "Renewing..." : "Renew 90d"}
        </Button>
        {license.status !== "revoked" && (
          <Button
            size="sm"
            variant="outline"
            className="text-red-400 border-red-500/30 hover:bg-red-500/10 font-mono text-xs uppercase"
            disabled={anyPending}
            onClick={() => {
              if (confirm("Permanently revoke this license?")) {
                revoke({ params: { id: licenseId } });
              }
            }}
          >
            <Ban className="h-3.5 w-3.5 mr-1.5" />
            {revoking ? "Revoking..." : "Revoke"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* License Info */}
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">License Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Plan", value: license.planName || "None" },
              { label: "User", value: license.userName || "—" },
              { label: "Email", value: license.userEmail || "—" },
              { label: "Max Devices", value: String(license.maxDevices) },
              { label: "Active Devices", value: String(license.activatedDevices ?? 0) },
              { label: "Expires", value: license.expiresAt ? format(new Date(license.expiresAt), "MMM d, yyyy") : "Never" },
              { label: "Activated", value: license.activatedAt ? format(new Date(license.activatedAt), "MMM d, yyyy HH:mm") : "Not yet" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-border/40 last:border-0">
                <span className="text-xs font-mono text-muted-foreground uppercase">{label}</span>
                <span className="text-sm font-mono">{value}</span>
              </div>
            ))}
            {license.notes && (
              <div className="pt-2">
                <p className="text-xs font-mono text-muted-foreground uppercase mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{license.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Devices */}
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
              <Monitor className="h-3.5 w-3.5" />
              Bound Devices ({(license as any).devices?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!(license as any).devices?.length ? (
              <p className="text-sm text-muted-foreground font-mono">No devices bound.</p>
            ) : (
              <div className="space-y-2">
                {(license as any).devices.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div>
                      <p className="font-mono text-xs">{d.deviceId.slice(0, 20)}...</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Last seen {d.lastSeen ? format(new Date(d.lastSeen), "MMM d, HH:mm") : "—"}</p>
                    </div>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                      d.isActive ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-muted-foreground bg-muted border-border"
                    }`}>
                      {d.isActive ? "active" : "inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!(license as any).recentActivity?.length ? (
            <p className="text-sm text-muted-foreground font-mono">No activity recorded.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono text-xs uppercase text-muted-foreground">Action</TableHead>
                  <TableHead className="font-mono text-xs uppercase text-muted-foreground">Device</TableHead>
                  <TableHead className="font-mono text-xs uppercase text-muted-foreground">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(license as any).recentActivity.map((a: any) => (
                  <TableRow key={a.id} className="border-border hover:bg-muted/40">
                    <TableCell className="font-mono text-xs">{a.action}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{a.deviceId ? a.deviceId.slice(0, 14) + "..." : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{a.createdAt ? format(new Date(a.createdAt), "MMM d, HH:mm") : "—"}</TableCell>
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
