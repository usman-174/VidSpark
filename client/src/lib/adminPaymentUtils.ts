import { Payment } from "@/api/paymentsApi";

// Constants
export const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];
export const PAYMENT_STATUS_OPTIONS = ["ALL", "PENDING", "SUCCEEDED", "FAILED"];

// Helper functions
export const getStatusColor = (status: string) => {
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

// Export to CSV function
export const exportToCSV = async ({
  buildQueryParams,
  paymentAPI,
  setExportStatus,
  setShowExportAlert
}: {
  buildQueryParams: () => any;
  paymentAPI: any;
  setExportStatus: (status: "idle" | "exporting" | "success" | "error") => void;
  setShowExportAlert: (show: boolean) => void;
}) => {
  try {
    setExportStatus("exporting");

    // Fetch all data for export (with current filters but large limit)
    const exportParams = buildQueryParams();
    exportParams.limit = 1000; // Get more data for export
    exportParams.page = 1;

    const response = await paymentAPI.allPayments(exportParams);
    const allPayments = response?.data || [];

    if (allPayments.length === 0) {
      throw new Error("No data to export");
    }

    // Convert payments to CSV format
    const headers = [
      "ID",
      "User Email",
      "User ID",
      "Date",
      "Time",
      "Package",
      "Credits",
      "Amount ($)",
      "Transaction ID",
      "Status",
    ];

    const csvRows = allPayments.map((payment: Payment) => {
      const date = new Date(payment.createdAt);
      return [
        payment.id,
        payment.user?.email || "N/A",
        payment.userId,
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        payment.creditPackage?.name || "N/A",
        payment.creditPackage?.credits || "N/A",
        payment.amount.toFixed(2),
        payment.stripePaymentId,
        payment.status,
      ];
    });

    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...csvRows.map((row:any) =>
        row
          .map((cell:any) =>
            // Handle fields that might contain commas or quotes by quoting them
            typeof cell === "string" &&
            (cell.includes(",") || cell.includes('"'))
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          )
          .join(",")
      ),
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    try {
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `payment-transactions-${new Date().toISOString().split("T")[0]}.csv`
      );

      // Use a more controlled approach to trigger the download
      document.body.appendChild(link);
      link.click();

      // Make sure to clean up properly
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Free up memory by revoking the object URL
      }, 100);

      // Only set success after we're sure the download initiated properly
      setExportStatus("success");
      setShowExportAlert(true);

      // Clean up the UI after a delay
      const successTimer = setTimeout(() => {
        setExportStatus("idle");
        const alertTimer = setTimeout(() => {
          setShowExportAlert(false);
        }, 3000);
      }, 2000);
    } catch (downloadError) {
      console.error("Download error:", downloadError);
      throw new Error("Failed to download the file");
    }
  } catch (err) {
    console.error("Export failed:", err);


    // Clean up the UI after a delay
    const errorTimer = setTimeout(() => {
      setExportStatus("idle");
      const alertTimer = setTimeout(() => {
        setShowExportAlert(false);
      }, 3000);
    }, 3000);
  }
};