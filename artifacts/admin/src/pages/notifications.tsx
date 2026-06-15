import React from "react";
import {
  useListNotifications,
  useCreateNotification,
  getListNotificationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Bell, Info, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const TYPE_CONFIG = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "Info" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Warning" },
  error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Error" },
  success: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Success" },
} as const;

export default function Notifications() {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", message: "", type: "info" });
  const { data, isLoading } = useListNotifications({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate: createNotification, isPending } = useCreateNotification({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        setOpen(false);
        setForm({ title: "", message: "", type: "info" });
        toast({ title: "Notification sent" });
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    createNotification({ data: form });
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight uppercase font-mono">Notifications</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono text-xs uppercase tracking-wider">
              <Plus className="h-4 w-4 mr-2" />
              New Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase text-sm tracking-wider">Broadcast Notification</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Type</label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger className="bg-background border-border font-mono text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key} className="font-mono text-sm">{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Alert: System maintenance scheduled"
                  className="bg-background border-border"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Message</label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Detailed message..."
                  rows={4}
                  className="bg-background border-border resize-none"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isPending} className="flex-1 font-mono text-xs uppercase">
                  {isPending ? "Sending..." : "Send Notification"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground font-mono text-sm">Loading notifications...</div>
        ) : !data?.data?.length ? (
          <Card className="border-border bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <Bell className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground font-mono text-sm">No notifications yet.</p>
            </CardContent>
          </Card>
        ) : (
          data.data.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <Card key={notif.id} className={`border ${cfg.border} ${cfg.bg} transition-all`}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-md ${cfg.bg} border ${cfg.border}`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-semibold text-sm ${cfg.color}`}>{notif.title}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                          <span className="text-xs text-muted-foreground font-mono">
                            {format(new Date(notif.createdAt), "MMM d, HH:mm")}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
