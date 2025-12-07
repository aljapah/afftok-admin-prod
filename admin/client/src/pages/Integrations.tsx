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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Plug, 
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
  Clock,
  Copy,
  ExternalLink,
  ShoppingCart,
  Store,
  Package,
  Code,
  Globe
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const platforms = [
  { id: 'shopify', name: 'Shopify', icon: '🛒', color: '#96BF48' },
  { id: 'salla', name: 'سلة (Salla)', icon: '🛍️', color: '#5C6BC0' },
  { id: 'zid', name: 'زد (Zid)', icon: '📦', color: '#00BCD4' },
  { id: 'woocommerce', name: 'WooCommerce', icon: '🔧', color: '#7B1FA2' },
  { id: 'custom', name: 'موقع خاص (Custom)', icon: '💻', color: '#FF5722' },
];

export default function Integrations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [newIntegration, setNewIntegration] = useState({
    advertiserId: "",
    platform: "",
    platformName: "",
  });

  // Fetch integrations from API
  const { data: integrations = [], isLoading, refetch } = trpc.integrations.list.useQuery();
  const { data: advertisers = [] } = trpc.users.list.useQuery();
  
  const createMutation = trpc.integrations.create.useMutation({
    onSuccess: () => {
      toast.success("تم إنشاء التكامل بنجاح");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل إنشاء التكامل: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.integrations.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الحالة");
      refetch();
    },
  });

  const deleteMutation = trpc.integrations.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف التكامل");
      refetch();
    },
  });

  const testMutation = trpc.integrations.test.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("التكامل يعمل بشكل صحيح ✅");
      } else {
        toast.error("فشل اختبار التكامل ❌");
      }
      refetch();
    },
  });

  const filteredIntegrations = integrations.filter((integration: any) => 
    integration.platformName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.platform?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (!newIntegration.advertiserId || !newIntegration.platform) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createMutation.mutate(newIntegration);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="h-3 w-3 mr-1" /> متصل</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> قيد الانتظار</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> فشل</Badge>;
      case "paused":
        return <Badge variant="outline"><Pause className="h-3 w-3 mr-1" /> متوقف</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlatformIcon = (platform: string) => {
    const p = platforms.find(pl => pl.id === platform);
    return p ? p.icon : '🔗';
  };

  const getPlatformName = (platform: string) => {
    const p = platforms.find(pl => pl.id === platform);
    return p ? p.name : platform;
  };

  const stats = [
    { 
      title: "إجمالي التكاملات", 
      value: integrations.length, 
      icon: Plug, 
      color: "text-blue-500" 
    },
    { 
      title: "متصل", 
      value: integrations.filter((i: any) => i.status === 'active').length, 
      icon: CheckCircle, 
      color: "text-green-500" 
    },
    { 
      title: "قيد الانتظار", 
      value: integrations.filter((i: any) => i.status === 'pending').length, 
      icon: Clock, 
      color: "text-yellow-500" 
    },
    { 
      title: "فشل", 
      value: integrations.filter((i: any) => i.status === 'failed').length, 
      icon: XCircle, 
      color: "text-red-500" 
    },
  ];

  const generateWebhookUrl = (platform: string, advertiserId: string) => {
    return `https://go.afftokapp.com/webhook/${platform}/${advertiserId}`;
  };

  const generatePixelCode = (advertiserId: string) => {
    return `<script src="https://go.afftokapp.com/pixel.js"></script>
<script>
  AffTok.init('${advertiserId}');
  AffTok.track('purchase', {
    value: ORDER_AMOUNT,
    currency: 'SAR',
    order_id: 'ORDER_ID'
  });
</script>`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">تكاملات المعلنين</h1>
            <p className="text-muted-foreground mt-1">
              إدارة ومراقبة تكاملات المنصات (Shopify, Salla, Zid, WooCommerce)
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                إضافة تكامل
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>إضافة تكامل جديد</DialogTitle>
                <DialogDescription>
                  ربط منصة التجارة الإلكترونية للمعلن
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>المعلن *</Label>
                  <Select 
                    value={newIntegration.advertiserId} 
                    onValueChange={(v) => setNewIntegration({ ...newIntegration, advertiserId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المعلن" />
                    </SelectTrigger>
                    <SelectContent>
                      {advertisers.filter((u: any) => u.role === 'advertiser').map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName || user.username} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>المنصة *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => setNewIntegration({ ...newIntegration, platform: platform.id })}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          newIntegration.platform === platform.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl">{platform.icon}</span>
                        <p className="text-xs mt-1">{platform.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label>اسم المتجر</Label>
                  <Input
                    value={newIntegration.platformName}
                    onChange={(e) => setNewIntegration({ ...newIntegration, platformName: e.target.value })}
                    placeholder="مثال: متجر الرياض"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>إلغاء</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء التكامل"}
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

        {/* Integrations Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>جميع التكاملات</CardTitle>
                <CardDescription>قائمة تكاملات المعلنين مع المنصات</CardDescription>
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
            ) : filteredIntegrations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد تكاملات بعد</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة أول تكامل
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المنصة</TableHead>
                    <TableHead>المعلن</TableHead>
                    <TableHead>اسم المتجر</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>Webhooks</TableHead>
                    <TableHead>آخر نشاط</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIntegrations.map((integration: any) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getPlatformIcon(integration.platform)}</span>
                          <span>{getPlatformName(integration.platform)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{integration.advertiserName || integration.advertiserId?.slice(0, 8)}</TableCell>
                      <TableCell>{integration.platformName || '-'}</TableCell>
                      <TableCell>{getStatusBadge(integration.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-green-500">{integration.successfulWebhooks || 0}</span>
                          {' / '}
                          <span className="text-red-500">{integration.failedWebhooks || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {integration.lastWebhookAt 
                          ? new Date(integration.lastWebhookAt).toLocaleDateString('ar-SA')
                          : 'لم يتم استلام'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => testMutation.mutate({ id: integration.id })}>
                              <Play className="h-4 w-4 mr-2" />
                              اختبار التكامل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(
                              generateWebhookUrl(integration.platform, integration.advertiserId),
                              'Webhook URL'
                            )}>
                              <Copy className="h-4 w-4 mr-2" />
                              نسخ Webhook URL
                            </DropdownMenuItem>
                            {integration.platform === 'custom' && (
                              <DropdownMenuItem onClick={() => copyToClipboard(
                                generatePixelCode(integration.advertiserId),
                                'Pixel Code'
                              )}>
                                <Code className="h-4 w-4 mr-2" />
                                نسخ Pixel Code
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({
                              id: integration.id,
                              status: integration.status === 'active' ? 'paused' : 'active'
                            })}>
                              {integration.status === 'active' ? (
                                <><Pause className="h-4 w-4 mr-2" /> إيقاف</>
                              ) : (
                                <><Play className="h-4 w-4 mr-2" /> تفعيل</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate({ id: integration.id })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              دليل إعداد التكامل
            </CardTitle>
            <CardDescription>تعليمات ربط المنصات المختلفة</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="shopify">
              <TabsList className="grid w-full grid-cols-5">
                {platforms.map((platform) => (
                  <TabsTrigger key={platform.id} value={platform.id}>
                    <span className="mr-1">{platform.icon}</span>
                    <span className="hidden sm:inline">{platform.name.split(' ')[0]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value="shopify" className="mt-4 space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">خطوات ربط Shopify:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>افتح لوحة تحكم Shopify</li>
                    <li>اذهب إلى Settings → Notifications</li>
                    <li>اضغط على "Create webhook"</li>
                    <li>اختر Event: Order creation</li>
                    <li>الصق رابط Webhook الخاص بالمعلن</li>
                    <li>اختر Format: JSON</li>
                    <li>احفظ التغييرات</li>
                  </ol>
                </div>
              </TabsContent>
              
              <TabsContent value="salla" className="mt-4 space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">خطوات ربط سلة:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>افتح لوحة تحكم سلة</li>
                    <li>اذهب إلى التطبيقات → Webhooks</li>
                    <li>أضف Webhook جديد</li>
                    <li>اختر الحدث: طلب جديد (order.created)</li>
                    <li>الصق رابط Webhook الخاص بالمعلن</li>
                    <li>فعّل الـ Webhook</li>
                  </ol>
                </div>
              </TabsContent>
              
              <TabsContent value="zid" className="mt-4 space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">خطوات ربط زد:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>افتح لوحة تحكم زد</li>
                    <li>اذهب إلى الإعدادات → التكاملات</li>
                    <li>اختر Webhooks</li>
                    <li>أضف Webhook جديد للطلبات</li>
                    <li>الصق رابط Webhook الخاص بالمعلن</li>
                    <li>احفظ التغييرات</li>
                  </ol>
                </div>
              </TabsContent>
              
              <TabsContent value="woocommerce" className="mt-4 space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">خطوات ربط WooCommerce:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>افتح لوحة WordPress</li>
                    <li>اذهب إلى WooCommerce → Settings → Advanced</li>
                    <li>اختر تبويب Webhooks</li>
                    <li>اضغط "Add webhook"</li>
                    <li>Topic: Order created</li>
                    <li>الصق رابط Webhook</li>
                    <li>Status: Active ثم احفظ</li>
                  </ol>
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="mt-4 space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">للمواقع المخصصة:</h4>
                  <p className="text-sm mb-4">أضف هذا الكود في صفحة "شكراً للشراء":</p>
                  <pre className="bg-black p-3 rounded text-xs overflow-x-auto text-green-400">
{`<script src="https://go.afftokapp.com/pixel.js"></script>
<script>
  AffTok.init('ADVERTISER_ID');
  AffTok.track('purchase', {
    value: ORDER_AMOUNT,
    currency: 'SAR',
    order_id: 'ORDER_ID'
  });
</script>`}
                  </pre>
                  <p className="text-sm mt-4">أو أرسل Postback مباشرة:</p>
                  <pre className="bg-black p-3 rounded text-xs overflow-x-auto text-blue-400">
{`POST https://go.afftokapp.com/postback
{
  "click_id": "CLICK_ID",
  "amount": ORDER_AMOUNT,
  "order_id": "ORDER_ID",
  "currency": "SAR"
}`}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

