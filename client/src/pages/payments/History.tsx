import { useQuery } from "@tanstack/react-query";
import ReactPaginate from "react-paginate";
import { useSearchParams } from "react-router-dom";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Download,
  Check,
  AlertCircle
} from "lucide-react";
import { paymentAPI, Payment } from "@/api/paymentsApi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export default function PaymentHistory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "success" | "error">("idle");
  const [showExportAlert, setShowExportAlert] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-payments', page, limit],
    queryFn: () => paymentAPI.getMyPayments({ page, limit }),
  });

  const handlePageChange = ({ selected }: { selected: number }) => {
    setSearchParams({
      page: (selected + 1).toString(),
      limit: limit.toString(),
    });
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams({
      page: "1",
      limit: e.target.value,
    });
  };

  const exportToCSV = async () => {
    try {
      setExportStatus("exporting");

      // Get all payments for export (we'll fetch them all, not just the current page)
      const response = await paymentAPI.getMyPayments({ page: 1, limit: 1000 });
      const allPayments = response?.data || [];

      // Convert payments to CSV format
      const headers = [
        "Date",
        "Time",
        "Package",
        "Credits",
        "Amount ($)",
        "Transaction ID",
        "Status"
      ];

      const csvRows = allPayments.map((payment: Payment) => {
        const date = new Date(payment.createdAt);
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          payment.creditPackage?.name || "N/A",
          payment.creditPackage?.credits || "N/A",
          payment.amount.toFixed(2),
          payment.stripePaymentId,
          payment.status
        ];
      });

      // Convert to CSV string
      const csvContent = [
        headers.join(","),
        ...csvRows.map(row => row.join(","))
      ].join("\n");

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `payment-history-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus("success");
      setShowExportAlert(true);

      // Reset status after a delay
      setTimeout(() => {
        setExportStatus("idle");
        setTimeout(() => setShowExportAlert(false), 3000);
      }, 2000);

    } catch (err) {
      console.error("Export failed:", err);
      setExportStatus("error");
      setShowExportAlert(true);

      // Reset status after a delay
      setTimeout(() => {
        setExportStatus("idle");
        setTimeout(() => setShowExportAlert(false), 3000);
      }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Failed to load payment history. Please try again later.</p>
      </div>
    );
  }

  // Safely extract payments and metadata from the response
  const payments = data?.data || [];
  const metadata = data?.metadata || {
    totalItems: 0,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
  };

  // Calculate total spent on successful payments
  const totalSpent = payments
    .filter((payment: Payment) => payment.status === "SUCCEEDED")
    .reduce((sum: number, payment: Payment) => sum + payment.amount, 0);

  // Get total credits purchased
  const totalCredits = payments
    .filter((payment: Payment) => payment.status === "SUCCEEDED")
    .reduce((sum: number, payment: Payment) =>
      sum + (payment.creditPackage?.credits || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCEEDED":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "PENDING":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment History</h2>

        {metadata.totalItems > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={exportToCSV}
                  disabled={exportStatus === "exporting"}
                  variant={exportStatus === "success" ? "outline" : "default"}
                  className={exportStatus === "success" ? "bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800" : ""}
                >
                  {getExportButtonContent()}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download your payment history as a CSV file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {showExportAlert && exportStatus === "success" && (
        <Alert className="bg-green-50 text-green-700 border-green-200">
          <AlertDescription>
            Payment history successfully exported to CSV
          </AlertDescription>
        </Alert>
      )}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Credits Purchased
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCredits.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metadata.totalItems}</p>
          </CardContent>
        </Card>
      </div>

      {payments.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {metadata.currentPage} of {metadata.totalPages} pages (Total{" "}
              {metadata.totalItems} transactions)
            </p>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Items per page:</label>
              <select
                className="border rounded-md p-2"
                value={limit}
                onChange={handleLimitChange}
              >
                {ITEMS_PER_PAGE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: Payment) => (
                <TableRow key={payment.id}>
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
                    {payment.creditPackage?.credits || "N/A"}
                  </TableCell>
                  <TableCell>${payment.amount.toFixed(2)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {payment.stripePaymentId}
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
            <div className="flex flex-col items-center justify-center gap-3 pt-4">
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
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No payment history found.</p>
        </div>
      )}
    </div>
  );
}