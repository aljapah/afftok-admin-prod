import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  Ban, 
  CheckCircle,
  Users,
  DollarSign,
  RefreshCw,
  Play
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Tenants() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    slug: "",
    adminEmail: "",
    plan: "free"
  });

  // API Queries
  const { data: tenants, refetch: refetchTenants } = trpc.tenants.list.useQuery();
  const { data: stats, refetch: refetchStats } = trpc.tenants.stats.useQuery();

  // Mutations
  const createMutation = trpc.tenants.create.useMutation({
    onSuccess: () => {
      toast.success("Tenant created!");
      setIsCreateOpen(false);
      setNewTenant({ name: "", slug: "", adminEmail: "", plan: "free" });
      refetchTenants();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.tenants.update.useMutation({
    onSuccess: () => {
      toast.success("Tenant updated!");
      refetchTenants();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.tenants.delete.useMutation({
    onSuccess: () => {
      toast.success("Tenant deleted!");
      refetchTenants();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  const tenantsList = tenants || [];

  const filteredTenants = tenantsList.filter((tenant: any) => 
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tenant.adminEmail && tenant.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([refetchTenants(), refetchStats()]).finally(() => {
      setIsRefreshing(false);
      toast.success("Data refreshed!");
    });
  };

  const handleCreateTenant = () => {
    if (!newTenant.name || !newTenant.slug || !newTenant.adminEmail) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate(newTenant);
  };

  const handleToggleStatus = (tenant: any) => {
    updateMutation.mutate({
      id: tenant.id,
      status: tenant.status === 'active' ? 'suspended' : 'active'
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this tenant?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500">Active</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return <Badge className="bg-purple-500/10 text-purple-500">Enterprise</Badge>;
      case "pro":
        return <Badge className="bg-blue-500/10 text-blue-500">Pro</Badge>;
      case "free":
        return <Badge variant="outline">Free</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  const statsCards = [
    { title: "Total Tenants", value: stats?.total || 0, icon: Building2, color: "text-blue-500" },
    { title: "Active Tenants", value: stats?.active || 0, icon: CheckCircle, color: "text-green-500" },
    { title: "Total Users", value: (stats?.totalUsers || 0).toLocaleString(), icon: Users, color: "text-purple-500" },
    { title: "Total Revenue", value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tenants</h1>
            <p className="text-muted-foreground mt-1">
              <span className="text-green-500">✓ Real Data</span> - Manage multi-tenant organizations
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
                  Create Tenant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tenant</DialogTitle>
                  <DialogDescription>
                    Set up a new tenant organization
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Tenant Name *</Label>
                    <Input
                      id="name"
                      value={newTenant.name}
                      onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                      placeholder="e.g., Acme Corporation"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={newTenant.slug}
                      onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      placeholder="e.g., acme-corp"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Admin Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTenant.adminEmail}
                      onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Plan</Label>
                    <Select 
                      value={newTenant.plan} 
                      onValueChange={(v) => setNewTenant({ ...newTenant, plan: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateTenant} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Tenant"}
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

        {/* Tenants Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Tenants</CardTitle>
                <CardDescription>Manage tenant organizations</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
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
                  <TableHead>Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Offers</TableHead>
                  <TableHead>Clicks Today</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No tenants found. Click "Create Tenant" to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTenants.map((tenant: any) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                      <TableCell>{(tenant.usersCount || 0).toLocaleString()}</TableCell>
                      <TableCell>{tenant.offersCount || 0}</TableCell>
                      <TableCell>{(tenant.clicksToday || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-emerald-500 font-medium">
                        ${(tenant.revenue || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleStatus(tenant)}>
                              {tenant.status === 'active' ? (
                                <><Ban className="h-4 w-4 mr-2" /> Suspend</>
                              ) : (
                                <><Play className="h-4 w-4 mr-2" /> Activate</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(tenant.id)}
                            >
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
      </div>
    </DashboardLayout>
  );
}
