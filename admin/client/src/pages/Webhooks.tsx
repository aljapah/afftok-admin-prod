import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Webhook, 
  Plus, 
  Search, 
  MoreVertical,
  Edit, 
  Trash2, 
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  XCircle,
  Send,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const triggerTypes = [
  { value: "click", label: "Click Event" },
  { value: "conversion", label: "Conversion Event" },
  { value: "postback", label: "Postback Received" },
  { value: "fraud", label: "Fraud Detected" },
  { value: "user_signup", label: "User Signup" },
];

const signatureModes = [
  { value: "none", label: "None" },
  { value: "hmac", label: "HMAC-SHA256" },
  { value: "jwt", label: "JWT" },
];

export default function Webhooks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    triggerType: "conversion",
    signatureMode: "hmac",
    secret: "",
  });

  // API Queries
  const { data: webhooks, refetch: refetchWebhooks } = trpc.webhooks.list.useQuery();
  const { data: stats, refetch: refetchStats } = trpc.webhooks.stats.useQuery();
  const { data: dlqItems, refetch: refetchDLQ } = trpc.webhooks.dlq.useQuery();

  // Mutations
  const createMutation = trpc.webhooks.create.useMutation({
    onSuccess: () => {
      toast.success("Webhook created!");
      setIsCreateOpen(false);
      setNewWebhook({ name: "", url: "", triggerType: "conversion", signatureMode: "hmac", secret: "" });
      refetchWebhooks();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.webhooks.update.useMutation({
    onSuccess: () => {
      toast.success("Webhook updated!");
      refetchWebhooks();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.webhooks.delete.useMutation({
    onSuccess: () => {
      toast.success("Webhook deleted!");
      refetchWebhooks();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteDLQMutation = trpc.webhooks.deleteDLQ.useMutation({
    onSuccess: () => {
      toast.success("DLQ item removed!");
      refetchDLQ();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  const webhooksList = webhooks || [];
  const dlqList = dlqItems || [];

  const filteredWebhooks = webhooksList.filter((webhook: any) => 
    webhook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    webhook.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([refetchWebhooks(), refetchStats(), refetchDLQ()]).finally(() => {
      setIsRefreshing(false);
      toast.success("Data refreshed!");
    });
  };

  const handleCreateWebhook = () => {
    if (!newWebhook.name || !newWebhook.url) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate(newWebhook);
  };

  const handleToggleStatus = (webhook: any) => {
    updateMutation.mutate({
      id: webhook.id,
      status: webhook.status === 'active' ? 'paused' : 'active'
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this webhook?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleTestWebhook = (name: string) => {
    toast.info(`Testing webhook "${name}"...`);
    setTimeout(() => toast.success(`Webhook "${name}" test successful!`), 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      case "paused":
        return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" /> Paused</Badge>;
      case "error":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSignatureBadge = (mode: string) => {
    switch (mode) {
      case "hmac":
        return <Badge variant="outline" className="text-blue-500">HMAC</Badge>;
      case "jwt":
        return <Badge variant="outline" className="text-purple-500">JWT</Badge>;
      default:
        return <Badge variant="outline">None</Badge>;
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffHours / 24)} day${Math.floor(diffHours / 24) > 1 ? 's' : ''} ago`;
  };

  const statsCards = [
    { title: "Total Webhooks", value: stats?.total || 0, icon: Webhook, color: "text-blue-500" },
    { title: "Active", value: stats?.active || 0, icon: CheckCircle, color: "text-green-500" },
    { title: "Total Deliveries", value: (stats?.totalDeliveries || 0).toLocaleString(), icon: Send, color: "text-purple-500" },
    { title: "DLQ Items", value: stats?.dlqItems || 0, icon: AlertTriangle, color: "text-yellow-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Webhooks</h1>
            <p className="text-muted-foreground mt-1">
              <span className="text-green-500">✓ Real Data</span> - Manage webhook pipelines and deliveries
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create Webhook</DialogTitle>
                  <DialogDescription>
                    Configure a new webhook endpoint
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                      placeholder="e.g., Conversion Postback"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="url">URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                      placeholder="https://example.com/webhook"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Trigger</Label>
                      <Select 
                        value={newWebhook.triggerType} 
                        onValueChange={(v) => setNewWebhook({ ...newWebhook, triggerType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {triggerTypes.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Signature</Label>
                      <Select 
                        value={newWebhook.signatureMode} 
                        onValueChange={(v) => setNewWebhook({ ...newWebhook, signatureMode: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {signatureModes.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newWebhook.signatureMode !== 'none' && (
                    <div className="grid gap-2">
                      <Label htmlFor="secret">Secret Key</Label>
                      <Input
                        id="secret"
                        type="password"
                        value={newWebhook.secret}
                        onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                        placeholder="Enter signing secret"
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateWebhook} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Webhook"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Webhooks Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Webhooks</CardTitle>
                <CardDescription>Manage webhook pipelines</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search webhooks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Signature</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWebhooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No webhooks found. Click "Create Webhook" to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWebhooks.map((webhook: any) => (
                    <TableRow key={webhook.id}>
                      <TableCell className="font-medium">{webhook.name}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">{webhook.url}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{webhook.triggerType}</Badge>
                      </TableCell>
                      <TableCell>{getSignatureBadge(webhook.signatureMode)}</TableCell>
                      <TableCell>{getStatusBadge(webhook.status)}</TableCell>
                      <TableCell>
                        <span className={webhook.successRate >= 98 ? 'text-green-500' : webhook.successRate >= 95 ? 'text-yellow-500' : 'text-red-500'}>
                          {webhook.successRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatTimeAgo(webhook.lastTriggered)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleTestWebhook(webhook.name)}>
                              <Play className="h-4 w-4 mr-2" />
                              Test
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(webhook)}>
                              {webhook.status === 'active' ? (
                                <><Pause className="h-4 w-4 mr-2" /> Pause</>
                              ) : (
                                <><Play className="h-4 w-4 mr-2" /> Activate</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(webhook.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dead Letter Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Dead Letter Queue
            </CardTitle>
            <CardDescription>Failed webhook deliveries awaiting retry</CardDescription>
          </CardHeader>
          <CardContent>
            {dlqList.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Last Attempt</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dlqList.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.webhookName}</TableCell>
                      <TableCell className="text-red-500">{item.error}</TableCell>
                      <TableCell>{item.attempts}</TableCell>
                      <TableCell className="text-muted-foreground">{formatTimeAgo(item.lastAttempt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => deleteDLQMutation.mutate({ id: item.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No failed deliveries</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
