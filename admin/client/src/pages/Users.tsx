import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, Eye, Download, Edit, Trash2, Filter, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { exportToCSV } from "@/lib/export";
import { toast } from "sonner";
import TableSkeleton from "@/components/TableSkeleton";
import { CreateUserDialog } from "@/components/CreateUserDialog";
import { EditUserDialog } from "@/components/EditUserDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Users() {
  const { data: users, isLoading } = trpc.users.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [, navigate] = useLocation();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const itemsPerPage = 10;
  
  // Predefined list of countries with flags
  const predefinedCountries = [
    // Arab Countries - الدول العربية
    { code: "KW", name: "🇰🇼 Kuwait - الكويت" },
    { code: "SA", name: "🇸🇦 Saudi Arabia - السعودية" },
    { code: "AE", name: "🇦🇪 UAE - الإمارات" },
    { code: "BH", name: "🇧🇭 Bahrain - البحرين" },
    { code: "QA", name: "🇶🇦 Qatar - قطر" },
    { code: "OM", name: "🇴🇲 Oman - عمان" },
    { code: "EG", name: "🇪🇬 Egypt - مصر" },
    { code: "JO", name: "🇯🇴 Jordan - الأردن" },
    { code: "LB", name: "🇱🇧 Lebanon - لبنان" },
    { code: "IQ", name: "🇮🇶 Iraq - العراق" },
    { code: "SY", name: "🇸🇾 Syria - سوريا" },
    { code: "PS", name: "🇵🇸 Palestine - فلسطين" },
    { code: "YE", name: "🇾🇪 Yemen - اليمن" },
    { code: "LY", name: "🇱🇾 Libya - ليبيا" },
    { code: "TN", name: "🇹🇳 Tunisia - تونس" },
    { code: "DZ", name: "🇩🇿 Algeria - الجزائر" },
    { code: "MA", name: "🇲🇦 Morocco - المغرب" },
    { code: "SD", name: "🇸🇩 Sudan - السودان" },
    { code: "SO", name: "🇸🇴 Somalia - الصومال" },
    { code: "MR", name: "🇲🇷 Mauritania - موريتانيا" },
    { code: "DJ", name: "🇩🇯 Djibouti - جيبوتي" },
    { code: "KM", name: "🇰🇲 Comoros - جزر القمر" },
    // Other Countries - دول أخرى
    { code: "IN", name: "🇮🇳 India - الهند" },
    { code: "PK", name: "🇵🇰 Pakistan - باكستان" },
    { code: "BD", name: "🇧🇩 Bangladesh - بنغلاديش" },
    { code: "TR", name: "🇹🇷 Turkey - تركيا" },
    { code: "IR", name: "🇮🇷 Iran - إيران" },
    { code: "US", name: "🇺🇸 USA - أمريكا" },
    { code: "GB", name: "🇬🇧 UK - بريطانيا" },
    { code: "DE", name: "🇩🇪 Germany - ألمانيا" },
    { code: "FR", name: "🇫🇷 France - فرنسا" },
    { code: "CA", name: "🇨🇦 Canada - كندا" },
    { code: "AU", name: "🇦🇺 Australia - أستراليا" },
    { code: "MY", name: "🇲🇾 Malaysia - ماليزيا" },
    { code: "ID", name: "🇮🇩 Indonesia - إندونيسيا" },
    { code: "PH", name: "🇵🇭 Philippines - الفلبين" },
    { code: "CN", name: "🇨🇳 China - الصين" },
    { code: "JP", name: "🇯🇵 Japan - اليابان" },
    { code: "KR", name: "🇰🇷 South Korea - كوريا" },
    { code: "RU", name: "🇷🇺 Russia - روسيا" },
    { code: "BR", name: "🇧🇷 Brazil - البرازيل" },
    { code: "MX", name: "🇲🇽 Mexico - المكسيك" },
  ];
  
  // Get unique countries from users (if any have country set)
  const userCountries = [...new Set(users?.map(u => u.country).filter(Boolean))] as string[];
  
  // Check if any filter is active
  const hasActiveFilters = roleFilter !== "all" || statusFilter !== "all" || levelFilter !== "all" || countryFilter !== "all" || searchQuery !== "" || nameFilter !== "";
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setNameFilter("");
    setCountryFilter("all");
    setRoleFilter("all");
    setStatusFilter("all");
    setLevelFilter("all");
    setCurrentPage(1);
  };
  
  const utils = trpc.useUtils();
  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      utils.users.list.invalidate();
      setDeletingUserId(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });
  

  const filteredUsers = users?.filter((user) => {
    // Text search (general)
    const matchesSearch = searchQuery === "" || 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Name filter (specific)
    const matchesName = nameFilter === "" ||
      user.fullName?.toLowerCase().includes(nameFilter.toLowerCase()) ||
      user.username?.toLowerCase().includes(nameFilter.toLowerCase());
    
    // Country filter
    const matchesCountry = countryFilter === "all" || user.country === countryFilter;
    
    // Role filter
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    // Status filter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    // Level filter
    const matchesLevel = levelFilter === "all" || String(user.level) === levelFilter;
    
    return matchesSearch && matchesName && matchesCountry && matchesRole && matchesStatus && matchesLevel;
  });

  const totalPages = Math.ceil((filteredUsers?.length || 0) / itemsPerPage);
  const paginatedUsers = filteredUsers?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = (userId: string) => {
    deleteMutation.mutate({ id: userId });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Users</h1>
          <div className="flex items-center gap-4">
            <CreateUserDialog />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (users && users.length > 0) {
                  exportToCSV(users, `afftok-users-${new Date().toISOString().split('T')[0]}`);
                  toast.success('Users exported successfully');
                } else {
                  toast.error('No users to export');
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              {/* Name Filter */}
              <Input
                placeholder="Filter by name..."
                value={nameFilter}
                onChange={(e) => { setNameFilter(e.target.value); setCurrentPage(1); }}
                className="w-40"
              />
              
              {/* Country Filter */}
              <Select value={countryFilter} onValueChange={(value) => { setCountryFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {predefinedCountries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="advertiser">Advertiser</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Level Filter */}
              <Select value={levelFilter} onValueChange={(value) => { setLevelFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                  <SelectItem value="4">Level 4</SelectItem>
                  <SelectItem value="5">Level 5</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              
              {/* Results count */}
              <span className="text-sm text-muted-foreground ml-auto">
                {filteredUsers?.length || 0} user(s) found
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableSkeleton rows={5} columns={9} />
                </TableBody>
              </Table>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.fullName || "-"}</TableCell>
                      <TableCell>{predefinedCountries.find(c => c.code === user.country)?.name || user.country || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "destructive" : "secondary"}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.points ?? 0}</TableCell>
                      <TableCell>{user.level ?? 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/users/${user.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDeletingUserId(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-3 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No users match your search" : "No users found"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}

      <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUserId && handleDelete(deletingUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
