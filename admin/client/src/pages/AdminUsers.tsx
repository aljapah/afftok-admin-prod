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
  UserCog, 
  Plus, 
  Search, 
  MoreVertical,
  Edit, 
  Trash2, 
  Shield,
  DollarSign,
  Wrench,
  Megaphone,
  HeadphonesIcon,
  AlertTriangle,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const roles = [
  { value: 'super_admin', label: 'Super Admin', labelAr: 'مدير عام', icon: Shield, color: 'text-red-500', description: 'وصول كامل لجميع الشاشات' },
  { value: 'finance_admin', label: 'Finance Admin', labelAr: 'مدير مالي', icon: DollarSign, color: 'text-green-500', description: 'الفواتير والإيرادات' },
  { value: 'tech_admin', label: 'Tech Admin', labelAr: 'مدير تقني', icon: Wrench, color: 'text-blue-500', description: 'المراقبة والسجلات' },
  { value: 'advertiser_manager', label: 'Advertiser Manager', labelAr: 'مدير معلنين', icon: Megaphone, color: 'text-purple-500', description: 'العروض والحملات' },
  { value: 'promoter_support', label: 'Promoter Support', labelAr: 'دعم المروجين', icon: HeadphonesIcon, color: 'text-yellow-500', description: 'دعم المستخدمين' },
  { value: 'fraud_reviewer', label: 'Fraud Reviewer', labelAr: 'مراجع احتيال', icon: AlertTriangle, color: 'text-orange-500', description: 'كشف الاحتيال' },
  { value: 'viewer', label: 'Viewer', labelAr: 'مشاهد', icon: Eye, color: 'text-gray-500', description: 'عرض فقط' },
];

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: "viewer" as string,
  });

  const { data: adminUsers = [], isLoading, refetch } = trpc.adminUsers.list.useQuery();
  
  const createMutation = trpc.adminUsers.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء المستخدم بنجاح");
      setIsCreateOpen(false);
      setNewUser({ username: "", email: "", password: "", fullName: "", role: "viewer" });
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل إنشاء المستخدم: ${error.message}`);
    },
  });

  const updateMutation = trpc.adminUsers.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث المستخدم");
      refetch();
    },
  });

  const deleteMutation = trpc.adminUsers.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المستخدم");
      refetch();
    },
  });

  const filteredUsers = adminUsers.filter((user: any) => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createMutation.mutate(newUser);
  };

  const getRoleBadge = (role: string) => {
    const r = roles.find(rl => rl.value === role);
    if (!r) return <Badge variant="outline">{role}</Badge>;
    const Icon = r.icon;
    return (
      <Badge variant="outline" className={r.color}>
        <Icon className="h-3 w-3 mr-1" />
        {r.labelAr}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="h-3 w-3 mr-1" /> نشط</Badge>;
      case "inactive":
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> غير نشط</Badge>;
      case "suspended":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> موقوف</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = [
    { title: "إجمالي المستخدمين", value: adminUsers.length, icon: UserCog, color: "text-blue-500" },
    { title: "Super Admin", value: adminUsers.filter((u: any) => u.role === 'super_admin').length, icon: Shield, color: "text-red-500" },
    { title: "نشط", value: adminUsers.filter((u: any) => u.status === 'active').length, icon: CheckCircle, color: "text-green-500" },
    { title: "موقوف", value: adminUsers.filter((u: any) => u.status === 'suspended').length, icon: XCircle, color: "text-yellow-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
            <p className="text-muted-foreground mt-1">
              إنشاء وإدارة صلاحيات مستخدمي لوحة الإدارة
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                إضافة مستخدم
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                <DialogDescription>
                  أضف مستخدم جديد مع تحديد دوره وصلاحياته
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>اسم المستخدم *</Label>
                  <Input
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="ahmed_finance"
                    dir="ltr"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>البريد الإلكتروني *</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="ahmed@company.com"
                    dir="ltr"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>كلمة المرور *</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>الاسم الكامل</Label>
                  <Input
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    placeholder="أحمد محمد"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>الدور *</Label>
                  <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => {
                        const Icon = role.icon;
                        return (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${role.color}`} />
                              <span>{role.labelAr}</span>
                              <span className="text-xs text-muted-foreground">- {role.description}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء المستخدم"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
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

        {/* Roles Guide */}
        <Card>
          <CardHeader>
            <CardTitle>دليل الأدوار والصلاحيات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <div key={role.value} className="p-3 rounded-lg border bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${role.color}`} />
                      <span className="font-medium text-sm">{role.labelAr}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>المستخدمون الإداريون</CardTitle>
                <CardDescription>قائمة جميع مستخدمي لوحة الإدارة</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا يوجد مستخدمون</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>البريد</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>آخر دخول</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.fullName || user.username}</p>
                          <p className="text-xs text-muted-foreground">@{user.username}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString('ar-SA')
                          : 'لم يدخل بعد'}
                      </TableCell>
                      <TableCell>
                        {user.role !== 'super_admin' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => updateMutation.mutate({
                                id: user.id,
                                status: user.status === 'active' ? 'suspended' : 'active'
                              })}>
                                {user.status === 'active' ? (
                                  <><XCircle className="h-4 w-4 mr-2" /> إيقاف</>
                                ) : (
                                  <><CheckCircle className="h-4 w-4 mr-2" /> تفعيل</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                                    deleteMutation.mutate({ id: user.id });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

