import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { 
  Shield, CheckCircle, XCircle, Clock, Eye, User, 
  FileText, AlertTriangle, DollarSign, CreditCard,
  Building, Globe, Calendar
} from "lucide-react";

interface KYCVerification {
  id: string;
  user_id: string;
  full_legal_name: string;
  date_of_birth: string;
  nationality: string;
  country: string;
  address: string;
  city: string;
  phone_number: string;
  document_type: string;
  document_number: string;
  document_front_url: string;
  document_back_url: string;
  selfie_url: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
  risk_level: string;
  created_at: string;
  user?: {
    username: string;
    email: string;
    full_name: string;
  };
}

interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  fee: number;
  net_amount: number;
  status: "pending" | "processing" | "completed" | "rejected";
  transaction_id?: string;
  rejection_reason?: string;
  created_at: string;
  user?: {
    username: string;
    email: string;
  };
  payment_method?: {
    method_type: string;
    paypal_email?: string;
    iban?: string;
  };
}

export default function KYC() {
  const [selectedKYC, setSelectedKYC] = useState<KYCVerification | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [rejectionReason, setRejectionReason] = useState("");
  const [riskLevel, setRiskLevel] = useState("low");
  const [transactionId, setTransactionId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data for now - will be replaced with actual API calls
  const mockKYCs: KYCVerification[] = [
    {
      id: "1",
      user_id: "user-1",
      full_legal_name: "أحمد محمد الكويتي",
      date_of_birth: "1990-05-15",
      nationality: "KW",
      country: "KW",
      address: "شارع الخليج، السالمية",
      city: "الكويت",
      phone_number: "+965 9999 8888",
      document_type: "national_id",
      document_number: "290050512345",
      document_front_url: "https://example.com/doc-front.jpg",
      document_back_url: "https://example.com/doc-back.jpg",
      selfie_url: "https://example.com/selfie.jpg",
      status: "pending",
      risk_level: "low",
      created_at: new Date().toISOString(),
      user: {
        username: "ahmed_kw",
        email: "ahmed@example.com",
        full_name: "أحمد محمد"
      }
    }
  ];

  const mockPayouts: PayoutRequest[] = [
    {
      id: "1",
      user_id: "user-1",
      amount: 15000, // $150
      currency: "USD",
      fee: 300, // $3
      net_amount: 14700,
      status: "pending",
      created_at: new Date().toISOString(),
      user: {
        username: "ahmed_kw",
        email: "ahmed@example.com"
      },
      payment_method: {
        method_type: "paypal",
        paypal_email: "ahmed@paypal.com"
      }
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500"><Clock className="w-3 h-3 mr-1" /> قيد المراجعة</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500"><CheckCircle className="w-3 h-3 mr-1" /> موافق</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500"><XCircle className="w-3 h-3 mr-1" /> مرفوض</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500"><Clock className="w-3 h-3 mr-1" /> قيد المعالجة</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500"><CheckCircle className="w-3 h-3 mr-1" /> مكتمل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "low":
        return <Badge className="bg-green-500">منخفض</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">متوسط</Badge>;
      case "high":
        return <Badge className="bg-red-500">عالي</Badge>;
      default:
        return <Badge>{risk}</Badge>;
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleReviewKYC = () => {
    // API call to review KYC
    console.log("Reviewing KYC:", selectedKYC?.id, reviewAction, rejectionReason, riskLevel);
    setReviewDialogOpen(false);
    setSelectedKYC(null);
    setRejectionReason("");
  };

  const handleProcessPayout = (action: string) => {
    // API call to process payout
    console.log("Processing payout:", selectedPayout?.id, action, transactionId);
    setPayoutDialogOpen(false);
    setSelectedPayout(null);
    setTransactionId("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-500" />
            KYC & التحقق من الهوية
          </h1>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">طلبات قيد المراجعة</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تم التحقق</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">128</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">طلبات سحب معلقة</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المدفوعات</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,230</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="kyc" className="space-y-4">
          <TabsList>
            <TabsTrigger value="kyc" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              طلبات KYC
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              طلبات السحب
            </TabsTrigger>
          </TabsList>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>طلبات التحقق من الهوية</CardTitle>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="تصفية حسب الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="pending">قيد المراجعة</SelectItem>
                      <SelectItem value="approved">موافق</SelectItem>
                      <SelectItem value="rejected">مرفوض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>الاسم القانوني</TableHead>
                      <TableHead>الدولة</TableHead>
                      <TableHead>نوع الوثيقة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>مستوى الخطر</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockKYCs.map((kyc) => (
                      <TableRow key={kyc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{kyc.user?.username}</div>
                              <div className="text-xs text-gray-500">{kyc.user?.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{kyc.full_legal_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {kyc.country}
                          </div>
                        </TableCell>
                        <TableCell>
                          {kyc.document_type === "national_id" ? "هوية وطنية" : 
                           kyc.document_type === "passport" ? "جواز سفر" : "رخصة قيادة"}
                        </TableCell>
                        <TableCell>{getStatusBadge(kyc.status)}</TableCell>
                        <TableCell>{getRiskBadge(kyc.risk_level)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(kyc.created_at).toLocaleDateString('ar-SA')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedKYC(kyc);
                              setReviewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            مراجعة
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>طلبات السحب</CardTitle>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="تصفية حسب الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="pending">معلق</SelectItem>
                      <SelectItem value="processing">قيد المعالجة</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="rejected">مرفوض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الرسوم</TableHead>
                      <TableHead>الصافي</TableHead>
                      <TableHead>طريقة الدفع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPayouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{payout.user?.username}</div>
                              <div className="text-xs text-gray-500">{payout.user?.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-green-500">
                          {formatCurrency(payout.amount)}
                        </TableCell>
                        <TableCell className="text-red-500">
                          -{formatCurrency(payout.fee)}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(payout.net_amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3" />
                            {payout.payment_method?.method_type === "paypal" ? "PayPal" :
                             payout.payment_method?.method_type === "bank_transfer" ? "تحويل بنكي" :
                             payout.payment_method?.method_type}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payout.payment_method?.paypal_email || payout.payment_method?.iban}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(payout.created_at).toLocaleDateString('ar-SA')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedPayout(payout);
                              setPayoutDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            معالجة
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* KYC Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                مراجعة طلب KYC
              </DialogTitle>
            </DialogHeader>
            
            {selectedKYC && (
              <div className="space-y-4">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">الاسم القانوني</label>
                    <p className="font-medium">{selectedKYC.full_legal_name}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">تاريخ الميلاد</label>
                    <p>{selectedKYC.date_of_birth}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">الجنسية</label>
                    <p>{selectedKYC.nationality}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">الدولة</label>
                    <p>{selectedKYC.country}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">العنوان</label>
                    <p>{selectedKYC.address}, {selectedKYC.city}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">رقم الهاتف</label>
                    <p>{selectedKYC.phone_number}</p>
                  </div>
                </div>

                {/* Document Info */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">معلومات الوثيقة</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">نوع الوثيقة</label>
                      <p>{selectedKYC.document_type}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">رقم الوثيقة</label>
                      <p>{selectedKYC.document_number}</p>
                    </div>
                  </div>
                </div>

                {/* Document Images */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">صور الوثائق</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">الوجه الأمامي</label>
                      <div className="border rounded-lg p-2 bg-gray-50">
                        <a href={selectedKYC.document_front_url} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-500 hover:underline text-sm">
                          عرض الصورة
                        </a>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">الوجه الخلفي</label>
                      <div className="border rounded-lg p-2 bg-gray-50">
                        <a href={selectedKYC.document_back_url} target="_blank" rel="noopener noreferrer"
                           className="text-blue-500 hover:underline text-sm">
                          عرض الصورة
                        </a>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500">صورة شخصية</label>
                      <div className="border rounded-lg p-2 bg-gray-50">
                        <a href={selectedKYC.selfie_url} target="_blank" rel="noopener noreferrer"
                           className="text-blue-500 hover:underline text-sm">
                          عرض الصورة
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Actions */}
                <div className="border-t pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">الإجراء</label>
                      <Select value={reviewAction} onValueChange={(v: "approve" | "reject") => setReviewAction(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approve">موافقة ✓</SelectItem>
                          <SelectItem value="reject">رفض ✗</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {reviewAction === "approve" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">مستوى الخطر</label>
                        <Select value={riskLevel} onValueChange={setRiskLevel}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">منخفض</SelectItem>
                            <SelectItem value="medium">متوسط</SelectItem>
                            <SelectItem value="high">عالي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  {reviewAction === "reject" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">سبب الرفض</label>
                      <Textarea 
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="اكتب سبب الرفض..."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                onClick={handleReviewKYC}
                className={reviewAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {reviewAction === "approve" ? "موافقة" : "رفض"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payout Process Dialog */}
        <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                معالجة طلب السحب
              </DialogTitle>
            </DialogHeader>
            
            {selectedPayout && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">المستخدم</label>
                    <p className="font-medium">{selectedPayout.user?.username}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">المبلغ الصافي</label>
                    <p className="font-bold text-green-500">{formatCurrency(selectedPayout.net_amount)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">طريقة الدفع</label>
                  <p>{selectedPayout.payment_method?.method_type}</p>
                  <p className="text-sm text-gray-500">
                    {selectedPayout.payment_method?.paypal_email || selectedPayout.payment_method?.iban}
                  </p>
                </div>

                {selectedPayout.status === "processing" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">رقم المعاملة</label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="أدخل رقم المعاملة..."
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
                إلغاء
              </Button>
              {selectedPayout?.status === "pending" && (
                <>
                  <Button 
                    variant="destructive"
                    onClick={() => handleProcessPayout("reject")}
                  >
                    رفض
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleProcessPayout("approve")}
                  >
                    بدء المعالجة
                  </Button>
                </>
              )}
              {selectedPayout?.status === "processing" && (
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleProcessPayout("complete")}
                >
                  تأكيد الدفع
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

