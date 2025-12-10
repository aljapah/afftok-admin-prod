import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface EditUserDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const countries = [
  { code: "KW", name: "🇰🇼 Kuwait" },
  { code: "SA", name: "🇸🇦 Saudi Arabia" },
  { code: "AE", name: "🇦🇪 UAE" },
  { code: "BH", name: "🇧🇭 Bahrain" },
  { code: "QA", name: "🇶🇦 Qatar" },
  { code: "OM", name: "🇴🇲 Oman" },
  { code: "EG", name: "🇪🇬 Egypt" },
  { code: "JO", name: "🇯🇴 Jordan" },
  { code: "LB", name: "🇱🇧 Lebanon" },
  { code: "IQ", name: "🇮🇶 Iraq" },
  { code: "SY", name: "🇸🇾 Syria" },
  { code: "PS", name: "🇵🇸 Palestine" },
  { code: "YE", name: "🇾🇪 Yemen" },
  { code: "LY", name: "🇱🇾 Libya" },
  { code: "TN", name: "🇹🇳 Tunisia" },
  { code: "DZ", name: "🇩🇿 Algeria" },
  { code: "MA", name: "🇲🇦 Morocco" },
  { code: "SD", name: "🇸🇩 Sudan" },
  { code: "SO", name: "🇸🇴 Somalia" },
  { code: "MR", name: "🇲🇷 Mauritania" },
  { code: "DJ", name: "🇩🇯 Djibouti" },
  { code: "KM", name: "🇰🇲 Comoros" },
  { code: "IN", name: "🇮🇳 India" },
  { code: "PK", name: "🇵🇰 Pakistan" },
  { code: "BD", name: "🇧🇩 Bangladesh" },
  { code: "TR", name: "🇹🇷 Turkey" },
  { code: "IR", name: "🇮🇷 Iran" },
  { code: "US", name: "🇺🇸 USA" },
  { code: "GB", name: "🇬🇧 UK" },
  { code: "DE", name: "🇩🇪 Germany" },
  { code: "FR", name: "🇫🇷 France" },
  { code: "CA", name: "🇨🇦 Canada" },
  { code: "AU", name: "🇦🇺 Australia" },
  { code: "MY", name: "🇲🇾 Malaysia" },
  { code: "ID", name: "🇮🇩 Indonesia" },
  { code: "PH", name: "🇵🇭 Philippines" },
];

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    country: "",
    role: "user" as "user" | "admin" | "advertiser",
    status: "active" as "active" | "suspended",
  });

  const utils = trpc.useUtils();
  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      utils.users.list.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        fullName: user.fullName || "",
        country: user.country || "",
        role: user.role || "user",
        status: user.status || "active",
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email) {
      toast.error("Username and email are required");
      return;
    }

    updateMutation.mutate({
      id: user.id,
      ...formData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                minLength={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "user" | "admin" | "advertiser") => 
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="advertiser">Advertiser</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "suspended") => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
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
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
