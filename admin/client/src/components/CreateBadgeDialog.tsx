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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const criteriaOptions = [
  { value: "clicks", label: "النقرات (Clicks)", description: "عدد النقرات المطلوبة" },
  { value: "conversions", label: "التحويلات (Conversions)", description: "عدد التحويلات المطلوبة" },
  { value: "earnings", label: "الأرباح (Earnings)", description: "المبلغ المطلوب بالريال" },
  { value: "points", label: "النقاط (Points)", description: "عدد النقاط المطلوبة" },
];

export function CreateBadgeDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    iconUrl: "",
    criteria: "clicks",
    requiredValue: 10,
    pointsReward: 10,
  });

  const utils = trpc.useUtils();
  const createMutation = trpc.badges.create.useMutation({
    onSuccess: () => {
      toast.success("Badge created successfully!");
      utils.badges.list.invalidate();
      setOpen(false);
      setFormData({ name: "", description: "", iconUrl: "", criteria: "clicks", requiredValue: 10, pointsReward: 10 });
    },
    onError: (error) => {
      toast.error(`Failed to create badge: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const selectedCriteria = criteriaOptions.find(c => c.value === formData.criteria);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Badge
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Badge</DialogTitle>
            <DialogDescription>
              Add a new achievement badge. Users will earn it automatically when they meet the criteria.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Badge Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Click Master"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this badge represents..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Criteria *</Label>
                <Select 
                  value={formData.criteria} 
                  onValueChange={(v) => setFormData({ ...formData, criteria: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {criteriaOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCriteria && (
                  <p className="text-xs text-muted-foreground">{selectedCriteria.description}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="requiredValue">Required Value *</Label>
                <Input
                  id="requiredValue"
                  type="number"
                  min="1"
                  value={formData.requiredValue}
                  onChange={(e) => setFormData({ ...formData, requiredValue: parseInt(e.target.value) || 1 })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.criteria === 'earnings' ? 'Amount in SAR' : 'Count required'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pointsReward">Points Reward *</Label>
                <Input
                  id="pointsReward"
                  type="number"
                  min="0"
                  value={formData.pointsReward}
                  onChange={(e) => setFormData({ ...formData, pointsReward: parseInt(e.target.value) || 0 })}
                  required
                />
                <p className="text-xs text-muted-foreground">Points awarded when earned</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="iconUrl">Icon URL</Label>
                <Input
                  id="iconUrl"
                  type="url"
                  value={formData.iconUrl}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <p className="text-xs text-muted-foreground">
                Users will earn "{formData.name || 'Badge Name'}" when they reach{' '}
                <strong>{formData.requiredValue}</strong> {formData.criteria}.
                They will receive <strong>{formData.pointsReward}</strong> points as reward.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Badge"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
