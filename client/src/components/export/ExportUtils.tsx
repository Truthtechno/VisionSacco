import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";

export interface ExportData {
  range: string;
  title: string;
  data: any[];
  summary?: any;
}

export const exportToPDF = async (elementId: string, filename: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error("Element not found");
    }

    // Scroll to top and wait for any dynamic content
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(element, {
      height: element.scrollHeight,
      width: element.scrollWidth,
      useCORS: true,
      allowTaint: true,
      scale: 2,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error("Failed to export PDF:", error);
    throw error;
  }
};

export const exportToCSV = (data: any[], filename: string, headers: string[]) => {
  try {
    if (!data || data.length === 0) {
      throw new Error("No data to export");
    }

    // Create CSV content
    const csvContent = [
      headers.join(","), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header.toLowerCase().replace(/\s+/g, "")] || 
                       row[header] || 
                       "";
          // Escape quotes and wrap in quotes if contains comma or quotes
          const stringValue = String(value);
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return '"' + stringValue.replace(/"/g, '""') + '"';
          }
          return stringValue;
        }).join(",")
      )
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error("Failed to export CSV:", error);
    throw error;
  }
};

export const exportDashboardReport = async (stats: any, transactions: any[], range: string) => {
  const timestamp = format(new Date(), "yyyy-MM-dd");
  
  try {
    // Export PDF
    const pdfElement = document.getElementById("dashboard-export-container");
    if (pdfElement) {
      await exportToPDF("dashboard-export-container", `dashboard-report-${timestamp}.pdf`);
    }
    
    // Prepare CSV data
    const csvData = [
      {
        metric: "Total Members",
        value: stats.totalMembers,
        period: range,
        exported: format(new Date(), "yyyy-MM-dd HH:mm:ss")
      },
      {
        metric: "Total Savings",
        value: stats.totalSavings,
        period: range,
        exported: format(new Date(), "yyyy-MM-dd HH:mm:ss")
      },
      {
        metric: "Active Loans",
        value: stats.activeLoans,
        period: range,
        exported: format(new Date(), "yyyy-MM-dd HH:mm:ss")
      },
      {
        metric: "Monthly Revenue",
        value: stats.monthlyRevenue,
        period: range,
        exported: format(new Date(), "yyyy-MM-dd HH:mm:ss")
      },
      {
        metric: "Loan Count",
        value: stats.loanCount,
        period: range,
        exported: format(new Date(), "yyyy-MM-dd HH:mm:ss")
      },
      {
        metric: "Pending Loans",
        value: stats.pendingLoans,
        period: range,
        exported: format(new Date(), "yyyy-MM-dd HH:mm:ss")
      }
    ];

    exportToCSV(
      csvData,
      `dashboard-summary-${timestamp}.csv`,
      ["Metric", "Value", "Period", "Exported"]
    );

    return true;
  } catch (error) {
    console.error("Dashboard export failed:", error);
    throw error;
  }
};

export const exportReportPDF = async ({ title, range }: { title: string; range: string }) => {
  const timestamp = format(new Date(), "yyyy-MM-dd");
  const filename = `financial-report-${timestamp}.pdf`;
  
  try {
    await exportToPDF("reports-export-container", filename);
    return true;
  } catch (error) {
    console.error("Report PDF export failed:", error);
    throw error;
  }
};

export const exportTransactionsCSV = (transactions: any[], range: string) => {
  const timestamp = format(new Date(), "yyyy-MM-dd");
  const filename = `transactions-${range}-${timestamp}.csv`;
  
  const csvData = transactions.map(transaction => ({
    "Transaction ID": transaction.id,
    "Date": format(new Date(transaction.transactionDate), "yyyy-MM-dd"),
    "Member": transaction.memberName || "N/A",
    "Type": transaction.type,
    "Amount": parseFloat(transaction.amount),
    "Description": transaction.description,
    "Processed By": transaction.processedBy
  }));

  return exportToCSV(
    csvData,
    filename,
    ["Transaction ID", "Date", "Member", "Type", "Amount", "Description", "Processed By"]
  );
};

export const exportLoansCSV = (loans: any[], range: string) => {
  const timestamp = format(new Date(), "yyyy-MM-dd");
  const filename = `loans-${range}-${timestamp}.csv`;
  
  const csvData = loans.map(loan => ({
    "Loan Number": loan.loanNumber,
    "Member": loan.memberName || "N/A",
    "Principal": parseFloat(loan.principal),
    "Interest Rate": parseFloat(loan.interestRate),
    "Term (Months)": loan.termMonths,
    "Balance": parseFloat(loan.balance),
    "Status": loan.status,
    "Purpose": loan.intendedPurpose || "N/A",
    "Created": format(new Date(loan.createdAt), "yyyy-MM-dd"),
    "Disbursed": loan.disbursementDate ? format(new Date(loan.disbursementDate), "yyyy-MM-dd") : "N/A"
  }));

  return exportToCSV(
    csvData,
    filename,
    ["Loan Number", "Member", "Principal", "Interest Rate", "Term (Months)", "Balance", "Status", "Purpose", "Created", "Disbursed"]
  );
};

export const exportMembersCSV = (members: any[], range: string) => {
  const timestamp = format(new Date(), "yyyy-MM-dd");
  const filename = `members-${range}-${timestamp}.csv`;
  
  const csvData = members.map(member => ({
    "Member Number": member.memberNumber,
    "Name": `${member.firstName} ${member.lastName}`,
    "Email": member.email || "N/A",
    "Phone": member.phone,
    "Status": member.status,
    "Role": member.role,
    "Savings Balance": parseFloat(member.savingsBalance || 0),
    "Date Joined": format(new Date(member.dateJoined), "yyyy-MM-dd"),
    "Active": member.isActive ? "Yes" : "No"
  }));

  return exportToCSV(
    csvData,
    filename,
    ["Member Number", "Name", "Email", "Phone", "Status", "Role", "Savings Balance", "Date Joined", "Active"]
  );
};