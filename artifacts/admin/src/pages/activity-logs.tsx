import React from "react";
import { useListActivityLogs } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Activity } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  license_validated: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  license_activated: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  license_activated_admin: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  license_suspended: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  license_revoked: "text-red-400 bg-red-500/10 border-red-500/20",
  license_deactivated: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  license_created: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  licenses_bulk_generated: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  license_renewed: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  license_deleted: "text-red-400 bg-red-500/10 border-red-500/20",
  license_validation_failed: "text-red-400 bg-red-500/10 border-red-500/20",
  license_activation_failed: "text-red-400 bg-red-500/10 border-red-500/20",
  device_removed: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  license_updated: "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

const ACTIONS = [
  "license_validated",
  "license_activated",
  "license_suspended",
  "license_revoked",
  "license_created",
  "license_renewed",
  "license_deleted",
  "license_validation_failed",
  "device_removed",
];

export default function ActivityLogs() {
  const [action, setAction] = React.useState<string>("");
  const { data, isLoading } = useListActivityLogs(action ? { action } : {});

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight uppercase font-mono">Activity Log</h1>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-full sm:w-52 bg-card/50 border-border font-mono text-xs">
            <SelectValue placeholder="Filter by action..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" className="font-mono text-xs">All actions</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a} className="font-mono text-xs">{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border bg-card/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Action</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">License Key</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Device</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Metadata</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-mono text-sm">
                    Retrieving logs...
                  </TableCell>
                </TableRow>
              ) : !data?.data?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground font-mono">No activity logs found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((log) => {
                  const colorClass = ACTION_COLORS[log.action] || "text-gray-400 bg-gray-500/10 border-gray-500/20";
                  return (
                    <TableRow key={log.id} className="border-border hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${colorClass}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[180px] truncate">
                        {log.licenseKey || "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate">
                        {log.deviceId ? log.deviceId.slice(0, 16) + "..." : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[160px]">
                        {log.metadata ? (
                          <span className="truncate block" title={JSON.stringify(log.metadata)}>
                            {JSON.stringify(log.metadata).slice(0, 40)}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {log.createdAt ? format(new Date(log.createdAt), "MMM d, HH:mm:ss") : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {data && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>{data.total} total events</span>
            <span>Showing {data.data.length} of {data.total}</span>
          </div>
        )}
      </Card>
    </div>
  );
}
