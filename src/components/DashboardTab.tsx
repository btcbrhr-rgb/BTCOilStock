/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from "react";
import {
  BarChart2,
  CalendarRange,
  Layers,
  TrendingUp,
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertOctagon,
  Sliders,
  PieChart as PieIcon,
  Wallet,
  ArrowRight,
  Info,
  Coins,
  ShieldAlert,
  Gauge
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ReferenceLine,
  ComposedChart
} from "recharts";
import { Tank, Receipt, Disbursement, Project } from "../types";

interface DashboardTabProps {
  tanks: Tank[];
  receipts: Receipt[];
  disbursements: Disbursement[];
  projects: Project[];
  onFilterDisbursementsByProject: (projectName: string) => void;
}

// Custom Liquid Tank visual colors
const TANK_COLORS = [
  { hex: "#3b82f6", gradient: "from-blue-600 to-blue-400", badge: "text-blue-600 bg-blue-50 border-blue-200", bgTailwind: "bg-blue-600" },
  { hex: "#10b981", gradient: "from-emerald-600 to-emerald-400", badge: "text-emerald-600 bg-emerald-50 border-emerald-200", bgTailwind: "bg-emerald-600" },
  { hex: "#f59e0b", gradient: "from-amber-600 to-amber-400", badge: "text-amber-600 bg-amber-50 border-amber-200", bgTailwind: "bg-amber-600" },
  { hex: "#a855f7", gradient: "from-purple-600 to-purple-400", badge: "text-purple-600 bg-purple-50 border-purple-200", bgTailwind: "bg-purple-600" },
  { hex: "#06b6d4", gradient: "from-cyan-600 to-cyan-400", badge: "text-cyan-600 bg-cyan-50 border-cyan-200", bgTailwind: "bg-cyan-600" }
];

function getTankColorConfig(tankId: string, tankName: string, index: number) {
  let hash = 0;
  const str = String(tankId || "") + String(tankName || "");
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash + index) % TANK_COLORS.length;
  return TANK_COLORS[colorIndex];
}

function formatNumber(num: number, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return "0.00";
  return Number(num).toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatDateTh(dateStr: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  let year = d.getFullYear();
  if (year < 2400) year += 543;
  return `${day}/${month}/${year}`;
}

export default function DashboardTab({
  tanks,
  receipts,
  disbursements,
  projects,
  onFilterDisbursementsByProject,
}: DashboardTabProps) {
  // Years and categories filters
  const years = useMemo(() => {
    const list = new Set<number>();
    const currentYear = new Date().getFullYear();
    list.add(currentYear);
    list.add(2026);
    receipts.forEach((r) => {
      if (r.วันที่รับเข้า) {
        const d = new Date(r.วันที่รับเข้า);
        if (!isNaN(d.getFullYear())) {
          list.add(d.getFullYear());
        }
      }
    });
    return Array.from(list).sort((a, b) => b - a);
  }, [receipts]);

  const categories = useMemo(() => {
    const list = new Set<string>();
    tanks.forEach((t) => {
      if (t.ประเภทวัสดุ) {
        list.add(t.ประเภทวัสดุ.trim());
      }
    });
    return Array.from(list);
  }, [tanks]);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    if (categories.length > 0) {
      if (!selectedCategory || !categories.includes(selectedCategory)) {
        setSelectedCategory(categories[0]);
      }
    } else {
      setSelectedCategory("");
    }
  }, [categories, selectedCategory]);
  const [activeSubTab, setActiveSubTab] = useState<"stocks" | "purchases" | "projects">("stocks");
  const [stocksStatusFilter, setStocksStatusFilter] = useState<"all" | "critical" | "warning" | "normal">("all");
  const [consumptionMetric, setConsumptionMetric] = useState<"cost" | "qty">("cost");
  const [trendSelectedTank, setTrendSelectedTank] = useState<string>("all");

  const activeUnit = useMemo(() => {
    if (trendSelectedTank === "all") return "หน่วย";
    const tank = tanks.find((t) => t.IDถัง === trendSelectedTank);
    return tank ? tank.หน่วยนับ : "หน่วย";
  }, [trendSelectedTank, tanks]);

  // Summary Metrics of All Stock Tanks
  const stockSummaryStats = useMemo(() => {
    let totalTanks = tanks.length;
    let criticalCount = 0;
    let warningCount = 0;
    let normalCount = 0;
    let totalEstimatedValue = 0;
    const materialSummary: { [key: string]: { current: number; max: number; unit: string } } = {};

    tanks.forEach((t) => {
      const current = Number(t.ปริมาณคงเหลือปัจจุบัน) || 0;
      const max = Number(t.ความจุสูงสุด) || 1;
      const threshold = Number(t.เกณฑ์แจ้งเตือนต่ำวิกฤต) || 0;
      const price = Number(t.ราคาน้ำมันอ้างอิง) || 0;
      const mat = t.ประเภทวัสดุ || "ทั่วไป";

      totalEstimatedValue += current * price;

      if (!materialSummary[mat]) {
        materialSummary[mat] = { current: 0, max: 0, unit: t.หน่วยนับ || "" };
      }
      materialSummary[mat].current += current;
      materialSummary[mat].max += max;

      if (current <= threshold) {
        criticalCount++;
      } else if (current <= threshold * 1.5) {
        warningCount++;
      } else {
        normalCount++;
      }
    });

    return {
      totalTanks,
      criticalCount,
      warningCount,
      normalCount,
      totalEstimatedValue,
      materialSummary,
    };
  }, [tanks]);

  // Active Category & Tanks Grouping
  const tanksByGroup = useMemo(() => {
    const groups: { [key: string]: Tank[] } = {};
    tanks.forEach((t) => {
      const cat = t.ประเภทวัสดุ || "ทั่วไป";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });
    return groups;
  }, [tanks]);

  // Aggregate cumulative disbursements per category group
  const totalDisbursedByGroup = useMemo(() => {
    const groupSums: { [key: string]: number } = {};
    disbursements.forEach((d) => {
      if (d.สถานะ !== "ไม่อนุมัติ") {
        const matchingTank = tanks.find((t) => t["ชื่อคลัง/ถังเก็บ"] === d["ชื่อสินค้า (คลัง)"]);
        if (matchingTank) {
          const cat = matchingTank.ประเภทวัสดุ || "ทั่วไป";
          groupSums[cat] = (groupSums[cat] || 0) + (Number(d.จำนวนที่จ่าย) || 0);
        }
      }
    });
    return groupSums;
  }, [disbursements, tanks]);

  // Annual Procurement Matrix calculation
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const annualMatrixData = useMemo(() => {
    const list = Array.from({ length: 12 }, () => ({ qty: 0, cost: 0 }));
    const tanksInClass = tanks.filter((t) => t.ประเภทวัสดุ === selectedCategory);
    if (tanksInClass.length === 0) return { list, displayUnit: "-", totalQty: 0, totalCost: 0, averagePrice: 0 };

    const referenceUnit = tanksInClass[0].หน่วยนับ || "";
    const displayUnit = referenceUnit === "กิโลกรัม" ? "ตัน" : referenceUnit;

    let totalQty = 0;
    let totalCost = 0;

    receipts.forEach((r) => {
      const isTargetTank = tanksInClass.some((t) => t["ชื่อคลัง/ถังเก็บ"] === r["ชื่อสินค้า (คลัง)"]);
      if (isTargetTank && r.สถานะ !== "ไม่อนุมัติ") {
        const d = new Date(r.วันที่รับเข้า);
        if (d.getFullYear() === selectedYear) {
          const mIdx = d.getMonth();
          if (mIdx >= 0 && mIdx < 12) {
            let qtyVal = Number(r.จำนวนที่ซื้อ) || 0;
            const costVal = Number(r.มูลค่ารวม) || 0;

            totalCost += costVal;

            if (referenceUnit === "กิโลกรัม") {
              qtyVal = qtyVal / 1000; // Convert to tons
            }

            totalQty += qtyVal;

            list[mIdx].qty += qtyVal;
            list[mIdx].cost += costVal;
          }
        }
      }
    });

    const averagePrice = totalQty > 0 ? totalCost / totalQty : 0;

    return { list, displayUnit, totalQty, totalCost, averagePrice };
  }, [receipts, tanks, selectedCategory, selectedYear]);

  // Product breakdown calculation for the category
  const productBreakdown = useMemo(() => {
    const tanksInClass = tanks.filter((t) => t.ประเภทวัสดุ === selectedCategory);
    return tanksInClass.map((t, idx) => {
      let qty = 0;
      let cost = 0;

      receipts.forEach((r) => {
        if (r["ชื่อสินค้า (คลัง)"] === t["ชื่อคลัง/ถังเก็บ"] && r.สถานะ !== "ไม่อนุมัติ") {
          const d = new Date(r.วันที่รับเข้า);
          if (d.getFullYear() === selectedYear) {
            qty += Number(r.จำนวนที่ซื้อ) || 0;
            cost += Number(r.มูลค่ารวม) || 0;
          }
        }
      });

      const avg = qty > 0 ? cost / qty : 0;
      return {
        id: t.IDถัง,
        name: t["ชื่อคลัง/ถังเก็บ"],
        unit: t.หน่วยนับ,
        qty,
        cost,
        avg,
        color: getTankColorConfig(t.IDถัง, t["ชื่อคลัง/ถังเก็บ"], idx),
      };
    });
  }, [receipts, tanks, selectedCategory, selectedYear]);

  // Recharts Doughnut data: Stock Allocation %
  const stockChartData = useMemo(() => {
    const totalStock = tanks.reduce((s, t) => s + (Number(t.ปริมาณคงเหลือปัจจุบัน) || 0), 0);
    return tanks.map((t, idx) => {
      const color = getTankColorConfig(t.IDถัง, t["ชื่อคลัง/ถังเก็บ"], idx);
      const currentVal = Number(t.ปริมาณคงเหลือปัจจุบัน) || 0;
      const pct = totalStock > 0 ? (currentVal / totalStock) * 100 : 0;
      return {
        name: t["ชื่อคลัง/ถังเก็บ"],
        value: currentVal,
        percentage: pct,
        color: color.hex,
        unit: t.หน่วยนับ,
      };
    });
  }, [tanks]);

  // Recharts Line chart: Monthly purchase trend of all tanks
  const lineChartData = useMemo(() => {
    const trendList = months.map((m, mIdx) => {
      const item: { name: string; [key: string]: string | number } = { name: m };
      tanks.forEach((t) => {
        item[t["ชื่อคลัง/ถังเก็บ"]] = 0;
      });

      receipts.forEach((r) => {
        if (r.สถานะ !== "ไม่อนุมัติ") {
          const d = new Date(r.วันที่รับเข้า);
          if (d.getFullYear() === selectedYear && d.getMonth() === mIdx) {
            const tankName = r["ชื่อสินค้า (คลัง)"];
            if (item[tankName] !== undefined) {
              item[tankName] = (item[tankName] as number) + (Number(r.มูลค่ารวม) || 0);
            }
          }
        }
      });

      return item;
    });
    return trendList;
  }, [receipts, tanks, selectedYear]);

  // Recharts Monthly disbursement/consumption trend data
  const disbursementTrendData = useMemo(() => {
    const trendList = months.map((m, mIdx) => {
      const item: {
        name: string;
        totalQty: number;
        totalCost: number;
        [key: string]: string | number;
      } = {
        name: m,
        totalQty: 0,
        totalCost: 0,
      };

      tanks.forEach((t) => {
        item[t["ชื่อคลัง/ถังเก็บ"]] = 0;
        item[t["ชื่อคลัง/ถังเก็บ"] + " (บาท)"] = 0;
      });

      disbursements.forEach((d) => {
        if (d.สถานะ !== "ไม่อนุมัติ" && d.วันที่) {
          const dateObj = new Date(d.วันที่);
          if (dateObj.getFullYear() === selectedYear && dateObj.getMonth() === mIdx) {
            const tankName = d["ชื่อสินค้า (คลัง)"];
            const qty = Number(d.จำนวนที่จ่าย) || 0;
            const cost = Number(d.มูลค่ารวม) || 0;

            item.totalQty += qty;
            item.totalCost += cost;

            if (item[tankName] !== undefined) {
              item[tankName] = (item[tankName] as number) + qty;
            }
            const costKey = tankName + " (บาท)";
            if (item[costKey] !== undefined) {
              item[costKey] = (item[costKey] as number) + cost;
            }
          }
        }
      });

      return item;
    });
    return trendList;
  }, [disbursements, tanks, selectedYear]);

  // Insights regarding consumption patterns & spikes
  const consumptionInsights = useMemo(() => {
    let maxCost = 0;
    let maxCostMonth = "-";
    let totalYearCost = 0;
    let totalYearQty = 0;
    const productUsageTotals: { [key: string]: number } = {};

    const selectedTankObj = trendSelectedTank === "all" ? null : tanks.find((t) => t.IDถัง === trendSelectedTank);

    months.forEach((m, mIdx) => {
      const data = disbursementTrendData[mIdx];
      let monthlyCost = 0;
      let monthlyQty = 0;

      if (selectedTankObj) {
        const tankName = selectedTankObj["ชื่อคลัง/ถังเก็บ"];
        monthlyCost = Number(data[tankName + " (บาท)"]) || 0;
        monthlyQty = Number(data[tankName]) || 0;
      } else {
        monthlyCost = data.totalCost;
        monthlyQty = data.totalQty;
      }

      totalYearCost += monthlyCost;
      totalYearQty += monthlyQty;

      if (monthlyCost > maxCost) {
        maxCost = monthlyCost;
        maxCostMonth = m;
      }

      tanks.forEach((t) => {
        const tankName = t["ชื่อคลัง/ถังเก็บ"];
        const qty = Number(data[tankName]) || 0;
        productUsageTotals[tankName] = (productUsageTotals[tankName] || 0) + qty;
      });
    });

    const avgMonthlyCost = totalYearCost / 12;
    const avgMonthlyQty = totalYearQty / 12;

    let topProduct = "-";
    let maxProductQty = 0;

    if (selectedTankObj) {
      topProduct = selectedTankObj["ชื่อคลัง/ถังเก็บ"];
      maxProductQty = totalYearQty;
    } else {
      Object.entries(productUsageTotals).forEach(([pName, qty]) => {
        if (qty > maxProductQty) {
          maxProductQty = qty;
          topProduct = pName;
        }
      });
    }

    return {
      maxCost,
      maxCostMonth,
      totalYearCost,
      totalYearQty,
      avgMonthlyCost,
      avgMonthlyQty,
      topProduct,
      maxProductQty
    };
  }, [disbursementTrendData, tanks, trendSelectedTank]);

  // Alerts calculations (critical level checking)
  const criticalAlerts = useMemo(() => {
    return tanks.filter((t) => {
      const current = Number(t.ปริมาณคงเหลือปัจจุบัน) || 0;
      const alertThreshold = Number(t.เกณฑ์แจ้งเตือนต่ำวิกฤต) || 0;
      return current <= alertThreshold;
    });
  }, [tanks]);

  // Project Cost Summary calculation
  const projectCostSummary = useMemo(() => {
    const summary: {
      [key: string]: {
        name: string;
        totalCost: number;
        transCount: number;
        materials: { [key: string]: number };
        latestDisbDate: Date | null;
      };
    } = {};

    // Standardize master projects first
    projects.forEach((p) => {
      const name = p["ชื่อโครงการ/ไซต์งาน"];
      if (name) {
        summary[name] = {
          name,
          totalCost: 0,
          transCount: 0,
          materials: {},
          latestDisbDate: null,
        };
      }
    });

    // Populate using disbursements
    disbursements.forEach((d) => {
      const pName = d.โครงการ;
      if (!pName) return;

      if (!summary[pName]) {
        summary[pName] = {
          name: pName,
          totalCost: 0,
          transCount: 0,
          materials: {},
          latestDisbDate: null,
        };
      }

      if (d.สถานะ !== "ไม่อนุมัติ") {
        const cost = Number(d.มูลค่ารวม) || 0;
        summary[pName].totalCost += cost;
        summary[pName].transCount += 1;

        const tankName = d["ชื่อสินค้า (คลัง)"];
        const matchedTank = tanks.find((t) => t["ชื่อคลัง/ถังเก็บ"] === tankName);
        const matType = matchedTank ? matchedTank.ประเภทวัสดุ || "ทั่วไป" : "ทั่วไป";

        summary[pName].materials[matType] = (summary[pName].materials[matType] || 0) + cost;

        if (d.วันที่) {
          const dDate = new Date(d.วันที่);
          if (!isNaN(dDate.getTime())) {
            if (!summary[pName].latestDisbDate || dDate > summary[pName].latestDisbDate!) {
              summary[pName].latestDisbDate = dDate;
            }
          }
        }
      }
    });

    return Object.values(summary).sort((a, b) => b.totalCost - a.totalCost);
  }, [disbursements, tanks, projects]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Tab Switcher */}
      <div className="bg-slate-100 p-1 md:p-1.5 rounded-2xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-1 shadow-sm">
        <button
          id="tab-dashboard-stocks"
          onClick={() => setActiveSubTab("stocks")}
          className={`flex items-center justify-center space-x-2.5 py-3 px-4 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
            activeSubTab === "stocks"
              ? "bg-white text-slate-900 shadow-md shadow-slate-200/50 border border-slate-200/40"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
          }`}
        >
          <BarChart2 className={`w-4 h-4 ${activeSubTab === "stocks" ? "text-amber-500" : "text-slate-400"}`} />
          <span>1. ปริมาณสำรองและวงเงินคงเหลือ</span>
        </button>

        <button
          id="tab-dashboard-purchases"
          onClick={() => setActiveSubTab("purchases")}
          className={`flex items-center justify-center space-x-2.5 py-3 px-4 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
            activeSubTab === "purchases"
              ? "bg-white text-slate-900 shadow-md shadow-slate-200/50 border border-slate-200/40"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
          }`}
        >
          <CalendarRange className={`w-4 h-4 ${activeSubTab === "purchases" ? "text-indigo-500" : "text-slate-400"}`} />
          <span>2. สรุปยอดจัดซื้อสะสมรายปี</span>
        </button>

        <button
          id="tab-dashboard-projects"
          onClick={() => setActiveSubTab("projects")}
          className={`flex items-center justify-center space-x-2.5 py-3 px-4 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer ${
            activeSubTab === "projects"
              ? "bg-white text-slate-900 shadow-md shadow-slate-200/50 border border-slate-200/40"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
          }`}
        >
          <Wallet className={`w-4 h-4 ${activeSubTab === "projects" ? "text-rose-500" : "text-slate-400"}`} />
          <span>3. ต้นทุนเบิกใช้วัสดุรายโครงการ</span>
        </button>
      </div>

      {activeSubTab === "stocks" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Executive Overview Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" id="executive-bento-cards">
            {/* Card 1: Estimated Total Asset Value */}
            <div className="bg-slate-950 text-white p-5 rounded-2xl border border-slate-900 shadow-md flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                  มูลค่าเงินทุนคงคลังโดยประมาณ
                </span>
                <strong className="text-xl font-black font-mono text-amber-400">
                  ฿{formatNumber(stockSummaryStats.totalEstimatedValue, 2)}
                </strong>
                <p className="text-[9px] text-slate-400 font-medium">คำนวณจากราคาอ้างอิง × ปริมาณคงคลัง</p>
              </div>
              <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-amber-400 flex-shrink-0">
                <Coins className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Material Reservoirs Aggregation */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-2 w-full">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                  ปริมาณสำรองรวมรายประเภท
                </span>
                <div className="space-y-2 max-h-[60px] overflow-y-auto pr-1">
                  {Object.keys(stockSummaryStats.materialSummary).map((mat) => {
                    const info = stockSummaryStats.materialSummary[mat];
                    const pct = Math.round((info.current / info.max) * 100) || 0;
                    return (
                      <div key={mat} className="space-y-0.5 text-[10px]">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-700">{mat}</span>
                          <span className="text-slate-500 font-mono">
                            {formatNumber(info.current, 0)} {info.unit} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 3: Storage Risk Analysis */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1 w-full">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                  ความมั่นคงและการตรวจสอบระดับ
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-center mt-1.5">
                  <button
                    onClick={() => setStocksStatusFilter("critical")}
                    className={`p-1 rounded-lg border transition cursor-pointer ${
                      stocksStatusFilter === "critical"
                        ? "bg-rose-500 border-rose-600 text-white font-black"
                        : "bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100/70"
                    }`}
                  >
                    <span className="block text-[8px] font-black">วิกฤต (🔴)</span>
                    <strong className="text-xs font-mono font-black">{stockSummaryStats.criticalCount}</strong>
                  </button>
                  <button
                    onClick={() => setStocksStatusFilter("warning")}
                    className={`p-1 rounded-lg border transition cursor-pointer ${
                      stocksStatusFilter === "warning"
                        ? "bg-amber-500 border-amber-600 text-slate-950 font-black"
                        : "bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100/70"
                    }`}
                  >
                    <span className="block text-[8px] font-black">เตือน (🟡)</span>
                    <strong className="text-xs font-mono font-black">{stockSummaryStats.warningCount}</strong>
                  </button>
                  <button
                    onClick={() => setStocksStatusFilter("normal")}
                    className={`p-1 rounded-lg border transition cursor-pointer ${
                      stocksStatusFilter === "normal"
                        ? "bg-emerald-500 border-emerald-600 text-white font-black"
                        : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100/70"
                    }`}
                  >
                    <span className="block text-[8px] font-black">ปกติ (🟢)</span>
                    <strong className="text-xs font-mono font-black">{stockSummaryStats.normalCount}</strong>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 4: Safety Indicators */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                  จำนวนจุดเก็บสำรอง / บัตรเติมน้ำมัน
                </span>
                <strong className="text-xl font-black font-mono text-slate-900">
                  {stockSummaryStats.totalTanks} <span className="text-xs font-normal text-slate-400 font-sans">จุดเก็บ</span>
                </strong>
                <p className="text-[9px] text-slate-500 font-medium">
                  ครอบคลุมคลังถังเก็บและวงเงินควบคุมระบบ
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 flex-shrink-0">
                <Gauge className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* 1. LIQUID TANKS VIEW */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="section-stocks-overview">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center">
                  <BarChart2 className="w-5 h-5 mr-2 text-amber-500" />
                  <span>ปริมาณสำรองและวงเงินบัตรเติมน้ำมันคงเหลือ</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  แสดงปริมาตรวัสดุคงคลังและข้อมูลวงเงินอ้างอิงรายถังแบบเรียลไทม์
                </p>
              </div>

              {/* Quick Status Filters embedded on the right */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 self-stretch xl:self-auto">
                <span className="text-[10px] font-extrabold text-slate-500 px-2">ตัวกรองระดับ:</span>
                <button
                  onClick={() => setStocksStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    stocksStatusFilter === "all"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50"
                  }`}
                >
                  ทั้งหมด ({stockSummaryStats.totalTanks})
                </button>
                <button
                  onClick={() => setStocksStatusFilter("critical")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    stocksStatusFilter === "critical"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-rose-600 hover:bg-rose-50"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  วิกฤต ({stockSummaryStats.criticalCount})
                </button>
                <button
                  onClick={() => setStocksStatusFilter("warning")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    stocksStatusFilter === "warning"
                      ? "bg-amber-500 text-slate-900 shadow-sm"
                      : "text-amber-600 hover:bg-amber-50"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  เตือนภัย ({stockSummaryStats.warningCount})
                </button>
                <button
                  onClick={() => setStocksStatusFilter("normal")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    stocksStatusFilter === "normal"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ปลอดภัย ({stockSummaryStats.normalCount})
                </button>
              </div>
            </div>

            {/* Compact Table List View (Optimized for instant oversight and easy scanning) */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-inner">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                    <th className="py-3.5 px-4 w-[110px]">สถานะแจ้งเตือน</th>
                    <th className="py-3.5 px-3 w-[90px]">ID ถัง</th>
                    <th className="py-3.5 px-3 min-w-[200px]">ชื่อคลัง / ถังเก็บ</th>
                    <th className="py-3.5 px-3 w-[120px]">ประเภทวัสดุ</th>
                    <th className="py-3.5 px-3 text-right w-[140px]">ปริมาณคงเหลือปัจจุบัน</th>
                    <th className="py-3.5 px-4 w-[240px]">เปอร์เซ็นต์คงเหลือ (%)</th>
                    <th className="py-3.5 px-3 text-right w-[120px]">ราคากลาง / เกณฑ์เตือน</th>
                    <th className="py-3.5 px-4 text-right w-[140px]">มูลค่าสินค้ารวม (฿)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium bg-white">
                  {(() => {
                    const filterTanks = (tankList: Tank[]) => {
                      return tankList.filter((tank) => {
                        const current = Number(tank.ปริมาณคงเหลือปัจจุบัน) || 0;
                        const threshold = Number(tank.เกณฑ์แจ้งเตือนต่ำวิกฤต) || 0;
                        if (stocksStatusFilter === "critical") return current <= threshold;
                        if (stocksStatusFilter === "warning") return current > threshold && current <= threshold * 1.5;
                        if (stocksStatusFilter === "normal") return current > threshold * 1.5;
                        return true;
                      });
                    };

                    const filteredTanksList = filterTanks(tanks).sort((a, b) =>
                      String(b.IDถัง || "").localeCompare(String(a.IDถัง || ""), undefined, { numeric: true, sensitivity: "base" })
                    );
                    if (filteredTanksList.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="py-16 text-center text-slate-400 font-bold text-xs">
                            ไม่พบข้อมูลจุดเก็บตามระดับตัวกรองสถานะที่เลือก
                          </td>
                        </tr>
                      );
                    }

                    return filteredTanksList.map((tank, idx) => {
                      const max = Number(tank.ความจุสูงสุด) || 1;
                      const current = Number(tank.ปริมาณคงเหลือปัจจุบัน) || 0;
                      const percent = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
                      const isCritical = current <= Number(tank.เกณฑ์แจ้งเตือนต่ำวิกฤต);
                      const isWarning = !isCritical && current <= Number(tank.เกณฑ์แจ้งเตือนต่ำวิกฤต) * 1.5;
                      const colorMap = getTankColorConfig(tank.IDถัง, tank["ชื่อคลัง/ถังเก็บ"], idx);
                      const estValue = current * (Number(tank.ราคาน้ำมันอ้างอิง) || 0);

                      let statusBadge = (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          🟢 ปกติปลอดภัย
                        </span>
                      );
                      if (isCritical) {
                        statusBadge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            🔴 ต่ำกว่าเกณฑ์วิกฤต!
                          </span>
                        );
                      } else if (isWarning) {
                        statusBadge = (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                            🟡 ระดับเตือนภัย
                          </span>
                        );
                      }

                      return (
                        <tr key={tank.IDถัง} className="hover:bg-slate-50/70 transition duration-150">
                          <td className="py-3 px-4">{statusBadge}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-500">{tank.IDถัง}</td>
                          <td className="py-3 px-3 font-black text-slate-900">
                            {tank["ชื่อคลัง/ถังเก็บ"]}
                          </td>
                          <td className="py-3 px-3">
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2 py-1 rounded-md">
                              {tank.ประเภทวัสดุ}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-slate-800">
                            {formatNumber(current, 2)} <span className="text-[10px] text-slate-400 font-normal">{tank.หน่วยนับ}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <div className="flex justify-between font-mono text-[9px] text-slate-400 font-extrabold">
                                <span>{percent}% ({formatNumber(current, 0)} / {formatNumber(max, 0)})</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    isCritical ? "bg-rose-500" : isWarning ? "bg-amber-500" : colorMap.bgTailwind
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right text-[11px]">
                            <div className="font-mono text-slate-700 font-bold">{formatNumber(tank.ราคาน้ำมันอ้างอิง, 2)} ฿</div>
                            <div className="text-[9px] text-slate-400">เกณฑ์: {formatNumber(tank.เกณฑ์แจ้งเตือนต่ำวิกฤต, 0)}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                            ฿{formatNumber(estValue, 2)}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. STORAGE & ALLOCATION ANALYSIS SECTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="section-stocks-analytics">
            {/* Progress ratio card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center border-b border-slate-100 pb-3">
                <Sliders className="w-5 h-5 mr-2 text-amber-500" />
                <span>อัตราการจัดเก็บสิทธิ์คงคลังรายถัง</span>
              </h2>

              <div className="space-y-4">
                {tanks.map((t, idx) => {
                  const max = Number(t.ความจุสูงสุด) || 1;
                  const current = Number(t.ปริมาณคงเหลือปัจจุบัน) || 0;
                  const pct = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
                  const isCritical = current <= Number(t.เกณฑ์แจ้งเตือนต่ำวิกฤต);
                  const colorConfig = getTankColorConfig(t.IDถัง, t["ชื่อคลัง/ถังเก็บ"], idx);

                  return (
                    <div key={t.IDถัง} id={`ratio-row-${t.IDถัง}`} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex justify-between text-xs mb-1.5 font-bold">
                        <span className="text-slate-800 flex items-center gap-1.5 truncate pr-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorConfig.bgTailwind}`} />
                          {t["ชื่อคลัง/ถังเก็บ"]}
                        </span>
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          {isCritical && <span className="text-rose-600 animate-pulse font-black text-[10px]">⚠️ วิกฤต!</span>}
                          <span className="text-slate-500 font-mono text-[10px]">
                            {formatNumber(current, 2)} / {formatNumber(max, 0)} {t.หน่วยนับ} ({pct}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isCritical ? "bg-rose-500" : colorConfig.bgTailwind
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Allocation Share Doughnut Chart using RECHARTS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between" id="section-stocks-doughnut">
              <div>
                <h2 className="text-xs font-black text-slate-800 mb-3 flex items-center">
                  <PieIcon className="w-4 h-4 mr-1.5 text-amber-500" />
                  <span>สัดส่วนคงคลังแบ่งตามมูลค่าปริมาตรรวม (Allocation Share %)</span>
                </h2>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-44 w-full sm:w-1/2 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stockChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {stockChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            borderRadius: "10px",
                            border: "none",
                            color: "white",
                            fontSize: "10px",
                            fontFamily: "Sarabun",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legends list */}
                  <div className="w-full sm:w-1/2 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {stockChartData.map((data, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b border-slate-100 pb-1.5 text-[11px] hover:bg-slate-50 p-1 rounded bg-white transition duration-150"
                      >
                        <div className="flex items-center space-x-2 truncate mr-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: data.color }} />
                          <span className="text-slate-700 font-bold truncate">{data.name}</span>
                        </div>
                        <span className="font-mono font-black text-slate-900 whitespace-nowrap">
                          {formatNumber(data.value, 0)} {data.unit} ({Math.round(data.percentage)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Consumption Trends (Full-Width Card) */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6" id="section-consumption-trends">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
                    <span>วิเคราะห์แนวโน้มมูลค่าการเบิกจ่ายและปริมาณการใช้รายเดือน (Monthly Consumption & Disbursement Analysis)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    แผนภูมิสถิติแสดงปริมาณและมูลค่าการเบิกใช้รายเดือนของคลังสำรอง เพื่อการสังเกตจุดสูงสุด (Spike) และบริหารควบคุมโควตาการเบิกพัสดุ
                  </p>
                </div>

                {/* Legend badges and Tank Selector Dropdown */}
                <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">เลือกมุมมอง:</span>
                    <select
                      value={trendSelectedTank}
                      onChange={(e) => setTrendSelectedTank(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="all">📊 สรุปรวมทุกคลังสินค้า</option>
                      {tanks.map((t) => (
                        <option key={t.IDถัง} value={t.IDถัง}>
                          📦 {t["ชื่อคลัง/ถังเก็บ"]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-100 text-[11px] font-bold text-amber-700">
                    <span className="w-2.5 h-0.5 bg-amber-500 inline-block relative -top-0.5"></span>
                    เส้นแนวโน้ม: มูลค่าเบิกจ่าย (บาท ฿) [แกนซ้าย]
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-100/50 text-[11px] font-bold text-indigo-700">
                    <span className="w-2.5 h-0.5 bg-indigo-500 inline-block relative -top-0.5"></span>
                    เส้นแนวโน้ม: ปริมาณเบิกใช้ ({activeUnit}) [แกนขวา]
                  </span>
                </div>
              </div>

              {/* Smart Insights Banner / Bento cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Box 1: Spike Month detection */}
                <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wider block">
                      จุดเบิกจ่ายสูงสุด (Spike Month)
                    </span>
                    <strong className="text-lg font-black text-rose-800 block mt-1">
                      เดือน{consumptionInsights.maxCostMonth}
                    </strong>
                  </div>
                  <div className="text-[9.5px] text-rose-600 mt-2 font-medium">
                    มียอดการเบิกใช้รวมเป็นเงินสูงถึง <strong className="font-bold">฿{formatNumber(consumptionInsights.maxCost, 0)}</strong>
                  </div>
                </div>

                {/* Box 2: Monthly Average */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                      ค่าเฉลี่ยการเบิกจ่ายรายเดือน
                    </span>
                    <strong className="text-lg font-black text-slate-800 block mt-1">
                      ฿{formatNumber(consumptionInsights.avgMonthlyCost, 0)} <span className="text-[11px] font-normal text-slate-500">/ เดือน</span>
                    </strong>
                  </div>
                  <div className="text-[9.5px] text-slate-500 mt-2 font-medium">
                    ปริมาณเฉลี่ยต่อเดือนประมาณ <strong className="font-bold font-mono text-slate-700">{formatNumber(consumptionInsights.avgMonthlyQty, 0)}</strong> {activeUnit}
                  </div>
                </div>

                {/* Box 3: Top Consumed Product */}
                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-wider block">
                      {trendSelectedTank === "all" ? "สินค้าที่เบิกใช้สูงสุดในคลัง" : "คลังสินค้าที่วิเคราะห์"}
                    </span>
                    <strong className="text-sm font-black text-indigo-900 block mt-1.5 truncate" title={consumptionInsights.topProduct}>
                      {consumptionInsights.topProduct}
                    </strong>
                  </div>
                  <div className="text-[9.5px] text-indigo-600 mt-2 font-medium truncate">
                    เบิกจ่ายสะสมทั้งปีแล้ว <strong className="font-bold font-mono">{formatNumber(consumptionInsights.maxProductQty, 0)}</strong> {activeUnit}
                  </div>
                </div>

                {/* Box 4: Total Consumption */}
                <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider block">
                      ยอดเบิกจ่ายสะสมรวมทั้งปี
                    </span>
                    <strong className="text-lg font-black text-amber-800 block mt-1">
                      ฿{formatNumber(consumptionInsights.totalYearCost, 0)}
                    </strong>
                  </div>
                  <div className="text-[9.5px] text-amber-700 mt-2 font-medium">
                    รวมทั้งสิ้น <strong className="font-bold font-mono">{formatNumber(consumptionInsights.totalYearQty, 0)}</strong> {activeUnit}
                  </div>
                </div>
              </div>

              {/* Recharts Chart Area */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={disbursementTrendData} margin={{ top: 15, right: 15, left: 15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "Sarabun" }} />
                      
                      {/* Left YAxis for Cost (Baht ฿) */}
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        domain={[0, (max: number) => Math.ceil(max * 1.15)]}
                        tick={{ fontSize: 9, fontFamily: "Sarabun" }}
                        tickFormatter={(value) => `฿${formatNumber(Number(value), 0)}`}
                      />
                      
                      {/* Right YAxis for Quantity (Units) */}
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, (max: number) => Math.ceil(max * 1.5)]}
                        tick={{ fontSize: 9, fontFamily: "Sarabun" }}
                        tickFormatter={(value) => `${formatNumber(Number(value), 0)} ${activeUnit}`}
                      />

                      <RechartsTooltip
                        formatter={(value, name) => {
                          const nameStr = String(name || "");
                          if (nameStr.includes("ปริมาณ")) {
                            return [`${formatNumber(Number(value), 0)} ${activeUnit}`, name];
                          }
                          return [`฿${formatNumber(Number(value), 2)}`, name];
                        }}
                        contentStyle={{
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          borderRadius: "12px",
                          border: "none",
                          color: "white",
                          fontSize: "11px",
                          fontFamily: "Sarabun",
                        }}
                        itemStyle={{ color: "#f8fafc" }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontFamily: "Sarabun" }} />
                      
                      {/* Cost Reference Line (Left YAxis) */}
                      <ReferenceLine
                        yAxisId="left"
                        y={consumptionInsights.avgMonthlyCost}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        label={{
                          value: `เฉลี่ย ฿${formatNumber(consumptionInsights.avgMonthlyCost, 0)}/เดือน`,
                          position: "top",
                          fill: "#b45309",
                          fontSize: 9,
                          fontFamily: "Sarabun",
                          fontWeight: "bold",
                        }}
                      />

                      {/* Render lines based on trendSelectedTank */}
                      {trendSelectedTank === "all" ? (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="totalCost"
                          name="มูลค่าเบิกจ่ายรวมทั้งหมด"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          dot={{ r: 4, stroke: "#f59e0b", strokeWidth: 2, fill: "#fff" }}
                          activeDot={{ r: 6 }}
                        />
                      ) : (
                        (() => {
                          const selectedTankObj = tanks.find(t => t.IDถัง === trendSelectedTank);
                          if (!selectedTankObj) return null;
                          const tIdx = tanks.indexOf(selectedTankObj);
                          const costKey = selectedTankObj["ชื่อคลัง/ถังเก็บ"] + " (บาท)";
                          return (
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey={costKey}
                              name={`มูลค่าเบิกจ่าย - ${selectedTankObj["ชื่อคลัง/ถังเก็บ"]}`}
                              stroke="#f59e0b"
                              strokeWidth={3}
                              dot={{ r: 4, stroke: "#f59e0b", strokeWidth: 2, fill: "#fff" }}
                              activeDot={{ r: 6 }}
                            />
                          );
                        })()
                      )}

                      {/* Trend line based on trendSelectedTank */}
                      {trendSelectedTank === "all" ? (
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="totalQty"
                          name="ปริมาณรวมเบิกจ่ายทั้งหมด"
                          stroke="#6366f1"
                          strokeWidth={3}
                          dot={{ r: 4, stroke: "#6366f1", strokeWidth: 2, fill: "#fff" }}
                          activeDot={{ r: 6 }}
                        />
                      ) : (
                        (() => {
                          const selectedTankObj = tanks.find(t => t.IDถัง === trendSelectedTank);
                          if (!selectedTankObj) return null;
                          const tIdx = tanks.indexOf(selectedTankObj);
                          const color = getTankColorConfig(selectedTankObj.IDถัง, selectedTankObj["ชื่อคลัง/ถังเก็บ"], tIdx);
                          return (
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey={selectedTankObj["ชื่อคลัง/ถังเก็บ"]}
                              name={`ปริมาณเบิกใช้ - ${selectedTankObj["ชื่อคลัง/ถังเก็บ"]}`}
                              stroke={color.hex}
                              strokeWidth={3}
                              dot={{ r: 4, stroke: color.hex, strokeWidth: 2, fill: "#fff" }}
                              activeDot={{ r: 6 }}
                            />
                          );
                        })()
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </div>
        )}

      {activeSubTab === "purchases" && (
        <div className="space-y-6 animate-in fade-in duration-300" id="section-purchases-tab">
          {/* 2. ANNUAL PURCHASE MATRIX */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center">
                  <CalendarRange className="w-5 h-5 mr-2 text-amber-500" />
                  <span>สรุปยอดจัดซื้อสะสมรายปี (Annual Purchase Matrix)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  รายงานสถิติมูลค่าจัดซื้อรวม จำแนกสเกลรายเดือน และคำนวณราคากลางเฉลี่ยต่อหน่วยพัสดุ
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <label htmlFor="annual-year-select" className="text-xs text-slate-500 font-bold">
                    ระบุปี:
                  </label>
                  <select
                    id="annual-year-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm cursor-pointer"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        ปี {y + 543} ({y})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="annual-category-select" className="text-xs text-slate-500 font-bold">
                    ประเภทวัสดุ:
                  </label>
                  <select
                    id="annual-category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Procurement Monthly Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse min-w-[900px] text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 border-r sticky left-0 bg-slate-50 z-10 w-[150px] whitespace-nowrap">
                      ยอดจัดซื้อรายเดือน
                    </th>
                    {months.map((m) => (
                      <th key={m} className="py-2 px-1 text-center border-r border-slate-100 whitespace-nowrap font-bold">
                        {m}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-center bg-amber-500 text-slate-950 font-black sticky right-0 z-10 whitespace-nowrap">
                      รวมปีนี้
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  <tr className="hover:bg-slate-50/40 border-b">
                    <td className="py-2.5 px-3 font-bold text-slate-700 border-r sticky left-0 bg-white z-10 shadow-sm whitespace-nowrap">
                      ปริมาณรับ ({annualMatrixData.displayUnit})
                    </td>
                    {annualMatrixData.list.map((m, idx) => (
                      <td key={idx} className="py-2 px-1 text-center font-mono text-slate-600 border-r border-slate-100">
                        {m.qty > 0 ? formatNumber(m.qty, 2) : "-"}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 bg-amber-500/10 sticky right-0 z-10 bg-white">
                      {formatNumber(annualMatrixData.totalQty, 2)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/40 border-b">
                    <td className="py-2.5 px-3 font-bold text-slate-700 border-r sticky left-0 bg-white z-10 shadow-sm whitespace-nowrap">
                      มูลค่ารวมจัดหา (บาท)
                    </td>
                    {annualMatrixData.list.map((m, idx) => (
                      <td key={idx} className="py-2 px-1 text-center font-mono text-slate-600 border-r border-slate-100">
                        {m.cost > 0 ? formatNumber(m.cost, 2) : "-"}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 bg-amber-500/10 sticky right-0 z-10 bg-white">
                      {formatNumber(annualMatrixData.totalCost, 2)}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/40">
                    <td className="py-2.5 px-3 font-bold text-slate-700 border-r sticky left-0 bg-white z-10 shadow-sm whitespace-nowrap">
                      ราคาเฉลี่ยต่อหน่วย
                    </td>
                    {annualMatrixData.list.map((m, idx) => {
                      const avg = m.qty > 0 ? m.cost / m.qty : 0;
                      return (
                        <td key={idx} className="py-2 px-1 text-center font-mono text-slate-500 border-r border-slate-100">
                          {avg > 0 ? formatNumber(avg, 2) : "-"}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-center font-mono font-black text-amber-700 bg-amber-500/15 sticky right-0 z-10 bg-white">
                      {annualMatrixData.averagePrice > 0 ? formatNumber(annualMatrixData.averagePrice, 2) : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Product Breakdown List inside annual summary */}
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
              <h4 className="text-xs font-black text-slate-800 flex items-center">
                <Layers className="w-4 h-4 mr-1.5 text-indigo-600" />
                <span>รายละเอียดจำแนกตามรายคลังย่อย (Product Breakdown)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {productBreakdown.map((prod) => {
                  const displayQty = prod.unit === "กิโลกรัม" && prod.qty >= 1000 ? prod.qty / 1000 : prod.qty;
                  const displayUnit = prod.unit === "กิโลกรัม" && prod.qty >= 1000 ? "ตัน" : prod.unit;

                  return (
                    <div
                      key={prod.id}
                      className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-1.5">
                        <div className="flex items-center space-x-2 truncate">
                          <span className={`w-2.5 h-2.5 rounded-full ${prod.color.bgTailwind}`} />
                          <span className="font-extrabold text-slate-800 text-[11px] truncate">{prod.name}</span>
                        </div>
                        <span
                          className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border ${prod.color.badge}`}
                        >
                          {prod.id}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                        <div className="bg-slate-50 p-1.5 rounded">
                          <span className="text-[8px] text-slate-400 block uppercase font-bold">รับสะสม</span>
                          <strong className="text-slate-800 font-mono">
                            {formatNumber(displayQty, 2)}{" "}
                            <span className="text-[8px] font-normal text-slate-500">{displayUnit}</span>
                          </strong>
                        </div>
                        <div className="bg-indigo-50/50 p-1.5 rounded">
                          <span className="text-[8px] text-indigo-400 block uppercase font-bold">รวมจัดซื้อ</span>
                          <strong className="text-indigo-900 font-mono">{formatNumber(prod.cost, 0)}</strong>
                        </div>
                        <div className="bg-amber-50/50 p-1.5 rounded">
                          <span className="text-[8px] text-amber-500 block uppercase font-bold">เฉลี่ย</span>
                          <strong className="text-amber-800 font-mono">
                            {prod.avg > 0 ? formatNumber(prod.avg, 2) : "-"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Purchase Trend Line Chart using RECHARTS */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1.5 text-amber-500" />
                <span>แนวโน้มมูลค่าการจัดซื้อรวมรายถัง ปี {selectedYear + 543}</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "Sarabun" }} />
                    <YAxis tick={{ fontSize: 9, fontFamily: "Sarabun" }} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                        borderRadius: "12px",
                        border: "none",
                        color: "white",
                        fontSize: "11px",
                        fontFamily: "Sarabun",
                      }}
                      itemStyle={{ color: "#f8fafc" }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", fontFamily: "Sarabun" }} />
                    {tanks.map((t, idx) => {
                      const color = getTankColorConfig(t.IDถัง, t["ชื่อคลัง/ถังเก็บ"], idx);
                      return (
                        <Line
                          key={t.IDถัง}
                          type="monotone"
                          dataKey={t["ชื่อคลัง/ถังเก็บ"]}
                          stroke={color.hex}
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeSubTab === "projects" && (
        <div className="animate-in fade-in duration-300" id="section-projects-tab">
          {/* 4. PROJECT COST SUMMARY */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-rose-500" />
                <span>ต้นทุนการเบิกใช้วัสดุรายโครงการ (Project Cost Summary)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                วิเคราะห์รายละเอียดสัดส่วนงบประมาณจัดหาพัสดุและน้ำมันที่ไซต์งานเบิกสะสมตามโครงการจริง
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projectCostSummary.map((p) => {
                const mats = Object.keys(p.materials);

                return (
                  <div
                    key={p.name}
                    id={`project-card-${p.name}`}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-350 transition duration-300"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                            ไซต์งานก่อสร้าง
                          </span>
                          <h3 className="text-xs font-black text-slate-800 truncate" title={p.name}>
                            {p.name}
                          </h3>
                        </div>
                        <div className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-xl text-[10px] font-black border border-rose-100 flex-shrink-0">
                          เบิกใช้ {p.transCount} ครั้ง
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-between items-baseline">
                        <span className="text-[9px] uppercase font-bold text-slate-500">มูลค่ารวมพัสดุ:</span>
                        <strong className="text-sm font-black text-rose-600 font-mono">
                          {formatNumber(p.totalCost, 2)} <span className="text-[10px] font-normal text-rose-400">บาท</span>
                        </strong>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                          รายละเอียดแยกหมวดพัสดุ:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {mats.length > 0 ? (
                            mats.map((m) => (
                              <div
                                key={m}
                                className="flex justify-between items-center text-[10px] text-slate-600 bg-slate-50 border border-slate-100 rounded px-2 py-1"
                              >
                                <span className="font-bold flex items-center gap-1 truncate">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  {m}
                                </span>
                                <span className="font-mono font-extrabold text-slate-800">
                                  {formatNumber(p.materials[m], 0)} ฿
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-[10px] text-slate-400 italic col-span-2">
                              ยังไม่มีรายงานเบิกจ่ายพัสดุ
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                      <span>
                        ล่าสุด:{" "}
                        <strong className="text-slate-600 font-bold">
                          {p.latestDisbDate ? formatDateTh(p.latestDisbDate.toISOString().slice(0, 10)) : "-"}
                        </strong>
                      </span>
                      <button
                        onClick={() => onFilterDisbursementsByProject(p.name)}
                        className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>ดูตารางเบิกจ่าย</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
