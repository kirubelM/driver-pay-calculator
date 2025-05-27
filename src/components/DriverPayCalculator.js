
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Download } from "lucide-react";

const defaultDriverData = {
  "Adisu J": { dailyRate: 250, hourlyRate: 25, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Barnabas": { dailyRate: 230, hourlyRate: 23, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Birhanu": { dailyRate: 230, hourlyRate: 23, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Daniel": { dailyRate: 250, hourlyRate: 25, daysWorked: 12, hoursWorked: 0, expense1099: 0, comments: "" },
  "Dawit": { dailyRate: 230, hourlyRate: 23, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Ephrem": { dailyRate: 275, hourlyRate: 25, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Eshetu": { dailyRate: 230, hourlyRate: 23, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Eyouel": { dailyRate: 230, hourlyRate: 23, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Feleke": { dailyRate: 275, hourlyRate: 25, daysWorked: 12, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Kaleab": { dailyRate: 312, hourlyRate: 26, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Keun": { dailyRate: 308, hourlyRate: 28, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Kirubel": { dailyRate: 230, hourlyRate: 0, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Mulugeta": { dailyRate: 230, hourlyRate: 25, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Mussie": { dailyRate: 250, hourlyRate: 25, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Semira": { dailyRate: 172.5, hourlyRate: 0, daysWorked: 8, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Tekle": { dailyRate: 324, hourlyRate: 27, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Yared": { dailyRate: 275, hourlyRate: 25, daysWorked: 8, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Yordanos": { dailyRate: 324, hourlyRate: 0, daysWorked: 12, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Zebib": { dailyRate: 230, hourlyRate: 23, daysWorked: 6, hoursWorked: 0, expense1099: 0, comments: "-" },
  "Zekarias": { dailyRate: 275, hourlyRate: 25, daysWorked: 10, hoursWorked: 0, expense1099: 0, comments: "-" }
};

function calculateTotalPay({ hoursWorked, hourlyRate, daysWorked, dailyRate, expense1099 }) {
  const hourlyPay = hoursWorked * hourlyRate;
  const dailyPay = daysWorked * dailyRate;
  const regularPay = hourlyPay + dailyPay;
  const totalPay = regularPay + (expense1099 || 0);
  return { hourlyPay, dailyPay, regularPay, totalPay };
}

export default function DriverPayCalculator() {
  const [drivers, setDrivers] = useState(defaultDriverData);

  const handleChange = (driver, field, value) => {
    setDrivers((prev) => ({
      ...prev,
      [driver]: {
        ...prev[driver],
        [field]: field === "comments" ? value : parseFloat(value) || 0,
      },
    }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🚗 Driver Pay Calculator</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Driver</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Daily Rate</TableHead>
            <TableHead>Hourly Rate</TableHead>
            <TableHead>1099</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(drivers).map(([name, data]) => {
            const { totalPay } = calculateTotalPay(data);
            return (
              <TableRow key={name}>
                <TableCell className="font-medium">{name}</TableCell>
                <TableCell><Input type="number" value={data.daysWorked} onChange={(e) => handleChange(name, "daysWorked", e.target.value)} /></TableCell>
                <TableCell><Input type="number" value={data.hoursWorked} onChange={(e) => handleChange(name, "hoursWorked", e.target.value)} /></TableCell>
                <TableCell><Input type="number" value={data.dailyRate} onChange={(e) => handleChange(name, "dailyRate", e.target.value)} /></TableCell>
                <TableCell><Input type="number" value={data.hourlyRate} onChange={(e) => handleChange(name, "hourlyRate", e.target.value)} /></TableCell>
                <TableCell><Input type="number" value={data.expense1099} onChange={(e) => handleChange(name, "expense1099", e.target.value)} /></TableCell>
                <TableCell><Input type="text" value={data.comments} onChange={(e) => handleChange(name, "comments", e.target.value)} /></TableCell>
                <TableCell className="text-right font-semibold">${totalPay.toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="mt-6">
        <Button onClick={() => {
          const csvContent = [
            ["Driver", "Days", "Hours", "Daily Rate", "Hourly Rate", "1099", "Total Pay"],
            ...Object.entries(drivers).map(([name, data]) => {
              const { totalPay } = calculateTotalPay(data);
              return [name, data.daysWorked, data.hoursWorked, data.dailyRate, data.hourlyRate, data.expense1099, totalPay.toFixed(2)];
            }),
          ]
            .map((row) => row.join(","))
            .join("\n");
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", "driver_pay_summary.csv");
          link.click();
        }}>
          <Download className="mr-2 h-4 w-4" /> Download CSV
        </Button>
      </div>
    </div>
  );
}
