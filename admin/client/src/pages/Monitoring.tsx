import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Server, 
  Database, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  Wifi, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  Users,
  Package,
  Copy
} from "lucide-react";
import { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Monitoring() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // API Queries - Real Data
  const { data: stats, refetch: refetchStats } = trpc.monitoring.stats.useQuery();
  const { data: health, refetch: refetchHealth } = trpc.monitoring.health.useQuery();
  const { data: clicksData, refetch: refetchClicks } = trpc.monitoring.clicksTimeSeries.useQuery();
  const { data: latencyData, refetch: refetchLatency } = trpc.monitoring.latencyTimeSeries.useQuery();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      refetchStats();
      refetchHealth();
      refetchClicks();
      refetchLatency();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchStats, refetchHealth, refetchClicks, refetchLatency]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([refetchStats(), refetchHealth(), refetchClicks(), refetchLatency()]).then(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
      toast.success("Data refreshed!");
    });
  };

  // Use real data or empty array
  const timeSeriesClicksData = clicksData || [];
  const timeSeriesLatencyData = latencyData || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "critical": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const dbStatus = health?.database?.status || 'unknown';
  const backendStatus = health?.backend?.status || 'unknown';
  const systemStatus = dbStatus === 'healthy' && backendStatus === 'healthy' ? 'healthy' : 
                       dbStatus === 'critical' || backendStatus === 'critical' ? 'critical' : 'warning';
  const dbLatency = health?.database?.latency || 0;

  // Copy service error details
  const copyServiceError = (service: any) => {
    const errorDetails = `
🚨 Service Issue Report
========================
Service: ${service.name}
Status: ${service.status}
Latency: ${service.latency}ms
Uptime: ${service.uptime}%
Time: ${new Date().toLocaleString()}
========================
Please check and fix this issue.
    `.trim();
    
    navigator.clipboard.writeText(errorDetails);
    toast.success("Error details copied!");
  };

  // Real services from API
  const services = [
    { 
      name: health?.database?.name || "PostgreSQL (Neon)", 
      status: health?.database?.status || 'unknown', 
      latency: health?.database?.latency || 0, 
      uptime: health?.database?.uptime || 0,
      real: true
    },
    { 
      name: health?.backend?.name || "Backend API", 
      status: health?.backend?.status || 'unknown', 
      latency: health?.backend?.latency || 0, 
      uptime: health?.backend?.uptime || 0,
      real: true
    },
    { 
      name: health?.redis?.name || "Redis Cache", 
      status: health?.redis?.status || 'not_configured', 
      latency: health?.redis?.latency || 0, 
      uptime: health?.redis?.uptime || 0,
      real: true
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Monitoring</h1>
            <p className="text-muted-foreground mt-1">
              Real-time system health and performance metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Status Banner */}
        <Card className={`border-l-4 ${systemStatus === 'healthy' ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(systemStatus)}
                <div>
                  <h3 className="font-semibold">System Status: {systemStatus.toUpperCase()}</h3>
                  <p className="text-sm text-muted-foreground">
                    DB Latency: {dbLatency}ms | Environment: production
                  </p>
                </div>
              </div>
              <Badge variant={systemStatus === 'healthy' ? 'default' : 'destructive'}>
                {systemStatus === 'healthy' ? 'All Systems Operational' : 'Issues Detected'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Real Stats from Database */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <Zap className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.totalClicks || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last hour: {stats?.recentClicks || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.totalConversions || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last hour: {stats?.recentConversions || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.totalUsers || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
              <Package className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOffers || 0}</div>
              <p className="text-xs text-green-500">Active: {stats?.activeOffers || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">DB Latency</CardTitle>
              <Database className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dbLatency}ms</div>
              <p className={`text-xs ${dbLatency < 50 ? 'text-green-500' : 'text-yellow-500'}`}>
                {dbLatency < 50 ? 'Excellent' : 'Good'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts - Real Data */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Click Traffic (Last 30 min)</CardTitle>
              <p className="text-xs text-green-500">✓ Real Data from Database</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={timeSeriesClicksData}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="time" stroke="#888" fontSize={10} />
                  <YAxis stroke="#888" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                  <Area type="monotone" dataKey="clicks" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorClicks)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>DB Latency (Last 30 min)</CardTitle>
              <p className="text-xs text-green-500">✓ Real Latency Measurement</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={timeSeriesLatencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="time" stroke="#888" fontSize={10} />
                  <YAxis stroke="#888" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  />
                  <Line type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Services Status - All Real Data */}
        <Card>
          <CardHeader>
            <CardTitle>Services Health</CardTitle>
            <CardDescription>
              <span className="text-green-500">✓ All Real-time Data</span> - Status of all system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service: any) => (
                <div 
                  key={service.name}
                  className={`flex items-center justify-between p-4 rounded-lg border bg-card ${
                    service.status === 'critical' ? 'border-red-500/50' : 
                    service.status === 'warning' ? 'border-yellow-500/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.status === 'not_configured' ? 'Not Configured' : 
                         `Latency: ${service.latency}ms | Uptime: ${service.uptime}%`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(service.status === 'critical' || service.status === 'warning') && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyServiceError(service)}
                        className="h-8 px-2"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                    )}
                    <Badge 
                      variant={service.status === 'healthy' ? 'outline' : 'destructive'}
                      className={
                        service.status === 'healthy' ? 'bg-green-500/10 text-green-500' :
                        service.status === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                        service.status === 'not_configured' ? 'bg-gray-500/10 text-gray-500' :
                        'bg-red-500/10 text-red-500'
                      }
                    >
                      {service.status === 'not_configured' ? 'N/A' : service.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* External Monitoring Links */}
        <Card>
          <CardHeader>
            <CardTitle>External Monitoring</CardTitle>
            <CardDescription>Links to external monitoring services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <a 
                href="https://railway.app/project/08a31baf-7ea3-4f82-b78e-3928e165c61d" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <Server className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">Railway Dashboard</p>
                  <p className="text-xs text-muted-foreground">Server metrics & logs</p>
                </div>
              </a>
              
              <a 
                href="https://afftok.sentry.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Sentry</p>
                  <p className="text-xs text-muted-foreground">Error tracking</p>
                </div>
              </a>
              
              <a 
                href="https://stats.uptimerobot.com/hv6yK9rdZv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <Activity className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">UptimeRobot</p>
                  <p className="text-xs text-muted-foreground">Uptime monitoring</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
