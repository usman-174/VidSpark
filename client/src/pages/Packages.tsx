import { packagesAPI } from "@/api/pacakgesApi";
import PaymentForm from "@/components/PaymentForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import useAuthStore from "@/store/authStore";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { 
  CreditCard, 
  Package, 
  Shield, 
  Zap, 
  Check, 
  HelpCircle,
  Award,
  Clock,
  RefreshCw
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const stripePromise = loadStripe(
  import.meta.env.VITE_APP_STRIPE_PUBLISHABLE_KEY || ""
);

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  createdAt: string;
}

const calculateUnitCost = (price: number, credits: number): number => {
  return price / credits;
};

const getPackageFeatures = (pkg: CreditPackage, isPopular: boolean): string[] => {
  const baseFeatures = [
    `${pkg.credits} credits to use at any time`,
    "No expiration date",
    "Access to all standard features"
  ];
  if (isPopular) {
    return [...baseFeatures, "Priority support", "10% bonus credits on renewal"];
  } else if (pkg.price > 50) {
    return [...baseFeatures, "Priority support", "15% bonus credits on renewal", "Early access to new features"];
  } else {
    return baseFeatures;
  }
};

const getSavingsMessage = (pkg: CreditPackage, packages: CreditPackage[]): string | null => {
  if (packages.length <= 1 || pkg.id === packages[0].id) {
    return null;
  }
  const basicPkg = packages[0];
  const basicUnitCost = calculateUnitCost(basicPkg.price, basicPkg.credits);
  const currentUnitCost = calculateUnitCost(pkg.price, pkg.credits);
  if (currentUnitCost < basicUnitCost) {
    const savingsPercent = Math.round((1 - (currentUnitCost / basicUnitCost)) * 100);
    return savingsPercent >= 5 ? `Save ${savingsPercent}% per credit` : null;
  }
  return null;
};

const Packages: React.FC = () => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("packages");
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const response = await packagesAPI.getPackages();
        const sortedPackages = response.sort((a: any, b: any) => a.price - b.price);
        setPackages(sortedPackages);
        if (sortedPackages.length > 0) {
          const recommendedIndex = Math.min(1, sortedPackages.length - 1);
          setSelectedPackageId(sortedPackages[recommendedIndex].id);
        }
      } catch (error: any) {
        toast.error("Failed to load packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const getPopularPackageId = () => {
    if (packages.length >= 3) return packages[1].id;
    if (packages.length === 2) return packages[1].id;
    if (packages.length === 1) return packages[0].id;
    return "";
  };

  const popularPackageId = getPopularPackageId();

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
  };

  const handleContinueToPayment = () => {
    setActiveTab("payment");
  };

  const handleBackToPackages = () => {
    setActiveTab("packages");
  };

  const selectedPackage = packages.find(pkg => pkg.id === selectedPackageId);
  
  const creditComparison = selectedPackage ? (
    packages
      .filter(pkg => pkg.id !== selectedPackage.id)
      .map(pkg => {
        const diff = selectedPackage.credits - pkg.credits;
        const percentDiff = Math.round((diff / pkg.credits) * 100);
        return { name: pkg.name, diff, percentDiff };
      })
      .filter(comp => comp.diff > 0)
      .sort((a, b) => b.percentDiff - a.percentDiff)
      .slice(0, 1)
  ) : [];

  const handleRefreshBalance = () => {
    useAuthStore.getState().refreshUser();
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      {/* Hero section */}
      <div className="relative text-center mb-12 py-8">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 rounded-xl"></div>
        <div className="relative z-10">
          <Badge variant="outline" className="bg-white mb-3 px-3 py-1 text-sm font-medium text-teal-700 border-teal-200">
            Power up your account
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-teal-700">
            Get More Credits
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-4">
            Select a package that fits your needs and power up your experience with our premium credits.
            Our flexible packages are designed to suit every user type.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm text-sm">
              <Check className="h-4 w-4 text-green-500 mr-1.5" />
              <span>Secure checkout</span>
            </div>
            <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm text-sm">
              <Check className="h-4 w-4 text-green-500 mr-1.5" />
              <span>Instant delivery</span>
            </div>
            <div className="flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm text-sm">
              <Check className="h-4 w-4 text-green-500 mr-1.5" />
              <span>No subscription</span>
            </div>
          </div>
        </div>
      </div>

      {user && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">
              Welcome back, {user.email}
            </p>
            <p className="text-sm text-teal-700">
              Your current balance: <span className="font-bold">{user.creditBalance} credits</span>
            </p>
          </div>
          <Button onClick={handleRefreshBalance} variant="outline" className="text-teal-700 border-teal-200 hover:bg-teal-100">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh Balance
          </Button>
        </div>
      )}

      <div className="grid gap-8">
        <Tabs defaultValue="packages" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger 
              value="packages" 
              className={`text-base ${activeTab === "packages" ? "bg-teal-700 text-white" : "text-inherit"}`}
            >
              <Package className="w-4 h-4 mr-2 text-teal-700" />
              Choose Package
            </TabsTrigger>
            <TabsTrigger 
              value="payment" 
              className={`text-base ${activeTab === "payment" ? "bg-teal-700 text-white" : "text-inherit"}`}
            >
              <CreditCard className="w-4 h-4 mr-2 text-teal-700" />
              Payment Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-6 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Loading packages...</p>
                </div>
              </div>
            )}
            
            {packages.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">No packages available</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Available Packages</h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center text-sm text-muted-foreground cursor-help">
                          <HelpCircle className="h-4 w-4 mr-1" />
                          <span>How credits work</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Credits can be used for all features. They never expire and are automatically deducted when you use premium features.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {packages.map((pkg, index) => {
                      const isPopular = pkg.id === popularPackageId;
                      const unitCost = calculateUnitCost(pkg.price, pkg.credits).toFixed(3);
                      const savingsMessage = getSavingsMessage(pkg, packages);
                      
                      return (
                        <motion.div
                          key={pkg.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1, type: "spring", stiffness: 100 }}
                          whileHover={{ y: -5 }}
                        >
                          <Card 
                            className={`overflow-hidden h-full border ${isPopular ? 'border-indigo-300' : 'border-gray-200'} ${
                              selectedPackageId === pkg.id
                                ? "ring-2 ring-teal-500 shadow-lg"
                                : "hover:shadow-md"
                            }`}
                          >
                            {isPopular && (
                              <div className="bg-teal-700 text-white text-center py-1.5 text-sm font-medium">
                                MOST POPULAR
                              </div>
                            )}
                            
                            <CardHeader className={`pb-2 ${isPopular ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : ''}`}>
                              <div className="flex justify-between items-center">
                                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                                {isPopular && (
                                  <Badge variant="outline" className="text-sm font-medium text-teal-700">
                                    <Award className="h-3 w-3 mr-1" />
                                    Best Value
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="text-sm">
                                {isPopular 
                                  ? "Perfect for regular users" 
                                  : index === 0
                                    ? "Great for trying out our service" 
                                    : "Ideal for power users"}
                              </CardDescription>
                            </CardHeader>
                            
                            <CardContent className="p-6 space-y-5">
                              <div className="flex items-baseline">
                                <span className="text-3xl font-bold">${pkg.price.toFixed(2)}</span>
                                <span className="text-muted-foreground ml-1 text-sm">USD</span>
                                
                                {savingsMessage && (
                                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                                    {savingsMessage}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center text-base font-medium">
                                <Zap className="h-5 w-5 text-teal-700 mr-2" />
                                <span><strong>{pkg.credits.toLocaleString()}</strong> Credits</span>
                              </div>
                              
                              <div className="text-xs text-muted-foreground bg-slate-50 px-2 py-1 rounded inline-flex items-center">
                                <span>${unitCost} per credit</span>
                              </div>
                            </CardContent>
                            
                            <CardFooter className="p-4 pt-0">
                              <button
                                onClick={() => handlePackageSelect(pkg.id)}
                                className={`w-full py-2.5 px-4 rounded-md transition-all ${
                                  selectedPackageId === pkg.id
                                    ? "bg-teal-700 text-white shadow-md"
                                    : isPopular
                                      ? "bg-indigo-100 text-teal-700 hover:bg-teal-700 hover:text-white border border-teal-200"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                                }`}
                              >
                                {selectedPackageId === pkg.id ? "Selected" : "Select Package"}
                              </button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </>
            )}

            {selectedPackageId && (
              <motion.div 
                className="flex flex-col items-center justify-center mt-8 p-6 border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {selectedPackage && creditComparison.length > 0 && (
                  <p className="text-teal-700 mb-3 text-sm font-medium">
                    Get {creditComparison[0].diff.toLocaleString()} more credits ({creditComparison[0].percentDiff}% more) than the {creditComparison[0].name} package!
                  </p>
                )}
                
                <button
                  onClick={handleContinueToPayment}
                  className="flex items-center px-6 py-3 bg-teal-700 text-white rounded-md shadow-md hover:bg-teal-700 transition-colors"
                >
                  <CreditCard className="mr-2 h-5 w-5 text-teal-700" />
                  Continue to Payment
                </button>
                
                <div className="flex items-center mt-4 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Checkout takes less than 2 minutes</span>
                </div>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="payment" className="space-y-6 relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Processing payment information...</p>
                </div>
              </div>
            )}
            
            <div className="flex items-center mb-4">
              <button 
                onClick={handleBackToPackages}
                className="text-sm flex items-center text-teal-700 hover:text-teal-800"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to packages
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center">
                      <CreditCard className="mr-2 h-5 w-5 text-teal-700" />
                      Payment Details
                    </CardTitle>
                    <CardDescription className="text-teal-700">
                      Your payment information is securely processed using 256-bit SSL encryption. We do not store your card details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedPackageId ? (
                      <Elements stripe={stripePromise}>
                        <PaymentForm
                          selectedPackageId={selectedPackageId}
                          loading={loading}
                          setLoading={setLoading}
                        />
                      </Elements>
                    ) : (
                      <div className="text-center py-10">
                        <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground mb-4">Please select a package first</p>
                        <button
                          onClick={handleBackToPackages}
                          className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                        >
                          Go to Packages
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedPackage ? (
                      <>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{selectedPackage.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedPackage.credits.toLocaleString()} credits</p>
                          </div>
                          <p className="font-semibold">${selectedPackage.price.toFixed(2)}</p>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center font-medium">
                          <p>Total</p>
                          <p className="text-lg">${selectedPackage.price.toFixed(2)}</p>
                        </div>
                        
                        {selectedPackage.id === popularPackageId && (
                          <div className="bg-green-50 p-3 rounded-md text-sm">
                            <p className="font-medium text-green-700 flex items-center">
                              <Check className="h-4 w-4 mr-1.5" />
                              Best value option
                            </p>
                            <p className="text-green-600 text-xs mt-1">
                              This package offers the best balance of credits and cost.
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No package selected
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="bg-slate-50 px-6 py-4 text-sm space-y-2">
                    <div className="flex items-center text-muted-foreground">
                      <Shield className="h-4 w-4 mr-1.5 text-teal-700" />
                      <span>Secure 256-bit SSL encryption</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Zap className="h-4 w-4 mr-1.5 text-teal-700" />
                      <span>Credits delivered instantly</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1.5 text-teal-700" />
                      <span>No recurring charges</span>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center space-x-4 text-sm text-muted-foreground mt-6 bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1" />
                <span>Secure Payment</span>
              </div>
              <Separator className="h-4 w-px bg-slate-200" orientation="vertical" />
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-1" />
                <span>SSL Encrypted</span>
              </div>
              <Separator className="h-4 w-px bg-slate-200" orientation="vertical" />
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-1" />
                <span>Instant Delivery</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Packages;
