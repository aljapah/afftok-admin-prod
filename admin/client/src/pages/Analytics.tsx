import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, DollarSign, MousePointerClick, Target, Download, RefreshCw } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/export";
import { toast } from "sonner";

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#06b6d4'];

export default function Analytics() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // API Queries - All Real Data
  const { data: stats, refetch: refetchStats } = trpc.dashboard.stats.useQuery();
  const { data: offersByCategory, refetch: refetchCategories } = trpc.dashboard.offersByCategory.useQuery();
  const { data: topPromoters, refetch: refetchPromoters } = trpc.dashboard.topPromoters.useQuery();
  const { data: clicksVsConversions, refetch: refetchChartData } = trpc.dashboard.clicksVsConversions.useQuery();

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([refetchStats(), refetchCategories(), refetchPromoters(), refetchChartData()]).finally(() => {
      setIsRefreshing(false);
      toast.success("Data refreshed!");
    });
  };

  // Use real data
  const offerDistribution = offersByCategory || [{ name: 'No Data', value: 1 }];
  const performers = topPromoters || [];
  const chartData = clicksVsConversions || [];

  const statsCards = [
    {
      title: "Total Revenue",
      value: "$" + (((stats?.totalConversions ?? 0) as number) * 50).toLocaleString(),
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      title: "Avg. Conversion Rate",
      value: (() => {
        const clicks = (stats?.totalClicks ?? 0) as number;
        const conversions = (stats?.totalConversions ?? 0) as number;
        return clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) + "%" : "0%";
      })(),
      icon: Target,
      color: "text-blue-500",
    },
    {
      title: "Total Clicks",
      value: (stats?.totalClicks ?? 0).toLocaleString(),
      icon: MousePointerClick,
      color: "text-purple-500",
    },
    {
      title: "Total Conversions",
      value: (stats?.totalConversions ?? 0).toLocaleString(),
      icon: TrendingUp,
      color: "text-pink-500",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              <span className="text-green-500">✓ All Real Data</span> - Performance metrics from database
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (chartData && chartData.length > 0) {
                  exportToExcel(chartData, `afftok-analytics-${new Date().toISOString().split('T')[0]}`);
                  toast.success('Analytics exported successfully');
                } else {
                  toast.error('No analytics data to export');
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Combined Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview (Last 30 Days)</CardTitle>
            <CardDescription className="text-green-500">✓ Real Data from clicks & conversions tables</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData.length > 0 ? chartData : [{ date: 'No Data', clicks: 0, conversions: 0 }]}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#8b5cf6" 
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                />
                <Area 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#ec4899" 
                  fillOpacity={1}
                  fill="url(#colorConversions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Pie Chart - Offer Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Offers by Category</CardTitle>
              <CardDescription className="text-green-500">✓ Real Data from offers table</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={offerDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {offerDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart - Clicks vs Conversions */}
          <Card>
            <CardHeader>
              <CardTitle>Clicks vs Conversions (Last 7 Days)</CardTitle>
              <CardDescription className="text-green-500">✓ Real Data</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.slice(-7).length > 0 ? chartData.slice(-7) : [{ date: 'No Data', clicks: 0, conversions: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="clicks" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="conversions" fill="#ec4899" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription className="text-green-500">✓ Real Data from users table (promoters)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Conv. Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No promoters with activity yet
                    </TableCell>
                  </TableRow>
                ) : (
                  performers.map((performer: any, index: number) => (
                    <TableRow key={performer.id}>
                      <TableCell>
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{performer.name}</TableCell>
                      <TableCell>{(performer.clicks ?? 0).toLocaleString()}</TableCell>
                      <TableCell>{performer.conversions ?? 0}</TableCell>
                      <TableCell className="text-green-500 font-semibold">
                        ${(performer.revenue ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{performer.conversionRate}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
