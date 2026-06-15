import React from "react";
import { Link } from "wouter";
import { useListLicenses } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { format } from "date-fns";

export default function Licenses() {
  const [search, setSearch] = React.useState("");
  const { data, isLoading } = useListLicenses({ search });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight uppercase font-mono">License Directory</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search keys, users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card/50"
            />
          </div>
          <Button className="font-mono text-xs uppercase tracking-wider">
            <Plus className="h-4 w-4 mr-2" />
            Generate
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs uppercase text-muted-foreground w-1/4">Key</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Status</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Plan</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">User</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Devices</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : !data?.data || data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No licenses found.</TableCell>
                </TableRow>
              ) : (
                data.data.map((license) => (
                  <TableRow key={license.id} className="border-border hover:bg-muted/50 cursor-pointer transition-colors group">
                    <TableCell className="font-mono text-sm">
                      <Link href={`/licenses/${license.id}`} className="hover:text-primary transition-colors">
                        {license.key}
                      </Link>
                    </TableCell>
                    <TableCell><StatusBadge status={license.status} /></TableCell>
                    <TableCell className="text-sm">{license.planName || "—"}</TableCell>
                    <TableCell className="text-sm">{license.userEmail || "—"}</TableCell>
                    <TableCell className="text-sm font-mono">
                      {license.activatedDevices} / {license.maxDevices}
                    </TableCell>
                    <TableCell className="text-sm">
                      {license.expiresAt ? format(new Date(license.expiresAt), "MMM d, yyyy") : "Never"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
