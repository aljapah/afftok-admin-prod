import { useState, useEffect } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Send, 
  Download, 
  RefreshCw, 
  Calendar,
  DollarSign,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  Eye,
  Image,
  XCircle,
  Check
} from "lucide-react";

// Types
interface Invoice {
  id: string;
  advertiser_id: string;
  advertiser?: {
    company_name?: string;
    email?: string;
    full_name?: string;
  };
  month: number;
  year: number;
  total_conversions: number;
  total_promoter_payout: number;
  platform_rate: number;
  platform_amount: number;
  currency: string;
  status: string;
  due_date: string;
  period_start: string;
  period_end: string;
  payment_proof?: string;
  payment_method?: string;
  payment_note?: string;
  paid_at?: string;
  created_at: string;
}

interface InvoiceSummary {
  total_invoices: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  pending_count: number;
  overdue_count: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://afftok-backend-prod-production.up.railway.app';

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  pending_confirmation: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
  overdue: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  pending: "في الانتظار",
  pending_confirmation: "بانتظار التأكيد",
  paid: "مدفوعة",
  overdue: "متأخرة",
};

const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isPaymentProofDialogOpen, setIsPaymentProofDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth());
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [reviewNote, setReviewNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch invoices from API
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setSummary(data.summary || null);
      } else {
        // Fallback to demo data if API fails
        console.warn('Using demo data');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/invoices/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: generateMonth + 1, // 1-indexed
          year: generateYear,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`تم إصدار ${data.created_count} فاتورة جديدة`);
        fetchInvoices();
      } else {
        toast.error('فشل في إصدار الفواتير');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setIsGenerating(false);
      setIsGenerateDialogOpen(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/invoices/${selectedInvoice.id}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_note: reviewNote }),
      });

      if (response.ok) {
        toast.success('تم تأكيد الدفع بنجاح');
        setIsPaymentProofDialogOpen(false);
        setReviewNote("");
        fetchInvoices();
      } else {
        toast.error('فشل في تأكيد الدفع');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedInvoice || !reviewNote.trim()) {
      toast.error('يرجى كتابة سبب الرفض');
      return;
    }
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/invoices/${selectedInvoice.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ review_note: reviewNote }),
      });

      if (response.ok) {
        toast.success('تم رفض الدفع');
        setIsPaymentProofDialogOpen(false);
        setReviewNote("");
        fetchInvoices();
      } else {
        toast.error('فشل في رفض الدفع');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewPaymentProof = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setReviewNote("");
    setIsPaymentProofDialogOpen(true);
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    const advertiser = invoice.advertiser;
    const email = advertiser?.email || '';
    const subject = encodeURIComponent(`Invoice ${invoice.id} - AffTok Platform Fee`);
    const body = encodeURIComponent(`Dear ${advertiser?.company_name || advertiser?.full_name || 'Advertiser'},

Please find attached your invoice for ${monthNames[invoice.month - 1]} ${invoice.year}.

Total Promoter Commissions: $${invoice.total_promoter_payout?.toLocaleString() || 0}
Platform Fee (10%): $${invoice.platform_amount?.toLocaleString() || 0}

Due Date: ${invoice.due_date}

Payment Details:
Bank: National Bank of Kuwait (NBK)
Beneficiary: ABDULAZIZ S M ALJABAAH
Account: 2003308649
IBAN: KW55NBOK0000000000002003308649
SWIFT: NBOKKWKW

Thank you for your business.

Best regards,
AffTok Team`);
    
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    const advertiser = invoice.advertiser;
    const invoiceHTML = `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice INV-${invoice.year}-${String(invoice.month).padStart(2, '0')}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 3px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 32px; font-weight: bold; color: #dc2626; }
    .invoice-id { font-size: 24px; font-weight: bold; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .section-title { font-weight: bold; color: #333; margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; font-weight: bold; }
    .total { background: #1a1a1a; color: white; }
    .total td { font-size: 18px; font-weight: bold; }
    .payment-info { background: #f9f9f9; padding: 20px; border-top: 4px solid #dc2626; margin-top: 20px; }
    .payment-info h3 { margin-top: 0; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">AffTok</div>
      <div>Affiliate Marketing Platform</div>
    </div>
    <div style="text-align: right;">
      <div class="invoice-id">INV-${invoice.year}-${String(invoice.month).padStart(2, '0')}</div>
      <div>INVOICE</div>
    </div>
  </div>

  <div class="details">
    <div>
      <div class="section-title">BILL TO:</div>
      <div style="font-size: 18px; font-weight: bold;">${advertiser?.company_name || advertiser?.full_name || 'N/A'}</div>
      <div>${advertiser?.email || 'N/A'}</div>
    </div>
    <div style="text-align: right;">
      <div><strong>Issue Date:</strong> ${invoice.created_at?.split('T')[0] || 'N/A'}</div>
      <div><strong>Due Date:</strong> <span style="color: #dc2626;">${invoice.due_date?.split('T')[0] || 'N/A'}</span></div>
      <div><strong>Period:</strong> ${monthNames[invoice.month - 1]} ${invoice.year}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: right;">Amount (${invoice.currency || 'USD'})</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Total Promoter Commissions</strong><br>
          <small>Period: ${monthNames[invoice.month - 1]} ${invoice.year}</small>
        </td>
        <td style="text-align: right;">$${invoice.total_promoter_payout?.toLocaleString() || 0}</td>
      </tr>
      <tr style="background: #fef2f2;">
        <td>
          <strong style="color: #dc2626;">Platform Fee (10%)</strong><br>
          <small>As per agreement</small>
        </td>
        <td style="text-align: right; color: #dc2626; font-weight: bold; font-size: 18px;">$${invoice.platform_amount?.toLocaleString() || 0}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total">
        <td>Total Amount Due</td>
        <td style="text-align: right;">$${invoice.platform_amount?.toLocaleString() || 0}</td>
      </tr>
    </tfoot>
  </table>

  <div class="payment-info">
    <h3>💳 Payment Details:</h3>
    <div><strong>Bank:</strong> National Bank of Kuwait (NBK)</div>
    <div><strong>Beneficiary:</strong> ABDULAZIZ S M ALJABAAH</div>
    <div><strong>Account:</strong> 2003308649</div>
    <div><strong>IBAN:</strong> KW55NBOK0000000000002003308649</div>
    <div><strong>SWIFT:</strong> NBOKKWKW</div>
  </div>

  <div class="footer">
    <p><strong>⏰ Payment is due within 7 days of invoice date.</strong></p>
    <p>For inquiries: support@afftokapp.com</p>
  </div>
</body>
</html>`;

    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INV-${invoice.year}-${String(invoice.month).padStart(2, '0')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreviewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPreviewDialogOpen(true);
  };

  // Calculate summary from data
  const totalPending = invoices.filter(i => i.status === "pending" || i.status === "pending_confirmation").reduce((sum, i) => sum + (i.platform_amount || 0), 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.platform_amount || 0), 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((sum, i) => sum + (i.platform_amount || 0), 0);
  const pendingConfirmationCount = invoices.filter(i => i.status === "pending_confirmation").length;

  return (
    <DashboardLayout>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">الفواتير الشهرية</h1>
          <p className="text-gray-400 mt-1">إدارة فواتير المعلنين - نسبة المنصة 10%</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={fetchInvoices}
            className="border-gray-700"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
          <Button 
            onClick={() => setIsGenerateDialogOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <FileText className="w-4 h-4 ml-2" />
            إصدار الفواتير الشهرية
          </Button>
        </div>
      </div>

      {/* Pending Confirmation Alert */}
      {pendingConfirmationCount > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center gap-3">
          <Image className="w-6 h-6 text-blue-400" />
          <div>
            <p className="text-blue-400 font-medium">
              {pendingConfirmationCount} فاتورة بانتظار تأكيد الدفع
            </p>
            <p className="text-blue-400/70 text-sm">
              المعلنون أرسلوا إثباتات الدفع وينتظرون المراجعة
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">إجمالي المستحقات</p>
                <p className="text-xl font-bold text-white">${(totalPending + totalPaid + totalOverdue).toLocaleString()}</p>
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
                <p className="text-xl font-bold text-yellow-400">${totalPending.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">المدفوعة</p>
                <p className="text-xl font-bold text-green-400">${totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">المتأخرة</p>
                <p className="text-xl font-bold text-red-400">${totalOverdue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48 bg-gray-900 border-gray-700">
            <SelectValue placeholder="اختر الشهر" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأشهر</SelectItem>
            {monthNames.map((name, idx) => (
              <SelectItem key={idx} value={`${new Date().getFullYear()}-${String(idx + 1).padStart(2, '0')}`}>
                {name} {new Date().getFullYear()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">سجل الفواتير</CardTitle>
          <CardDescription>جميع الفواتير الصادرة للمعلنين</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">لا توجد فواتير حتى الآن</p>
              <p className="text-gray-500 text-sm mt-2">اضغط على "إصدار الفواتير الشهرية" لإنشاء فواتير جديدة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">رقم الفاتورة</TableHead>
                  <TableHead className="text-gray-400">المعلن</TableHead>
                  <TableHead className="text-gray-400">الشهر</TableHead>
                  <TableHead className="text-gray-400">العمولات</TableHead>
                  <TableHead className="text-gray-400">نسبة المنصة (10%)</TableHead>
                  <TableHead className="text-gray-400">الحالة</TableHead>
                  <TableHead className="text-gray-400">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-gray-400">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-gray-800">
                    <TableCell className="font-mono text-purple-400">
                      INV-{invoice.year}-{String(invoice.month).padStart(2, '0')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">
                          {invoice.advertiser?.company_name || invoice.advertiser?.full_name || 'N/A'}
                        </p>
                        <p className="text-gray-500 text-sm">{invoice.advertiser?.email || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {monthNames[invoice.month - 1]} {invoice.year}
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      ${invoice.total_promoter_payout?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-green-400 font-bold">
                      ${invoice.platform_amount?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[invoice.status] || statusColors.pending}>
                        {statusLabels[invoice.status] || invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {invoice.due_date?.split('T')[0] || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* Show Payment Proof button for pending_confirmation */}
                        {invoice.status === "pending_confirmation" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewPaymentProof(invoice)}
                            className="text-blue-400 hover:text-blue-300 bg-blue-500/10"
                            title="عرض إثبات الدفع"
                          >
                            <Image className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreviewInvoice(invoice)}
                          className="text-gray-400 hover:text-white"
                          title="معاينة"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSendInvoice(invoice)}
                          className="text-blue-400 hover:text-blue-300"
                          title="إرسال"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="text-green-400 hover:text-green-300"
                          title="تحميل"
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

      {/* Generate Invoice Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">إصدار الفواتير الشهرية</DialogTitle>
            <DialogDescription>
              سيتم إصدار فواتير لجميع المعلنين الذين لديهم تحويلات في الشهر المحدد
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">الشهر</Label>
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
                <Label className="text-gray-400">السنة</Label>
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

            <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg">
              <p className="text-yellow-400 text-sm">
                ⚠️ سيتم إصدار فواتير للمعلنين الذين لديهم تحويلات مؤكدة فقط
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsGenerateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  جاري الإصدار...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 ml-2" />
                  إصدار الفواتير
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Proof Review Dialog */}
      <Dialog open={isPaymentProofDialogOpen} onOpenChange={setIsPaymentProofDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-400" />
              مراجعة إثبات الدفع
            </DialogTitle>
            <DialogDescription>
              راجع إثبات الدفع المرسل من المعلن وقم بتأكيده أو رفضه
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              {/* Invoice Info */}
              <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">المعلن:</span>
                  <span className="text-white font-medium">
                    {selectedInvoice.advertiser?.company_name || selectedInvoice.advertiser?.full_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">المبلغ:</span>
                  <span className="text-green-400 font-bold">
                    ${selectedInvoice.platform_amount?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">طريقة الدفع:</span>
                  <span className="text-white">
                    {selectedInvoice.payment_method || 'غير محدد'}
                  </span>
                </div>
              </div>

              {/* Payment Proof Image */}
              {selectedInvoice.payment_proof && (
                <div className="space-y-2">
                  <Label className="text-gray-400">صورة الإيصال:</Label>
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={selectedInvoice.payment_proof} 
                      alt="Payment Proof"
                      className="w-full max-h-80 object-contain bg-gray-800"
                      onClick={() => window.open(selectedInvoice.payment_proof, '_blank')}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedInvoice.payment_proof, '_blank')}
                    className="w-full border-gray-700"
                  >
                    <Eye className="w-4 h-4 ml-2" />
                    فتح الصورة بالحجم الكامل
                  </Button>
                </div>
              )}

              {/* Payment Note */}
              {selectedInvoice.payment_note && (
                <div className="space-y-2">
                  <Label className="text-gray-400">ملاحظة المعلن:</Label>
                  <div className="bg-gray-800/50 p-3 rounded-lg text-white text-sm">
                    {selectedInvoice.payment_note}
                  </div>
                </div>
              )}

              {/* Review Note */}
              <div className="space-y-2">
                <Label className="text-gray-400">ملاحظة المراجعة (مطلوبة للرفض):</Label>
                <Textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="أدخل ملاحظة..."
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsPaymentProofDialogOpen(false)}>
              إغلاق
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 ml-2" />
              )}
              رفض الدفع
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleConfirmPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 ml-2" />
              )}
              تأكيد الدفع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="bg-white border-gray-300 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">معاينة الفاتورة</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="bg-white p-4 rounded-lg max-h-[60vh] overflow-y-auto text-black">
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-red-600">AffTok</h2>
                  <p className="text-gray-600 text-sm">Affiliate Marketing Platform</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">INV-{selectedInvoice.year}-{String(selectedInvoice.month).padStart(2, '0')}</p>
                  <p className="text-gray-600 text-sm">INVOICE</p>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-6 py-4 border-b border-gray-200">
                <div>
                  <p className="text-gray-600 text-sm uppercase mb-1">Bill To:</p>
                  <p className="font-bold text-lg">
                    {selectedInvoice.advertiser?.company_name || selectedInvoice.advertiser?.full_name || 'N/A'}
                  </p>
                  <p className="text-gray-600">{selectedInvoice.advertiser?.email || 'N/A'}</p>
                </div>
                <div className="text-right space-y-1">
                  <p><span className="text-gray-600">Due Date:</span> <span className="text-red-600 font-medium">{selectedInvoice.due_date?.split('T')[0]}</span></p>
                  <p><span className="text-gray-600">Period:</span> <span className="font-medium">{monthNames[selectedInvoice.month - 1]} {selectedInvoice.year}</span></p>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="py-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-900">
                      <th className="text-left py-2 text-gray-900">Description</th>
                      <th className="text-right py-2 text-gray-900">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-3">
                        <p className="font-medium">Total Promoter Commissions</p>
                        <p className="text-gray-500 text-sm">Period: {monthNames[selectedInvoice.month - 1]} {selectedInvoice.year}</p>
                      </td>
                      <td className="text-right font-medium">${selectedInvoice.total_promoter_payout?.toLocaleString() || 0}</td>
                    </tr>
                    <tr className="bg-red-50">
                      <td className="py-3">
                        <p className="font-bold text-red-700">Platform Fee (10%)</p>
                      </td>
                      <td className="text-right font-bold text-red-600 text-lg">${selectedInvoice.platform_amount?.toLocaleString() || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="py-3 bg-gray-900 text-white -mx-4 px-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total Amount Due:</span>
                  <span className="text-xl font-bold">${selectedInvoice.platform_amount?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPreviewDialogOpen(false)}>
              إغلاق
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (selectedInvoice) {
                  handleSendInvoice(selectedInvoice);
                  setIsPreviewDialogOpen(false);
                }
              }}
            >
              <Send className="w-4 h-4 ml-2" />
              إرسال للمعلن
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (selectedInvoice) {
                  handleDownloadInvoice(selectedInvoice);
                }
              }}
            >
              <Download className="w-4 h-4 ml-2" />
              تحميل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
