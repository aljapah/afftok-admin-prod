import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Globe, Languages, Upload, Image, Loader2, MapPin, Ban } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// قائمة الدول المتاحة
const AVAILABLE_COUNTRIES = [
  { code: 'SA', en: 'Saudi Arabia', ar: 'السعودية' },
  { code: 'AE', en: 'UAE', ar: 'الإمارات' },
  { code: 'KW', en: 'Kuwait', ar: 'الكويت' },
  { code: 'BH', en: 'Bahrain', ar: 'البحرين' },
  { code: 'QA', en: 'Qatar', ar: 'قطر' },
  { code: 'OM', en: 'Oman', ar: 'عمان' },
  { code: 'EG', en: 'Egypt', ar: 'مصر' },
  { code: 'JO', en: 'Jordan', ar: 'الأردن' },
  { code: 'LB', en: 'Lebanon', ar: 'لبنان' },
  { code: 'IQ', en: 'Iraq', ar: 'العراق' },
  { code: 'MA', en: 'Morocco', ar: 'المغرب' },
  { code: 'DZ', en: 'Algeria', ar: 'الجزائر' },
  { code: 'TN', en: 'Tunisia', ar: 'تونس' },
  { code: 'US', en: 'United States', ar: 'أمريكا' },
  { code: 'GB', en: 'United Kingdom', ar: 'بريطانيا' },
  { code: 'DE', en: 'Germany', ar: 'ألمانيا' },
  { code: 'FR', en: 'France', ar: 'فرنسا' },
  { code: 'TR', en: 'Turkey', ar: 'تركيا' },
];

// ImgBB API for image uploads
const IMGBB_API_KEY = '6d207e02198a847aa98d0a2a901485a5';

async function uploadToImgBB(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', file);

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      return data.data.url;
    }
    return null;
  } catch (error) {
    console.error('ImgBB upload error:', error);
    return null;
  }
}

export function CreateOfferDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    terms: "", // الشروط العامة بالإنجليزية
    titleAr: "",
    descriptionAr: "",
    termsAr: "",
    imageUrl: "",
    logoUrl: "",
    destinationUrl: "",
    category: "",
    payout: 0,
    commission: 0,
    payoutType: "cpa",
    targetCountries: [] as string[], // الدول المستهدفة
    blockedCountries: [] as string[], // الدول الممنوعة
    additionalNotes: "", // ملاحظات إضافية
  });
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const createMutation = trpc.offers.create.useMutation({
    onSuccess: () => {
      toast.success("Offer created successfully");
      utils.offers.list.invalidate();
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        terms: "",
        titleAr: "",
        descriptionAr: "",
        termsAr: "",
        imageUrl: "",
        logoUrl: "",
        destinationUrl: "",
        category: "",
        payout: 0,
        commission: 0,
        payoutType: "cpa",
        targetCountries: [],
        blockedCountries: [],
        additionalNotes: "",
      });
    },
    onError: (error) => {
      toast.error(`Failed to create offer: ${error.message}`);
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    if (type === 'image') {
      setUploadingImage(true);
    } else {
      setUploadingLogo(true);
    }

    try {
      const url = await uploadToImgBB(file);
      if (url) {
        if (type === 'image') {
          setFormData({ ...formData, imageUrl: url });
        } else {
          setFormData({ ...formData, logoUrl: url });
        }
        toast.success(`${type === 'image' ? 'Image' : 'Logo'} uploaded successfully`);
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      toast.error('Upload error');
    } finally {
      if (type === 'image') {
        setUploadingImage(false);
      } else {
        setUploadingLogo(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Offer</DialogTitle>
            <DialogDescription>
              Add a new offer to the platform. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="english" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="english" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                English
              </TabsTrigger>
              <TabsTrigger value="arabic" className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                العربية
              </TabsTrigger>
            </TabsList>
            
            {/* English Tab */}
            <TabsContent value="english" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter offer title in English"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter offer description in English"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Enter general terms and conditions in English"
                  rows={4}
                />
              </div>
            </TabsContent>
            
            {/* Arabic Tab */}
            <TabsContent value="arabic" className="space-y-4 mt-4" dir="rtl">
              <div className="grid gap-2">
                <Label htmlFor="titleAr" className="text-right">العنوان بالعربي</Label>
                <Input
                  id="titleAr"
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  placeholder="أدخل عنوان العرض بالعربي"
                  className="text-right"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descriptionAr" className="text-right">الوصف بالعربي</Label>
                <Textarea
                  id="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  placeholder="أدخل وصف العرض بالعربي"
                  className="text-right"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="termsAr" className="text-right">الشروط والأحكام</Label>
                <Textarea
                  id="termsAr"
                  value={formData.termsAr}
                  onChange={(e) => setFormData({ ...formData, termsAr: e.target.value })}
                  placeholder="أدخل شروط وأحكام العرض بالعربي"
                  className="text-right"
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Images Section */}
          <div className="grid gap-4 py-4 border-t mt-4 pt-4">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Image className="h-4 w-4" />
              Images
            </h4>
            
            {/* Offer Image */}
            <div className="grid gap-2">
              <Label>Offer Image</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.png or upload"
                  className="flex-1"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={(e) => handleImageUpload(e, 'image')}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {formData.imageUrl && (
                <img src={formData.imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded border" />
              )}
            </div>
            
            {/* Logo */}
            <div className="grid gap-2">
              <Label>Logo</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png or upload"
                  className="flex-1"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={logoInputRef}
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {formData.logoUrl && (
                <img src={formData.logoUrl} alt="Logo Preview" className="h-16 w-16 object-cover rounded border" />
              )}
            </div>
          </div>
          
          {/* Common Fields */}
          <div className="grid gap-4 py-4 border-t mt-4 pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Settings</h4>
            
            <div className="grid gap-2">
              <Label htmlFor="destinationUrl">Destination URL *</Label>
              <Input
                id="destinationUrl"
                type="url"
                value={formData.destinationUrl}
                onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                placeholder="https://example.com/offer"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">Finance / مالية</SelectItem>
                    <SelectItem value="ecommerce">E-Commerce / تجارة إلكترونية</SelectItem>
                    <SelectItem value="gaming">Gaming / ألعاب</SelectItem>
                    <SelectItem value="health">Health / صحة</SelectItem>
                    <SelectItem value="education">Education / تعليم</SelectItem>
                    <SelectItem value="technology">Technology / تقنية</SelectItem>
                    <SelectItem value="travel">Travel / سفر</SelectItem>
                    <SelectItem value="food">Food & Delivery / طعام وتوصيل</SelectItem>
                    <SelectItem value="entertainment">Entertainment / ترفيه</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="payoutType">Payout Type *</Label>
                <Select value={formData.payoutType} onValueChange={(value) => setFormData({ ...formData, payoutType: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpa">CPA (Cost Per Action)</SelectItem>
                    <SelectItem value="cpl">CPL (Cost Per Lead)</SelectItem>
                    <SelectItem value="cps">CPS (Cost Per Sale)</SelectItem>
                    <SelectItem value="cpi">CPI (Cost Per Install)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="payout">Payout (cents) *</Label>
                <Input
                  id="payout"
                  type="number"
                  min="0"
                  value={formData.payout}
                  onChange={(e) => setFormData({ ...formData, payout: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="commission">Commission (cents) *</Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Geo Targeting Section */}
          <div className="grid gap-4 py-4 border-t mt-4 pt-4">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Geo Targeting / استهداف الدول
            </h4>
            
            {/* Target Countries */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-500" />
                Target Countries (optional - default: all)
              </Label>
              <Select
                onValueChange={(value) => {
                  if (!formData.targetCountries.includes(value)) {
                    setFormData({ ...formData, targetCountries: [...formData.targetCountries, value] });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select countries to target" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_COUNTRIES.filter(c => !formData.targetCountries.includes(c.code)).map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.en} / {country.ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.targetCountries.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.targetCountries.map((code) => {
                    const country = AVAILABLE_COUNTRIES.find(c => c.code === code);
                    return (
                      <Badge key={code} variant="secondary" className="bg-green-500/20 text-green-400">
                        {country?.en || code}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, targetCountries: formData.targetCountries.filter(c => c !== code) })}
                          className="ml-1 hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Blocked Countries */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-red-500" />
                Blocked Countries (optional)
              </Label>
              <Select
                onValueChange={(value) => {
                  if (!formData.blockedCountries.includes(value)) {
                    setFormData({ ...formData, blockedCountries: [...formData.blockedCountries, value] });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select countries to block" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_COUNTRIES.filter(c => !formData.blockedCountries.includes(c.code)).map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.en} / {country.ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.blockedCountries.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.blockedCountries.map((code) => {
                    const country = AVAILABLE_COUNTRIES.find(c => c.code === code);
                    return (
                      <Badge key={code} variant="secondary" className="bg-red-500/20 text-red-400">
                        {country?.en || code}
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, blockedCountries: formData.blockedCountries.filter(c => c !== code) })}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Additional Notes Section */}
          <div className="grid gap-4 py-4 border-t mt-4 pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Additional Notes / ملاحظات إضافية</h4>
            
            <div className="grid gap-2">
              <Textarea
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                placeholder="Any additional notes for promoters (optional)"
                rows={3}
              />
            </div>
          </div>
          
          {/* Legal Disclaimer */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mt-4">
            <p className="text-sm text-orange-400">
              ⚠️ The platform is not a party to the financial agreement between advertiser and promoter. Its role is limited to providing tracking and statistics only.
            </p>
            <p className="text-sm text-orange-400 mt-2" dir="rtl">
              ⚠️ المنصة ليست طرفاً في الاتفاق المالي بين المعلن والمروج، ودورها يقتصر على توفير التتبع والإحصائيات فقط.
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
