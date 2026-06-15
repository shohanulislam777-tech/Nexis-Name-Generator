import React from "react";
import { useListDevices, useDeleteDevice, getListDevicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Monitor } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Devices() {
  const { data, isLoading } = useListDevices({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate: deleteDevice } = useDeleteDevice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() });
        toast({ title: "Device removed", description: "Device binding has been deleted." });
      },
    },
  });

  function handleDelete(id: number, deviceId: string) {
    if (!confirm(`Remove device binding for ${deviceId.slice(0, 20)}...?`)) return;
    deleteDevice({ params: { id } });
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight uppercase font-mono">Device Registry</h1>
        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
          {data?.total ?? "—"} bindings
        </span>
      </div>

      <Card className="border-border bg-card/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Device ID</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">License ID</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Status</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">First Seen</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Last Seen</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-mono text-sm">
                    Scanning device registry...
                  </TableCell>
                </TableRow>
              ) : !data?.data?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-mono text-sm">
                    No device bindings found.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((device) => (
                  <TableRow key={device.id} className="border-border hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="font-mono text-xs">{device.deviceId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">#{device.licenseId}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                        device.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}>
                        {device.isActive ? "active" : "inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {device.firstSeen ? format(new Date(device.firstSeen), "MMM d, yyyy HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {device.lastSeen ? format(new Date(device.lastSeen), "MMM d, yyyy HH:mm") : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(device.id, device.deviceId)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {data && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>{data.total} total bindings</span>
            <span>Page {data.page} of {Math.max(1, Math.ceil(data.total / data.limit))}</span>
          </div>
        )}
      </Card>
    </div>
  );
}
