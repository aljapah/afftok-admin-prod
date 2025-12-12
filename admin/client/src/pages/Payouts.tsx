import { useState, useEffect } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Wallet, 
  FileText, 
  Download, 
  RefreshCw, 
  Calendar,
  DollarSign,
  Users,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Zap,
  TrendingUp,
  Eye,
  Play,
  Pause
} from "lucide-react";

// Types
interface Payout {
  id: string;
  batch_id?: string;
  advertiser_id: string;
  publisher_id: string;
  advertiser?: {
    email: string;
    full_name?: string;
    company_name?: string;
    payoneer_email?: string;
  };
  publisher?: {
    email: string;
    full_name?: string;
    username?: string;
    payoneer_email?: string;
  };
  amount: number;
  platform_fee: number;
  net_amount: number;
  currency: string;
  period: string;
  conversions_count: number;
  status: string;
  created_at: string;
}

interface PayoutBatch {
  id: string;
  period: string;
  total_amount: number;
  total_platform_fee: number;
  total_net_amount: number;
  total_payouts: number;
  total_publishers: number;
  total_advertisers: number;
  total_conversions: number;
  currency: string;
  status: string;
  created_at: string;
  submitted_at?: string;
  completed_at?: string;
}

interface PayoutSummary {
  total_batches: number;
  total_payouts: number;
  total_amount: number;
  total_platform_fee: number;
  pending_batches: number;
  completed_batches: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://afftok-backend-prod-production.up.railway.app';

const statusColors: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  submitted: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  processing: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  pending: "في الانتظار",
  approved: "معتمد",
  submitted: "تم الإرسال",
  processing: "قيد المعالجة",
  completed: "مكتمل",
  paid: "مدفوع",
  failed: "فشل",
};

const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function Payouts() {
  const [batches, setBatches] = useState<PayoutBatch[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<PayoutBatch | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth());
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch batches
      const batchesRes = await fetch(`${API_URL}/api/admin/payouts/batches`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (batchesRes.ok) {
        const data = await batchesRes.json();
        setBatches(data.batches || []);
      }
      
      // Fetch summary
      const summaryRes = await fetch(`${API_URL}/api/admin/payouts/summary`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary || null);
      }
      
      // Fetch recent payouts
      const payoutsRes = await fetch(`${API_URL}/api/admin/payouts?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (payoutsRes.ok) {
        const data = await payoutsRes.json();
        setPayouts(data.payouts || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateBatch = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/payouts/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: generateMonth + 1,
          year: generateYear,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`تم إنشاء دفعة جديدة: ${data.payouts_count} مستحق`);
        fetchData();
        setIsGenerateDialogOpen(false);
      } else {
        toast.error(data.error || 'فشل في إنشاء الدفعة');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = async (batchId: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      window.open(`${API_URL}/api/admin/payouts/batches/${batchId}/export?token=${token}`, '_blank');
      toast.success('جاري تحميل ملف CSV');
    } catch (error) {
      toast.error('فشل في تصدير الملف');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Wallet className="w-8 h-8 text-orange-500" />
              نظام Payoneer للدفعات
            </h1>
            <p className="text-gray-400 mt-1">إدارة الدفعات الشهرية للمروجين</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={fetchData}
              className="border-gray-700"
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث
            </Button>
            <Button 
              onClick={() => setIsGenerateDialogOpen(true)}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
            >
              <Zap className="w-4 h-4 ml-2" />
              إنشاء دفعة جديدة
            </Button>
          </div>
        </div>

        {/* System Status Alert */}
        <Alert className="bg-orange-500/10 border-orange-500/30">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <AlertTitle className="text-orange-400 font-bold">النظام غير مفعّل حالياً</AlertTitle>
          <AlertDescription className="text-orange-300/80">
            نظام Payoneer جاهز للعمل ولكنه معطل حتى يتم التعاقد مع Payoneer.
            <br />
            <span className="text-gray-400">النظام الحالي: المروج يحدد طريقة الدفع والمعلن يدفع له مباشرة.</span>
          </AlertDescription>
        </Alert>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">إجمالي المستحقات</p>
                  <p className="text-xl font-bold text-white">
                    ${(summary?.total_amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">عمولة المنصة (10%)</p>
                  <p className="text-xl font-bold text-green-400">
                    ${(summary?.total_platform_fee || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">الدفعات</p>
                  <p className="text-xl font-bold text-white">
                    {summary?.total_batches || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">المستحقات</p>
                  <p className="text-xl font-bold text-white">
                    {summary?.total_payouts || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">في الانتظار</p>
                  <p className="text-xl font-bold text-yellow-400">
                    {summary?.pending_batches || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-orange-600">
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="batches" className="data-[state=active]:bg-orange-600">
              الدفعات الشهرية
            </TabsTrigger>
            <TabsTrigger value="payouts" className="data-[state=active]:bg-orange-600">
              المستحقات الفردية
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* How it works */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-400" />
                    كيف يعمل النظام؟
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">1</div>
                    <div>
                      <p className="text-white font-medium">توليد الدفعة الشهرية</p>
                      <p className="text-gray-400 text-sm">اضغط "إنشاء دفعة جديدة" لحساب مستحقات الشهر</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">2</div>
                    <div>
                      <p className="text-white font-medium">مراجعة المستحقات</p>
                      <p className="text-gray-400 text-sm">راجع كل مستحق وتأكد من صحة البيانات</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">3</div>
                    <div>
                      <p className="text-white font-medium">تصدير CSV</p>
                      <p className="text-gray-400 text-sm">حمّل ملف CSV للاحتفاظ به أو إرساله يدوياً</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 opacity-50">
                    <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center text-gray-400 font-bold">4</div>
                    <div>
                      <p className="text-gray-400 font-medium">إرسال لـ Payoneer (قريباً)</p>
                      <p className="text-gray-500 text-sm">سيتم الإرسال تلقائياً بعد التعاقد</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    آخر الدفعات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {batches.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">لا توجد دفعات حتى الآن</p>
                      <p className="text-gray-500 text-sm">اضغط "إنشاء دفعة جديدة" للبدء</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {batches.slice(0, 5).map((batch) => (
                        <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{batch.period}</p>
                            <p className="text-gray-400 text-sm">{batch.total_payouts} مستحق</p>
                          </div>
                          <div className="text-right">
                            <p className="text-orange-400 font-bold">${batch.total_amount?.toLocaleString()}</p>
                            <Badge className={statusColors[batch.status]}>
                              {statusLabels[batch.status]}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batches Tab */}
          <TabsContent value="batches">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">الدفعات الشهرية</CardTitle>
                <CardDescription>كل دفعة تمثل مستحقات شهر كامل</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
                  </div>
                ) : batches.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">لا توجد دفعات</p>
                    <Button 
                      className="mt-4 bg-orange-600 hover:bg-orange-700"
                      onClick={() => setIsGenerateDialogOpen(true)}
                    >
                      <Zap className="w-4 h-4 ml-2" />
                      إنشاء أول دفعة
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="text-gray-400">الفترة</TableHead>
                        <TableHead className="text-gray-400">المستحقات</TableHead>
                        <TableHead className="text-gray-400">المعلنين</TableHead>
                        <TableHead className="text-gray-400">المروجين</TableHead>
                        <TableHead className="text-gray-400">الإجمالي</TableHead>
                        <TableHead className="text-gray-400">العمولة</TableHead>
                        <TableHead className="text-gray-400">الحالة</TableHead>
                        <TableHead className="text-gray-400">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((batch) => (
                        <TableRow key={batch.id} className="border-gray-800">
                          <TableCell className="text-white font-medium">
                            {batch.period}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {batch.total_payouts}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {batch.total_advertisers}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {batch.total_publishers}
                          </TableCell>
                          <TableCell className="text-orange-400 font-bold">
                            ${batch.total_amount?.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-green-400 font-bold">
                            ${batch.total_platform_fee?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[batch.status]}>
                              {statusLabels[batch.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedBatch(batch)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleExportCSV(batch.id)}
                                className="text-green-400 hover:text-green-300"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">المستحقات الفردية</CardTitle>
                <CardDescription>كل سجل يمثل مستحقات مروج من معلن معين</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-orange-400 animate-spin" />
                  </div>
                ) : payouts.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">لا توجد مستحقات</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead className="text-gray-400">المعلن</TableHead>
                        <TableHead className="text-gray-400">المروج</TableHead>
                        <TableHead className="text-gray-400">الفترة</TableHead>
                        <TableHead className="text-gray-400">التحويلات</TableHead>
                        <TableHead className="text-gray-400">المبلغ</TableHead>
                        <TableHead className="text-gray-400">العمولة</TableHead>
                        <TableHead className="text-gray-400">الصافي</TableHead>
                        <TableHead className="text-gray-400">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout.id} className="border-gray-800">
                          <TableCell>
                            <div>
                              <p className="text-white text-sm">
                                {payout.advertiser?.company_name || payout.advertiser?.full_name || 'N/A'}
                              </p>
                              <p className="text-gray-500 text-xs">{payout.advertiser?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-white text-sm">
                                {payout.publisher?.full_name || payout.publisher?.username || 'N/A'}
                              </p>
                              <p className="text-gray-500 text-xs">{payout.publisher?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {payout.period}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {payout.conversions_count}
                          </TableCell>
                          <TableCell className="text-white font-medium">
                            ${payout.amount?.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-orange-400">
                            ${payout.platform_fee?.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-green-400 font-bold">
                            ${payout.net_amount?.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[payout.status]}>
                              {statusLabels[payout.status]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Generate Batch Dialog */}
        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-400" />
                إنشاء دفعة جديدة
              </DialogTitle>
              <DialogDescription>
                سيتم حساب جميع المستحقات للمروجين من التحويلات المؤكدة في الفترة المحددة
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">الشهر</label>
                  <Select 
                    value={String(generateMonth)} 
                    onValueChange={(v) => setGenerateMonth(Number(v))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthNames.map((name, idx) => (
                        <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">السنة</label>
                  <Select 
                    value={String(generateYear)} 
                    onValueChange={(v) => setGenerateYear(Number(v))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert className="bg-orange-500/10 border-orange-500/30">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-orange-300/80 text-sm">
                  سيتم إنشاء الدفعة كـ "مسودة" ولن يتم إرسالها لـ Payoneer حتى يتم التعاقد.
                  يمكنك تصدير CSV للاحتفاظ بالبيانات.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsGenerateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleGenerateBatch}
                disabled={isGenerating}
                className="bg-gradient-to-r from-orange-600 to-amber-600"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    جاري الحساب...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 ml-2" />
                    إنشاء الدفعة
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

