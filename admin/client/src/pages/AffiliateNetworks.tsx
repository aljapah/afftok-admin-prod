import { useState } from "react";
import { trpc } from "../lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { 
  Globe, 
  DollarSign, 
  Users, 
  ShoppingCart,
  Wallet,
  Building,
  Plus,
  ExternalLink,
  Settings,
  Clock
} from "lucide-react";

// Predefined networks data
const predefinedNetworks = [
  {
    id: "direct",
    name: "Direct Payment",
    nameAr: "دفع مباشر",
    type: "direct",
    logoUrl: "",
    websiteUrl: "",
    affiliateProgramUrl: "",
    paymentMethod: "direct",
    paymentCurrency: "USD",
    minPayout: 0,
    paymentCycle: "monthly",
    supportedCountries: ["SA", "AE", "EG", "MA", "DZ", "TN", "IN", "PK", "KW", "BH", "OM", "QA"],
    status: "active",
    totalOffers: 0,
    totalPromoters: 0,
  },
  {
    id: "payoneer",
    name: "Payoneer",
    nameAr: "بايونير",
    type: "payment_provider",
    logoUrl: "https://www.payoneer.com/favicon.ico",
    websiteUrl: "https://www.payoneer.com",
    affiliateProgramUrl: "https://www.payoneer.com/partners",
    paymentMethod: "payoneer",
    paymentCurrency: "USD",
    minPayout: 50,
    paymentCycle: "weekly",
    supportedCountries: ["SA", "AE", "EG", "MA", "DZ", "TN", "IN", "PK", "KW", "BH", "OM", "QA"],
    status: "coming_soon",
    totalOffers: 0,
    totalPromoters: 0,
  },
];

export default function AffiliateNetworks() {
  const [networks] = useState(predefinedNetworks);
  const [selectedNetwork, setSelectedNetwork] = useState<typeof predefinedNetworks[0] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case "coming_soon":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Coming Soon</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "marketplace":
        return <ShoppingCart className="h-4 w-4" />;
      case "payment_provider":
        return <Wallet className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "marketplace":
        return "Marketplace";
      case "payment_provider":
        return "Payment Provider";
      case "direct":
        return "Direct";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Affiliate Networks</h1>
          <p className="text-gray-400 mt-1">
            Manage payment networks and integration partners
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Network
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Globe className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Networks</p>
                <p className="text-2xl font-bold text-white">
                  {networks.filter(n => n.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Coming Soon</p>
                <p className="text-2xl font-bold text-white">
                  {networks.filter(n => n.status === "coming_soon").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Marketplaces</p>
                <p className="text-2xl font-bold text-white">
                  {networks.filter(n => n.type === "marketplace").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Wallet className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Payment Providers</p>
                <p className="text-2xl font-bold text-white">
                  {networks.filter(n => n.type === "payment_provider").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Networks Table */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Networks</CardTitle>
          <CardDescription className="text-gray-400">
            Configure affiliate networks and payment integration partners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">Network</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Payment</TableHead>
                <TableHead className="text-gray-400">Countries</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {networks.map((network) => (
                <TableRow key={network.id} className="border-gray-700">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                        {network.logoUrl ? (
                          <img 
                            src={network.logoUrl} 
                            alt={network.name}
                            className="w-6 h-6"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          getTypeIcon(network.type)
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{network.name}</p>
                        <p className="text-sm text-gray-400">{network.nameAr}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(network.type)}
                      <span className="text-gray-300">{getTypeLabel(network.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white">{network.paymentMethod}</p>
                      <p className="text-sm text-gray-400">
                        Min: {network.minPayout} {network.paymentCurrency}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {network.supportedCountries.slice(0, 3).map((country) => (
                        <Badge 
                          key={country} 
                          variant="outline" 
                          className="text-xs border-gray-600 text-gray-300"
                        >
                          {country}
                        </Badge>
                      ))}
                      {network.supportedCountries.length > 3 && (
                        <Badge 
                          variant="outline" 
                          className="text-xs border-gray-600 text-gray-300"
                        >
                          +{network.supportedCountries.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(network.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedNetwork(network);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      {network.websiteUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(network.websiteUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Network Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedNetwork && (
                <>
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    {getTypeIcon(selectedNetwork.type)}
                  </div>
                  <div>
                    <span>{selectedNetwork.name}</span>
                    <p className="text-sm text-gray-400 font-normal">
                      {selectedNetwork.nameAr}
                    </p>
                  </div>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure network settings and API integration
            </DialogDescription>
          </DialogHeader>
          
          {selectedNetwork && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Type</Label>
                  <p className="text-white mt-1">{getTypeLabel(selectedNetwork.type)}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedNetwork.status)}</div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Payment Settings</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-500 text-xs">Method</Label>
                    <p className="text-white">{selectedNetwork.paymentMethod}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Min Payout</Label>
                    <p className="text-white">{selectedNetwork.minPayout} {selectedNetwork.paymentCurrency}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs">Cycle</Label>
                    <p className="text-white capitalize">{selectedNetwork.paymentCycle}</p>
                  </div>
                </div>
              </div>

              {/* Supported Countries */}
              <div>
                <Label className="text-gray-400">Supported Countries</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedNetwork.supportedCountries.map((country) => (
                    <Badge 
                      key={country} 
                      className="bg-blue-500/20 text-blue-400 border-blue-500/30"
                    >
                      {country}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Website</Label>
                  <a 
                    href={selectedNetwork.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm mt-1 block"
                  >
                    {selectedNetwork.websiteUrl}
                  </a>
                </div>
                <div>
                  <Label className="text-gray-400">Affiliate Program</Label>
                  <a 
                    href={selectedNetwork.affiliateProgramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm mt-1 block"
                  >
                    {selectedNetwork.affiliateProgramUrl}
                  </a>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="border-gray-600"
            >
              Close
            </Button>
            {selectedNetwork?.status === "coming_soon" && (
              <Button className="bg-purple-600 hover:bg-purple-700">
                Request Integration
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

