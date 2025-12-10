import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CreateBadgeDialog } from "@/components/CreateBadgeDialog";
import { Trash2, Award, RefreshCw, MousePointerClick, TrendingUp, DollarSign, Star } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const criteriaLabels: Record<string, { label: string; icon: any; color: string }> = {
  clicks: { label: "Clicks", icon: MousePointerClick, color: "text-blue-500" },
  conversions: { label: "Conversions", icon: TrendingUp, color: "text-green-500" },
  earnings: { label: "Earnings", icon: DollarSign, color: "text-yellow-500" },
  points: { label: "Points", icon: Star, color: "text-purple-500" },
};

export default function Badges() {
  const { data: badges, isLoading, refetch } = trpc.badges.list.useQuery();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const utils = trpc.useUtils();
  const deleteMutation = trpc.badges.delete.useMutation({
    onSuccess: () => {
      toast.success("Badge deleted successfully");
      utils.badges.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete badge: ${error.message}`);
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().finally(() => {
      setIsRefreshing(false);
      toast.success("Data refreshed!");
    });
  };

  const getCriteriaInfo = (criteria: string) => {
    return criteriaLabels[criteria] || { label: criteria, icon: Award, color: "text-gray-500" };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Badges</h1>
            <p className="text-muted-foreground mt-1">
              <span className="text-green-500">✓ Auto-Award System Active</span> - Badges are earned automatically
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <CreateBadgeDialog />
          </div>
        </div>

        {/* How it works */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-500">How Badges Work</p>
                <p className="text-sm text-muted-foreground">
                  Create badges with criteria (clicks, conversions, earnings, points) and required values.
                  Users automatically earn badges when they meet the criteria. Points are awarded as bonus!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Achievement Badges</CardTitle>
            <CardDescription>Define badges and their earning criteria</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : badges && badges.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Badge</TableHead>
                    <TableHead>Criteria</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Points Reward</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {badges.map((badge: any) => {
                    const criteriaInfo = getCriteriaInfo(badge.criteria);
                    const CriteriaIcon = criteriaInfo.icon;
                    return (
                      <TableRow key={badge.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {badge.iconUrl ? (
                              <img src={badge.iconUrl} alt={badge.name} className="w-10 h-10 rounded" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                                <Award className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{badge.name}</p>
                              <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {badge.description || 'No description'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={criteriaInfo.color}>
                            <CriteriaIcon className="w-3 h-3 mr-1" />
                            {criteriaInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {badge.criteria === 'earnings' ? `$${badge.requiredValue}` : badge.requiredValue?.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-purple-500/10 text-purple-500">
                            +{badge.pointsReward} pts
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(badge.id, badge.name)}
                            disabled={deleteMutation.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No badges found</p>
                <p className="text-sm">Create your first badge to start the gamification system!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
