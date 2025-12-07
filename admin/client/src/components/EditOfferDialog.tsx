import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Globe, Languages, Upload, Image, Loader2 } from "lucide-react";

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

interface EditOfferDialogProps {
  offer: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditOfferDialog({ offer, open, onOpenChange }: EditOfferDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [termsAr, setTermsAr] = useState("");
  const [category, setCategory] = useState("");
  const [payout, setPayout] = useState("");
  const [commission, setCommission] = useState("");
  const [payoutType, setPayoutType] = useState("cpa");
  const [targetUrl, setTargetUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "pending">("active");
  
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const updateOffer = trpc.offers.update.useMutation({
    onSuccess: () => {
      toast.success("Offer updated successfully");
      utils.offers.list.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update offer");
    },
  });

  useEffect(() => {
    if (offer) {
      setTitle(offer.title || "");
      setDescription(offer.description || "");
      setTitleAr(offer.titleAr || "");
      setDescriptionAr(offer.descriptionAr || "");
      setTermsAr(offer.termsAr || "");
      setCategory(offer.category || "");
      setPayout(offer.payout?.toString() || "");
      setCommission(offer.commission?.toString() || "");
      setPayoutType(offer.payoutType || "cpa");
      setTargetUrl(offer.targetUrl || offer.destinationUrl || "");
      setImageUrl(offer.imageUrl || "");
      setLogoUrl(offer.logoUrl || "");
      setStatus(offer.status || "active");
    }
  }, [offer]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

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
          setImageUrl(url);
        } else {
          setLogoUrl(url);
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
    
    if (!title || !description || !category || !payout || !targetUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payoutNum = parseInt(payout);
    if (isNaN(payoutNum) || payoutNum < 0 || payoutNum > 1000000) {
      toast.error("Payout must be between 0 and 1,000,000 cents");
      return;
    }

    updateOffer.mutate({
      id: offer.id,
      title,
      description,
      titleAr: titleAr || undefined,
      descriptionAr: descriptionAr || undefined,
      termsAr: termsAr || undefined,
      category,
      payout: payoutNum,
      commission: parseInt(commission) || 0,
      payoutType,
      destinationUrl: targetUrl,
      imageUrl: imageUrl || undefined,
      logoUrl: logoUrl || undefined,
      status: status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Offer</DialogTitle>
          <DialogDescription>
            Update offer details. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Get 50% off on Premium Subscription"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the offer..."
                  rows={4}
                  required
                />
              </div>
            </TabsContent>
            
            {/* Arabic Tab */}
            <TabsContent value="arabic" className="space-y-4 mt-4" dir="rtl">
              <div className="grid gap-2">
                <Label htmlFor="titleAr" className="text-right">العنوان بالعربي</Label>
                <Input
                  id="titleAr"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="أدخل عنوان العرض بالعربي"
                  className="text-right"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descriptionAr" className="text-right">الوصف بالعربي</Label>
                <Textarea
                  id="descriptionAr"
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  placeholder="أدخل وصف العرض بالعربي"
                  className="text-right"
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="termsAr" className="text-right">الشروط والأحكام</Label>
                <Textarea
                  id="termsAr"
                  value={termsAr}
                  onChange={(e) => setTermsAr(e.target.value)}
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
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
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
              {imageUrl && (
                <img src={imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded border" />
              )}
            </div>
            
            {/* Logo */}
            <div className="grid gap-2">
              <Label>Logo</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
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
              {logoUrl && (
                <img src={logoUrl} alt="Logo Preview" className="h-16 w-16 object-cover rounded border" />
              )}
            </div>
          </div>
          
          {/* Common Fields */}
          <div className="grid gap-4 py-4 border-t mt-4 pt-4">
            <h4 className="text-sm font-medium text-muted-foreground">Settings</h4>

            <div className="grid gap-2">
              <Label htmlFor="targetUrl">Destination URL *</Label>
              <Input
                id="targetUrl"
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/offer"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
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
                <Select value={payoutType} onValueChange={setPayoutType} required>
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
                  value={payout}
                  onChange={(e) => setPayout(e.target.value)}
                  placeholder="e.g., 500 ($5.00)"
                  min="0"
                  max="1000000"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="commission">Commission (cents)</Label>
                <Input
                  id="commission"
                  type="number"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder="e.g., 100"
                  min="0"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as "active" | "inactive" | "pending")} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateOffer.isPending}>
              {updateOffer.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
