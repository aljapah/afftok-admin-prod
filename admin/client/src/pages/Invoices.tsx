import { useState } from "react";
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
  Eye
} from "lucide-react";

// Demo data for invoices
const demoInvoices = [
  {
    id: "INV-2025-001",
    advertiser: "شركة الأجهر",
    email: "aljapah.a@gmail.com",
    month: "January 2025",
    totalCommissions: 5000,
    platformFee: 500, // 10%
    status: "pending",
    dueDate: "2025-01-08",
    issuedAt: "2025-01-01",
  },
  {
    id: "INV-2025-002", 
    advertiser: "Tech Solutions",
    email: "tech@example.com",
    month: "January 2025",
    totalCommissions: 12500,
    platformFee: 1250,
    status: "paid",
    dueDate: "2025-01-08",
    issuedAt: "2025-01-01",
    paidAt: "2025-01-05",
  },
];

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
  overdue: "bg-red-500/20 text-red-400 border-red-500/30",
  sent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const statusLabels: Record<string, string> = {
  pending: "في الانتظار",
  paid: "مدفوعة",
  overdue: "متأخرة",
  sent: "تم الإرسال",
};

export default function Invoices() {
  const [invoices, setInvoices] = useState(demoInvoices);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<typeof demoInvoices[0] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setIsGenerateDialogOpen(false);
    // Show success message
  };

  const handleSendInvoice = async (invoice: typeof demoInvoices[0]) => {
    // Open email client with invoice details
    const subject = encodeURIComponent(`Invoice ${invoice.id} - AffTok Platform Fee`);
    const body = encodeURIComponent(`Dear ${invoice.advertiser},

Please find attached your invoice ${invoice.id} for ${invoice.month}.

Total Promoter Commissions: $${invoice.totalCommissions.toLocaleString()}
Platform Fee (10%): $${invoice.platformFee.toLocaleString()}

Due Date: ${invoice.dueDate}

Payment Details:
Bank: National Bank of Kuwait (NBK)
Beneficiary: ABDULAZIZ S M ALJABAAH
Account: 2003308649
IBAN: KW55NBOK0000000000002003308649
SWIFT: NBOKKWKW

Thank you for your business.

Best regards,
AffTok Team`);
    
    window.open(`mailto:${invoice.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleResendInvoice = async (invoice: typeof demoInvoices[0]) => {
    // Open email client for resend
    const subject = encodeURIComponent(`[REMINDER] Invoice ${invoice.id} - AffTok Platform Fee`);
    const body = encodeURIComponent(`Dear ${invoice.advertiser},

This is a reminder for your pending invoice ${invoice.id} for ${invoice.month}.

Total Promoter Commissions: $${invoice.totalCommissions.toLocaleString()}
Platform Fee (10%): $${invoice.platformFee.toLocaleString()}

Due Date: ${invoice.dueDate}

Payment Details:
Bank: National Bank of Kuwait (NBK)
Beneficiary: ABDULAZIZ S M ALJABAAH
Account: 2003308649
IBAN: KW55NBOK0000000000002003308649
SWIFT: NBOKKWKW

Please process this payment at your earliest convenience.

Best regards,
AffTok Team`);
    
    window.open(`mailto:${invoice.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleDownloadInvoice = (invoice: typeof demoInvoices[0]) => {
    // Generate and download invoice as HTML/PDF
    const invoiceHTML = `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.id}</title>
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
      <div class="invoice-id">${invoice.id}</div>
      <div>INVOICE</div>
    </div>
  </div>

  <div class="details">
    <div>
      <div class="section-title">BILL TO:</div>
      <div style="font-size: 18px; font-weight: bold;">${invoice.advertiser}</div>
      <div>${invoice.email}</div>
    </div>
    <div style="text-align: right;">
      <div><strong>Issue Date:</strong> ${invoice.issuedAt}</div>
      <div><strong>Due Date:</strong> <span style="color: #dc2626;">${invoice.dueDate}</span></div>
      <div><strong>Period:</strong> ${invoice.month}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: right;">Amount (USD)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>Total Promoter Commissions</strong><br>
          <small>Period: ${invoice.month}</small>
        </td>
        <td style="text-align: right;">$${invoice.totalCommissions.toLocaleString()}</td>
      </tr>
      <tr style="background: #fef2f2;">
        <td>
          <strong style="color: #dc2626;">Platform Fee (10%)</strong><br>
          <small>As per agreement</small>
        </td>
        <td style="text-align: right; color: #dc2626; font-weight: bold; font-size: 18px;">$${invoice.platformFee.toLocaleString()}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total">
        <td>Total Amount Due</td>
        <td style="text-align: right;">$${invoice.platformFee.toLocaleString()}</td>
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
    <p>For inquiries: billing@afftokapp.com</p>
  </div>
</body>
</html>`;

    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreviewInvoice = (invoice: typeof demoInvoices[0]) => {
    setSelectedInvoice(invoice);
    setIsPreviewDialogOpen(true);
  };

  // Calculate summary
  const totalPending = invoices.filter(i => i.status === "pending").reduce((sum, i) => sum + i.platformFee, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.platformFee, 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((sum, i) => sum + i.platformFee, 0);

  return (
    <DashboardLayout>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">الفواتير الشهرية</h1>
          <p className="text-gray-400 mt-1">إدارة فواتير المعلنين - نسبة المنصة 10%</p>
        </div>
        <Button 
          onClick={() => setIsGenerateDialogOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <FileText className="w-4 h-4 ml-2" />
          إصدار الفواتير الشهرية
        </Button>
      </div>

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
            <SelectItem value="2025-01">يناير 2025</SelectItem>
            <SelectItem value="2025-02">فبراير 2025</SelectItem>
            <SelectItem value="2025-03">مارس 2025</SelectItem>
            <SelectItem value="2025-04">أبريل 2025</SelectItem>
            <SelectItem value="2025-05">مايو 2025</SelectItem>
            <SelectItem value="2025-06">يونيو 2025</SelectItem>
            <SelectItem value="2025-07">يوليو 2025</SelectItem>
            <SelectItem value="2025-08">أغسطس 2025</SelectItem>
            <SelectItem value="2025-09">سبتمبر 2025</SelectItem>
            <SelectItem value="2025-10">أكتوبر 2025</SelectItem>
            <SelectItem value="2025-11">نوفمبر 2025</SelectItem>
            <SelectItem value="2025-12">ديسمبر 2025</SelectItem>
            <SelectItem value="2026-01">يناير 2026</SelectItem>
            <SelectItem value="2026-02">فبراير 2026</SelectItem>
            <SelectItem value="2026-03">مارس 2026</SelectItem>
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
                  <TableCell className="font-mono text-purple-400">{invoice.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white font-medium">{invoice.advertiser}</p>
                      <p className="text-gray-500 text-sm">{invoice.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{invoice.month}</TableCell>
                  <TableCell className="text-white font-medium">${invoice.totalCommissions.toLocaleString()}</TableCell>
                  <TableCell className="text-green-400 font-bold">${invoice.platformFee.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[invoice.status]}>
                      {statusLabels[invoice.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400">{invoice.dueDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
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
                        onClick={() => handleResendInvoice(invoice)}
                        className="text-gray-400 hover:text-white"
                        title="إعادة إرسال"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="text-green-400 hover:text-green-300"
                        title="تحميل PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generate Invoice Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">إصدار الفواتير الشهرية</DialogTitle>
            <DialogDescription>
              سيتم إصدار فواتير لجميع المعلنين الفعّالين للشهر الماضي
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gray-800/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">الشهر:</span>
                <span className="text-white">ديسمبر 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">عدد المعلنين:</span>
                <span className="text-white">5 معلنين</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">إجمالي العمولات:</span>
                <span className="text-white">$17,500</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-purple-400">نسبة المنصة (10%):</span>
                <span className="text-green-400">$1,750</span>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg">
              <p className="text-yellow-400 text-sm">
                ⚠️ سيتم إرسال الفواتير إلى البريد الإلكتروني لكل معلن تلقائياً
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
                  إصدار وإرسال الفواتير
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="bg-white border-black max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">معاينة الفاتورة</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="bg-white p-4 rounded-lg max-h-[60vh] overflow-y-auto" style={{ color: '#000000', border: '4px solid #000000' }}>
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src="/logo.png" 
                    alt="AffTok" 
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      // Fallback to SVG logo if image fails
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <svg className="w-12 h-12 hidden" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#dc2626" strokeWidth="6"/>
                    <path d="M50 20 L30 75 L40 75 L45 60 L55 60 L60 75 L70 75 L50 20 Z M47 50 L50 35 L53 50 Z" fill="#dc2626"/>
                    <path d="M85 50 Q85 75 60 85" fill="none" stroke="#dc2626" strokeWidth="6" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <h2 className="text-2xl font-bold text-red-600">AffTok</h2>
                    <p className="text-black text-sm font-bold">Affiliate Marketing Platform</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-black">{selectedInvoice.id}</p>
                  <p className="text-black text-sm font-bold">INVOICE</p>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-6 py-4 border-b">
                <div>
                  <p className="text-black text-sm uppercase mb-1 font-bold">Bill To:</p>
                  <p className="font-bold text-lg text-black">{selectedInvoice.advertiser}</p>
                  <p className="text-black text-base font-bold">{selectedInvoice.email}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-base"><span className="text-black font-bold">Issue Date:</span> <span className="font-bold text-black">{selectedInvoice.issuedAt}</span></p>
                  <p className="text-base"><span className="text-black font-bold">Due Date:</span> <span className="font-bold text-red-700">{selectedInvoice.dueDate}</span></p>
                  <p className="text-base"><span className="text-black font-bold">Period:</span> <span className="font-bold text-black">{selectedInvoice.month}</span></p>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="py-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-left py-2 text-black text-base font-bold">Description</th>
                      <th className="text-right py-2 text-black text-base font-bold">Amount (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="py-3">
                        <p className="font-bold text-black">Total Promoter Commissions</p>
                        <p className="text-black text-sm font-bold">Period: {selectedInvoice.month}</p>
                      </td>
                      <td className="text-right font-bold text-black">${selectedInvoice.totalCommissions.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-red-50">
                      <td className="py-3">
                        <p className="font-bold text-red-700">Platform Fee (10%)</p>
                        <p className="text-black text-sm font-bold">As per agreement</p>
                      </td>
                      <td className="text-right font-bold text-red-600 text-lg">${selectedInvoice.platformFee.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="py-2 bg-gray-900 text-white -mx-6 px-6">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold">Total Amount Due:</span>
                  <span className="text-xl font-bold">${selectedInvoice.platformFee.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="py-2 bg-white -mx-6 px-6 mt-2" style={{ borderTop: '4px solid #dc2626' }}>
                <p className="font-bold mb-2 text-black text-sm">💳 Payment Details:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex">
                    <span className="text-black w-24 font-bold">Bank:</span>
                    <span className="font-bold text-black">National Bank of Kuwait (NBK)</span>
                  </div>
                  <div className="flex">
                    <span className="text-black w-24 font-bold">Beneficiary:</span>
                    <span className="font-bold text-black">ABDULAZIZ S M ALJABAAH</span>
                  </div>
                  <div className="flex">
                    <span className="text-black w-24 font-bold">Account:</span>
                    <span className="font-bold text-black">2003308649</span>
                  </div>
                  <div className="flex flex-wrap">
                    <span className="text-black w-24 font-bold">IBAN:</span>
                    <span className="font-bold text-black text-xs break-all">KW55NBOK0000000000002003308649</span>
                  </div>
                  <div className="flex">
                    <span className="text-black w-24 font-bold">SWIFT:</span>
                    <span className="font-bold text-black">NBOKKWKW</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-black text-xs py-2 border-t border-black">
                <p className="font-bold">⏰ Payment is due within 7 days of invoice date.</p>
                <p className="font-bold">For inquiries: billing@afftokapp.com</p>
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
              تحميل PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}

