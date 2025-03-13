import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Download,
  Check,
  AlertCircle,
  Filter,
  X,
  Calendar,
  Search,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import ReactPaginate from "react-paginate";
import { paymentAPI, Payment, PaginatedResponse } from "@/api/paymentsApi";
import {
  ITEMS_PER_PAGE_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  getStatusColor,
  exportToCSV,
} from "@/lib/adminPaymentUtils";

export default function AdminPayments() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Pagination state
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  // Filter state
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate")
      ? new Date(searchParams.get("startDate") as string)
      : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate")
      ? new Date(searchParams.get("endDate") as string)
      : undefined
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || "ALL"
  );

  // Search state - separate input value from applied search term
  const [searchInputValue, setSearchInputValue] = useState<string>(
    searchParams.get("search") || ""
  );
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>(
    searchParams.get("search") || ""
  );

  // Export state
  const [exportStatus, setExportStatus] = useState<
    "idle" | "exporting" | "success" | "error"
  >("idle");
  const [showExportAlert, setShowExportAlert] = useState(false);

  // Update search params when filters change
  useEffect(() => {
    const newParams = new URLSearchParams();

    // Add pagination params
    newParams.set("page", page.toString());
    newParams.set("limit", limit.toString());

    // Add filter params
    if (startDate) {
      newParams.set("startDate", startDate.toISOString());
    }

    if (endDate) {
      newParams.set("endDate", endDate.toISOString());
    }

    if (statusFilter && statusFilter !== "ALL") {
      newParams.set("status", statusFilter);
    }

    if (activeSearchTerm) {
      newParams.set("search", activeSearchTerm);
    }

    setSearchParams(newParams);
  }, [page, limit, startDate, endDate, statusFilter, activeSearchTerm]);

  // Build query params for API call
  const buildQueryParams = () => {
    const params: any = { page, limit };

    if (startDate) {
      params.startDate = startDate.toISOString();
    }

    if (endDate) {
      params.endDate = endDate.toISOString();
    }

    if (statusFilter && statusFilter !== "ALL") {
      params.status = statusFilter;
    }

    if (activeSearchTerm) {
      params.search = activeSearchTerm;
    }

    return params;
  };

  // Fetch payments data
  const { data, isLoading, error, refetch } = useQuery<
    PaginatedResponse<Payment>
  >({
    queryKey: [
      "admin-payments",
      page,
      limit,
      startDate,
      endDate,
      statusFilter,
      activeSearchTerm,
    ],
    queryFn: () => paymentAPI.allPayments(buildQueryParams()),
  });

  // Handle pagination
  const handlePageChange = ({ selected }: { selected: number }) => {
    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams);
      newParams.set("page", (selected + 1).toString());
      return newParams;
    });
  };

  // Handle items per page change
  const handleLimitChange = (value: string) => {
    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams);
      newParams.set("page", "1"); // Reset to first page
      newParams.set("limit", value);
      return newParams;
    });
  };

  // Handle filter changes
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    // Reset to first page when filter changes
    setSearchParams((prevParams) => {
      const newParams = new URLSearchParams(prevParams);
      newParams.set("page", "1");
      return newParams;
    });
  };

  const handleResetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setStatusFilter("ALL");
    setSearchInputValue("");
    setActiveSearchTerm("");

    // Reset to first page and default limit
    setSearchParams({
      page: "1",
      limit: "10",
    });
  };

  // Handle search input change (just updates the input value, doesn't apply the search)
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputValue(e.target.value);
  };

  // Handle search submission (applies the search)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchTerm(searchInputValue);
  };

  // Handle export with status management
  const handleExportCSV = async () => {
    await exportToCSV({
      buildQueryParams,
      paymentAPI,
      setExportStatus,
      setShowExportAlert,
    });
  };

  // // Calculate statistics
  // const calculateStatistics = () => {
  //   if (!data?.data)
  //     return {
  //       totalRevenue: 0,
  //       successCount: 0,
  //       failedCount: 0,
  //       pendingCount: 0,
  //     };

  //   const payments = data.data;
  //   const totalRevenue = payments
  //     .filter((payment) => payment.status === "SUCCEEDED")
  //     .reduce((sum, payment) => sum + payment.amount, 0);

  //   const successCount = payments.filter(
  //     (payment) => payment.status === "SUCCEEDED"
  //   ).length;
  //   const failedCount = payments.filter(
  //     (payment) => payment.status === "FAILED"
  //   ).length;
  //   const pendingCount = payments.filter(
  //     (payment) => payment.status === "PENDING"
  //   ).length;

  //   return { totalRevenue, successCount, failedCount, pendingCount };
  // };

  // const stats = calculateStatistics();

  // Export button content
  const getExportButtonContent = () => {
    switch (exportStatus) {
      case "exporting":
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        );
      case "success":
        return (
          <>
            <Check className="mr-2 h-4 w-4" />
            Exported
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            Failed
          </>
        );
      default:
        return (
          <>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </>
        );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-500 text-lg font-semibold">
          Failed to load payment transactions
        </p>
        <p className="text-gray-500 mb-4">
          There was an error retrieving the payment data.
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  // Safely extract payments and metadata from the response
  const payments = data?.data || [];
  const stats = data?.statistics || {
    totalRevenue: 0,
    successCount: 0,
    failedCount: 0,
    pendingCount: 0,
    totalCount: 0,
    successRate: 0,
    failureRate: 0,
    pendingRate: 0,
  };
  const metadata = data?.metadata || {
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Payment Transactions</h1>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleExportCSV}
                  disabled={
                    exportStatus === "exporting" || payments.length === 0
                  }
                  variant={exportStatus === "success" ? "outline" : "default"}
                  className={
                    exportStatus === "success"
                      ? "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                      : ""
                  }
                >
                  {getExportButtonContent()}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export transactions with current filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Alert messages */}
      {showExportAlert && exportStatus === "success" && (
        <Alert className="bg-green-50 text-green-700 border-green-200">
          <AlertDescription>
            Payment transactions successfully exported to CSV
          </AlertDescription>
        </Alert>
      )}


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${stats.totalRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Successful Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <Badge className="bg-green-100 text-green-800 mr-2">
              {stats.successCount}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {metadata.totalItems > 0
                ? `${((stats.successCount / metadata.totalItems) * 100).toFixed(
                  1
                )}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <Badge className="bg-red-100 text-red-800 mr-2">
              {stats.failedCount}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {metadata.totalItems > 0
                ? `${((stats.failedCount / metadata.totalItems) * 100).toFixed(
                  1
                )}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <Badge className="bg-yellow-100 text-yellow-800 mr-2">
              {stats.pendingCount}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {metadata.totalItems > 0
                ? `${((stats.pendingCount / metadata.totalItems) * 100).toFixed(
                  1
                )}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium">Filters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs h-8"
          >
            <X className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">
              Date Range
            </label>
            <div className="flex flex-col xs:flex-row gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-xs h-9"
                    size="sm"
                  >
                    <Calendar className="mr-2 h-3 w-3" />
                    <span className="truncate">
                      {startDate
                        ? format(startDate, "MMM d, yyyy")
                        : "Start Date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-xs h-9"
                    size="sm"
                  >
                    <Calendar className="mr-2 h-3 w-3" />
                    <span className="truncate">
                      {endDate ? format(endDate, "MMM d, yyyy") : "End Date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">
              Status
            </label>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "ALL" ? "All Statuses" : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Filter - Only searches when button is clicked */}
          {/* <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <label className="text-xs text-muted-foreground font-medium">
              Search
            </label>
            <form onSubmit={handleSearchSubmit} className="flex space-x-2">
              <Input
                placeholder="Email, transaction ID..."
                value={searchInputValue}
                onChange={handleSearchInputChange}
                className="flex-1 h-9 text-sm"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-9 px-3"
                      aria-label="Search transactions"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Search transactions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </form>
          </div> */}
        </div>
      </div>

      {/* Table */}
      {payments.length > 0 ? (
        <>
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <p className="text-sm text-muted-foreground">
                Showing {metadata.currentPage} of {metadata.totalPages} pages
                (Total {metadata.totalItems} transactions)
              </p>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Items per page:</label>
                <Select
                  value={limit.toString()}
                  onValueChange={handleLimitChange}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="font-medium">
                        {payment.user?.email || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {payment.userId}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.createdAt).toLocaleDateString()}
                      <div className="text-xs text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.creditPackage?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {payment.creditPackage?.credits?.toLocaleString() ||
                        "N/A"}
                    </TableCell>
                    <TableCell>${payment.amount?.toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-xs max-w-[150px] truncate">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{payment.stripePaymentId}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">
                              {payment.stripePaymentId}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {metadata.totalPages > 1 && (
              <div className="flex flex-col items-center justify-center gap-3 p-4 border-t">
                <ReactPaginate
                  pageCount={metadata.totalPages}
                  pageRangeDisplayed={5}
                  marginPagesDisplayed={2}
                  onPageChange={handlePageChange}
                  containerClassName="flex space-x-2"
                  activeClassName="bg-blue-500 text-white"
                  pageClassName="px-3 py-1 border rounded"
                  previousClassName="px-3 py-1 border rounded"
                  nextClassName="px-3 py-1 border rounded"
                  breakClassName="px-3 py-1 border rounded"
                  disabledClassName="opacity-50 cursor-not-allowed"
                  forcePage={page - 1}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-10 bg-white rounded-lg border shadow-sm">
          <p className="text-muted-foreground">
            No payment transactions found.
          </p>
        </div>
      )}
    </div>
  );
}
