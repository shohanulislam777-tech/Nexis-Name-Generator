import React from "react";
import { useListUsers } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, User } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function Users() {
  const [search, setSearch] = React.useState("");
  const { data, isLoading } = useListUsers({ search });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight uppercase font-mono">User Directory</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search email, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card/50"
          />
        </div>
      </div>

      <Card className="border-border bg-card/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">User</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Email</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Licenses</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Active Devices</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Last Seen</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-mono text-sm">
                    Scanning directory...
                  </TableCell>
                </TableRow>
              ) : !data?.data?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-mono text-sm">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((user) => (
                  <TableRow key={user.id} className="border-border hover:bg-muted/40 cursor-pointer transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-primary/20 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{user.name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{user.email || "—"}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{user.licenseCount}</span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{user.activeDevices}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.lastSeen ? format(new Date(user.lastSeen), "MMM d, HH:mm") : "Never"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {data && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>{data.total} users total</span>
            <span>Page {data.page} of {Math.ceil(data.total / data.limit)}</span>
          </div>
        )}
      </Card>
    </div>
  );
}
