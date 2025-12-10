import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Search, 
  RefreshCw,
  Download,
  Filter,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  CheckCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const logCategories = [
  { value: "all", label: "All Categories" },
  { value: "click_event", label: "Click Events" },
  { value: "conversion_event", label: "Conversion Events" },
  { value: "postback_event", label: "Postback Events" },
  { value: "auth_event", label: "Auth Events" },
  { value: "fraud_detection", label: "Fraud Detection" },
  { value: "webhook_event", label: "Webhook Events" },
  { value: "geo_rule_event", label: "Geo Rules" },
  { value: "system_event", label: "System Events" },
];

const logLevels = [
  { value: "all", label: "All Levels" },
  { value: "debug", label: "Debug" },
  { value: "info", label: "Info" },
  { value: "warn", label: "Warning" },
  { value: "error", label: "Error" },
];

// Sample logs - will be replaced with real data when system generates logs
const sampleLogs = [
  { id: "1", timestamp: new Date().toLocaleString(), level: "info", category: "system_event", message: "System started successfully", metadata: { version: "1.0.0" } },
];

export default function LogsViewer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const logs = sampleLogs;

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.metadata).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    const matchesLevel = levelFilter === "all" || log.level === levelFilter;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
    toast.success("Logs refreshed");
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warn": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "info": return <Info className="h-4 w-4 text-blue-500" />;
      case "debug": return <Bug className="h-4 w-4 text-gray-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "error": return <Badge variant="destructive">ERROR</Badge>;
      case "warn": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">WARN</Badge>;
      case "info": return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">INFO</Badge>;
      case "debug": return <Badge variant="outline">DEBUG</Badge>;
      default: return <Badge variant="outline">{level.toUpperCase()}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      click_event: "bg-purple-500/10 text-purple-500",
      conversion_event: "bg-green-500/10 text-green-500",
      postback_event: "bg-blue-500/10 text-blue-500",
      auth_event: "bg-cyan-500/10 text-cyan-500",
      fraud_detection: "bg-red-500/10 text-red-500",
      webhook_event: "bg-orange-500/10 text-orange-500",
      geo_rule_event: "bg-pink-500/10 text-pink-500",
      system_event: "bg-gray-500/10 text-gray-500",
    };
    return <Badge className={colors[category] || ""}>{category.replace(/_/g, ' ')}</Badge>;
  };

  const stats = {
    total: logs.length,
    errors: logs.filter((l: any) => l.level === 'error').length,
    warnings: logs.filter((l: any) => l.level === 'warn').length,
    info: logs.filter((l: any) => l.level === 'info').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Logs Viewer</h1>
            <p className="text-muted-foreground mt-1">
              Real-time system logs and events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={isLive ? "default" : "outline"} 
              size="sm"
              onClick={() => setIsLive(!isLive)}
            >
              <span className={`h-2 w-2 rounded-full mr-2 ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              {isLive ? 'Live' : 'Paused'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Logs</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Errors</p>
                  <p className="text-2xl font-bold text-red-500">{stats.errors}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.warnings}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Info</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.info}</p>
                </div>
                <Info className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {logCategories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {logLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <CardTitle>Log Entries</CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} of {logs.length} entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-3 rounded-lg border ${
                      log.level === 'error' ? 'border-red-500/20 bg-red-500/5' :
                      log.level === 'warn' ? 'border-yellow-500/20 bg-yellow-500/5' :
                      'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getLevelIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{log.timestamp}</span>
                          {getLevelBadge(log.level)}
                          {getCategoryBadge(log.category)}
                        </div>
                        <p className="text-sm font-medium">{log.message}</p>
                        <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

