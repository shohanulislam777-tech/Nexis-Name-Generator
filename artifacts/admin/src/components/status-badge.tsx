import React from "react";
import { Badge } from "@/components/ui/badge";

export type StatusType = "active" | "suspended" | "revoked" | "expired" | "trial";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status?.toLowerCase() as StatusType;

  const variants: Record<StatusType, { bg: string; text: string; border: string }> = {
    active: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
    suspended: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
    revoked: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" },
    expired: { bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/20" },
    trial: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
  };

  const style = variants[normalized] || variants.expired;

  return (
    <Badge 
      variant="outline" 
      className={`capitalize font-mono text-[10px] tracking-wider px-2 py-0.5 ${style.bg} ${style.text} ${style.border} ${className || ""}`}
    >
      {status}
    </Badge>
  );
}
