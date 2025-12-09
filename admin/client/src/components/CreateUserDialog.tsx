import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, User, Building2 } from "lucide-react";
import { toast } from "sonner";

// قائمة الدول
const countries = [
  { code: "SA", name: "Saudi Arabia", nameAr: "السعودية" },
  { code: "AE", name: "UAE", nameAr: "الإمارات" },
  { code: "EG", name: "Egypt", nameAr: "مصر" },
  { code: "KW", name: "Kuwait", nameAr: "الكويت" },
  { code: "BH", name: "Bahrain", nameAr: "البحرين" },
  { code: "OM", name: "Oman", nameAr: "عُمان" },
  { code: "QA", name: "Qatar", nameAr: "قطر" },
  { code: "MA", name: "Morocco", nameAr: "المغرب" },
  { code: "DZ", name: "Algeria", nameAr: "الجزائر" },
  { code: "TN", name: "Tunisia", nameAr: "تونس" },
  { code: "JO", name: "Jordan", nameAr: "الأردن" },
  { code: "LB", name: "Lebanon", nameAr: "لبنان" },
  { code: "IQ", name: "Iraq", nameAr: "العراق" },
  { code: "IN", name: "India", nameAr: "الهند" },
  { code: "PK", name: "Pakistan", nameAr: "باكستان" },
];

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [userType, setUserType] = useState<"promoter" | "advertiser" | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: "user" as "user" | "admin" | "promoter" | "advertiser",
    country: "",
    phone: "",
    paymentMethod: "",
    // حقول المعلن
    companyName: "",
    websiteUrl: "",
    businessType: "",
  });

  const utils = trpc.useUtils();
  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      utils.users.list.invalidate();
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create user: ${error.message}`);
    },
  });

  const resetForm = () => {
    setUserType(null);
    setFormData({
      username: "",
      email: "",
      password: "",
      fullName: "",
      role: "user",
      country: "",
      phone: "",
      paymentMethod: "",
      companyName: "",
      websiteUrl: "",
      businessType: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      role: userType === "advertiser" ? "advertiser" : "promoter",
    };
    createMutation.mutate(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          إضافة مستخدم
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {!userType ? (
          // خطوة اختيار نوع المستخدم
          <>
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
              <DialogDescription>
                اختر نوع المستخدم الذي تريد إضافته
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-6">
              <button
                type="button"
                onClick={() => setUserType("promoter")}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="p-4 rounded-full bg-green-500/20">
                  <User className="h-8 w-8 text-green-500" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold">مروج</h3>
                  <p className="text-sm text-muted-foreground">Promoter</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setUserType("advertiser")}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="p-4 rounded-full bg-blue-500/20">
                  <Building2 className="h-8 w-8 text-blue-500" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold">معلن</h3>
                  <p className="text-sm text-muted-foreground">Advertiser</p>
                </div>
              </button>
            </div>
          </>
        ) : (
          // نموذج إدخال البيانات
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {userType === "promoter" ? "إضافة مروج جديد" : "إضافة معلن جديد"}
              </DialogTitle>
              <DialogDescription>
                {userType === "promoter" 
                  ? "أدخل بيانات المروج الجديد"
                  : "أدخل بيانات المعلن الجديد"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* البيانات الأساسية */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">اسم المستخدم *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    minLength={3}
                    placeholder="username"
                    dir="ltr"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fullName">الاسم الكامل *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    placeholder="الاسم الكامل"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="email@example.com"
                  dir="ltr"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">كلمة المرور *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  placeholder="6 أحرف على الأقل"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="country">البلد *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر البلد" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.nameAr} ({country.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+966..."
                    dir="ltr"
                  />
                </div>
              </div>

              {/* حقول المروج */}
              {userType === "promoter" && (
                <div className="grid gap-2">
                  <Label htmlFor="paymentMethod">طريقة الدفع المفضلة</Label>
                  <Textarea
                    id="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    placeholder="مثال: PayPal: email@example.com أو STC Pay: 05xxxxxxxx"
                    rows={2}
                  />
                </div>
              )}

              {/* حقول المعلن */}
              {userType === "advertiser" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="companyName">اسم الشركة / المتجر *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                      placeholder="اسم الشركة أو المتجر"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="websiteUrl">رابط الموقع / المتجر</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="https://..."
                      dir="ltr"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="businessType">نوع النشاط</Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع النشاط" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ecommerce">تجارة إلكترونية</SelectItem>
                        <SelectItem value="services">خدمات</SelectItem>
                        <SelectItem value="app">تطبيق</SelectItem>
                        <SelectItem value="saas">برمجيات SaaS</SelectItem>
                        <SelectItem value="education">تعليم / دورات</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setUserType(null)}>
                رجوع
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
