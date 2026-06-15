import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">System Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight uppercase font-mono">System Overview</h1>
        <div className="text-xs text-muted-foreground font-mono">
          Last updated: {format(new Date(), "HH:mm:ss")}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} />
        <StatCard title="Total Licenses" value={stats.totalLicenses.toString()} />
        <StatCard title="Active Devices" value={stats.activeDevices.toString()} />
        <StatCard title="Activations Today" value={stats.activationsToday.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{log.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {log.licenseKey && <span className="text-xs font-mono text-muted-foreground">{log.licenseKey}</span>}
                      <span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "MMM d, HH:mm")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase text-muted-foreground">License Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatusRow label="Active" value={stats.activeLicenses} total={stats.totalLicenses} color="bg-emerald-500" />
              <StatusRow label="Trial" value={stats.trialLicenses} total={stats.totalLicenses} color="bg-blue-500" />
              <StatusRow label="Suspended" value={stats.suspendedLicenses} total={stats.totalLicenses} color="bg-amber-500" />
              <StatusRow label="Revoked" value={stats.revokedLicenses} total={stats.totalLicenses} color="bg-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend }: { title: string; value: string | number; trend?: string }) {
  return (
    <Card className="border-border bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-mono tracking-tight">{value}</div>
        {trend && <div className="text-xs text-emerald-500 mt-1">{trend}</div>}
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value} ({percent}%)</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
