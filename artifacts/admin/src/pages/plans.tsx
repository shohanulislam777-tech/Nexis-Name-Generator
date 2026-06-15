import React from "react";
import { useListPlans } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Plans() {
  const { data, isLoading } = useListPlans();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight uppercase font-mono">Plans & Pricing</h1>
        <Button className="font-mono text-xs uppercase tracking-wider">
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>

      <Card className="border-border bg-card/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Name</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Price</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Duration (Days)</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Max Devices</TableHead>
                <TableHead className="font-mono text-xs uppercase text-muted-foreground">Licenses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No plans configured.</TableCell>
                </TableRow>
              ) : (
                data.map((plan) => (
                  <TableRow key={plan.id} className="border-border hover:bg-muted/50 cursor-pointer">
                    <TableCell className="font-medium text-sm">{plan.name}</TableCell>
                    <TableCell className="text-sm font-mono">{plan.price} {plan.currency}</TableCell>
                    <TableCell className="text-sm">{plan.durationDays || "Lifetime"}</TableCell>
                    <TableCell className="text-sm font-mono">{plan.maxDevices}</TableCell>
                    <TableCell className="text-sm font-mono">{plan.licenseCount}</TableCell>
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
