import React from "react";
import {
  useGetDashboardStats,
  useGetActivationTrends,
  useGetRevenueSummary,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format } from "date-fns";

const CHART_COLORS = {
  activations: "#3b82f6",
  validations: "#8b5cf6",
  newLicenses: "#22c55e",
};

const PIE_COLORS = {
  active: "#22c55e",
  trial: "#3b82f6",
  suspended: "#f59e0b",
  revoked: "#ef4444",
  expired: "#6b7280",
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
      <p className="text-xs font-mono text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="text-sm font-mono" style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { data: stats } = useGetDashboardStats();
  const { data: trends } = useGetActivationTrends();
  const { data: revenue } = useGetRevenueSummary();

  const pieData = stats
    ? [
        { name: "Active", value: stats.activeLicenses, color: PIE_COLORS.active },
        { name: "Trial", value: stats.trialLicenses, color: PIE_COLORS.trial },
        { name: "Suspended", value: stats.suspendedLicenses, color: PIE_COLORS.suspended },
        { name: "Revoked", value: stats.revokedLicenses, color: PIE_COLORS.revoked },
        { name: "Expired", value: stats.expiredLicenses, color: PIE_COLORS.expired },
      ].filter((d) => d.value > 0)
    : [];

  const trendsData = (trends as any[])?.map((d: any) => ({
    ...d,
    date: d.date ? format(new Date(d.date), "MMM d") : d.date,
  }));

  const revenueData = (revenue as any[]) ?? [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight uppercase font-mono">Analytics</h1>
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">Last 30 days</span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: stats ? `$${Number(stats.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—" },
          { label: "Total Licenses", value: stats?.totalLicenses ?? "—" },
          { label: "Active Devices", value: stats?.activeDevices ?? "—" },
          { label: "Activations Today", value: stats?.activationsToday ?? "—" },
        ].map((s) => (
          <Card key={s.label} className="border-border bg-card/50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-mono uppercase text-muted-foreground tracking-wider">{s.label}</p>
              <p className="text-2xl font-bold font-mono mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activation Trends */}
      <Card className="border-border bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Activation Trends — 30 Day</CardTitle>
        </CardHeader>
        <CardContent>
          {!trendsData?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground font-mono text-sm">No trend data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendsData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradActivations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.activations} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.activations} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.newLicenses} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.newLicenses} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "monospace", fill: "#6b7280" }} />
                <YAxis tick={{ fontSize: 10, fontFamily: "monospace", fill: "#6b7280" }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="activations" name="Activations" stroke={CHART_COLORS.activations} fill="url(#gradActivations)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="newLicenses" name="New Licenses" stroke={CHART_COLORS.newLicenses} fill="url(#gradNew)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {!revenueData.length ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground font-mono text-sm">No revenue data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="planName" tick={{ fontSize: 10, fontFamily: "monospace", fill: "#6b7280" }} />
                  <YAxis tick={{ fontSize: 10, fontFamily: "monospace", fill: "#6b7280" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" name="Revenue ($)" fill={CHART_COLORS.activations} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* License Status Distribution */}
        <Card className="border-border bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground tracking-wider">License Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {!pieData.length ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground font-mono text-sm">No licenses yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ fontSize: 11, fontFamily: "monospace", color: "#9ca3af" }}>{value}</span>}
                  />
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
