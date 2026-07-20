/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { Search, Eye, FileSpreadsheet, PlusCircle, ArrowUpFromLine } from "lucide-react";
import { Tank, Project, Disbursement } from "../types";

interface DisbursementsTabProps {
  disbursements: Disbursement[];
  tanks: Tank[];
  projects: Project[];
  onOpenForm: () => void;
  onOpenImport: () => void;
  onViewDetails: (id: string) => void;
  filterProject: string;
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

export default function DisbursementsTab({
  disbursements,
  tanks,
  projects,
  onOpenForm,
  onOpenImport,
  onViewDetails,
  filterProject,
}: DisbursementsTabProps) {
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState(filterProject || "all");

  // Keep project filter updated if changed outside
  useMemo(() => {
    if (filterProject) {
      setProjectFilter(filterProject);
    }
  }, [filterProject]);

  const filteredDisbursements = useMemo(() => {
    const list = disbursements.filter((d) => {
      const matchSearch =
        String(d["ผู้เบิก/คนขับ"] || "").toLowerCase().includes(search.toLowerCase()) ||
        String(d.ทะเบียน || "").toLowerCase().includes(search.toLowerCase()) ||
        String(d.ผู้บันทึก || "").toLowerCase().includes(search.toLowerCase()) ||
        String(d.IDรายการ || "").toLowerCase().includes(search.toLowerCase());

      const matchProduct = productFilter === "all" || d["ชื่อสินค้า (คลัง)"] === productFilter;
      const matchProject = projectFilter === "all" || d.โครงการ === projectFilter;

      return matchSearch && matchProduct && matchProject;
    });

    // Sort by Date Descending, then ID Descending as fallback
    return list.sort((a, b) => {
      const timeA = new Date(a.วันที่ || 0).getTime();
      const timeB = new Date(b.วันที่ || 0).getTime();
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return String(b.IDรายการ || "").localeCompare(String(a.IDรายการ || ""), undefined, { numeric: true, sensitivity: "base" });
    });
  }, [disbursements, search, productFilter, projectFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center">
            <ArrowUpFromLine className="w-5 h-5 mr-2 text-amber-600" />
            <span>ประวัติรายงานการเบิกจ่ายพัสดุและน้ำมัน (Disbursements)</span>
          </h2>
          <p className="text-xs text-slate-500">
            ระบบตรวจสอบการจ่ายพัสดุ หักสิทธิ์โควตาสต๊อกแคมป์ก่อสร้างจริง และควบคุมสิทธิ์พนักงานขับรถ
          </p>
        </div>
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenImport}
            className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/15 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>นำเข้าจาก CSV</span>
          </button>
          <button
            onClick={onOpenForm}
            className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/15 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ลงบันทึกการเบิกจ่าย</span>
          </button>
        </div>
      </div>

      {/* Searching & Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="ค้นหา ทะเบียนรถ / คนขับ / ผู้บันทึก / ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">คลังสิทธิ์ตัดจ่ายทั้งหมด</option>
            {tanks.map((t) => (
              <option key={t.IDถัง} value={t["ชื่อคลัง/ถังเก็บ"]}>
                {t["ชื่อคลัง/ถังเก็บ"]}
              </option>
            ))}
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">โครงการก่อสร้างทั้งหมด</option>
            {projects.map((p, idx) => (
              <option key={idx} value={p["ชื่อโครงการ/ไซต์งาน"]}>
                {p["ชื่อโครงการ/ไซต์งาน"]}
              </option>
            ))}
          </select>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4 whitespace-nowrap">วันที่เบิก</th>
                <th className="py-3.5 px-4 whitespace-nowrap">ID รายการเบิก</th>
                <th className="py-3.5 px-4">สินค้าคลังที่ตัดจ่าย</th>
                <th className="py-3.5 px-4 text-right">จำนวนที่จ่าย</th>
                <th className="py-3.5 px-4 text-right">มูลค่ารวม (บาท)</th>
                <th className="py-3.5 px-4">พนักงานขับรถ/ผู้เบิก</th>
                <th className="py-3.5 px-4">ทะเบียน/เบอร์รถ</th>
                <th className="py-3.5 px-4">โครงการปลายทาง</th>
                <th className="py-3.5 px-4 text-center">สถานะเบิก</th>
                <th className="py-3.5 px-4 text-center">ดูและตรวจสอบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {filteredDisbursements.length > 0 ? (
                filteredDisbursements.map((d) => {
                  let badge = "";
                  if (d.status === "รอตรวจสอบ" || d.สถานะ === "รอตรวจสอบ") {
                    badge = "bg-amber-50 text-amber-700 border-amber-200";
                  } else if (d.status === "อนุมัติแล้ว" || d.สถานะ === "อนุมัติแล้ว") {
                    badge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  } else {
                    badge = "bg-rose-50 text-rose-700 border-rose-200";
                  }

                  return (
                    <tr key={d.IDรายการ} className="hover:bg-slate-50/60 transition border-b border-slate-100">
                      <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateTh(d.วันที่)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {d.IDรายการ}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">{d["ชื่อสินค้า (คลัง)"]}</td>
                      <td className="py-3.5 px-4 text-right font-black text-amber-600 font-mono">
                        {formatNumber(d.จำนวนที่จ่าย, 2)} {d.หน่วยนับ}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono">
                        {formatNumber(d.มูลค่ารวม, 2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-850">{d["ผู้เบิก/คนขับ"]}</td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-[120px] truncate" title={d.ทะเบียน}>
                        {d.ทะเบียน || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-[140px] truncate" title={d.โครงการ}>
                        {d.โครงการ}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badge}`}>
                          {d.สถานะ === "รอตรวจสอบ" ? "⏳ รอตรวจสอบ" : d.สถานะ === "อนุมัติแล้ว" ? "✅ อนุมัติแล้ว" : "❌ ปฏิเสธ"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onViewDetails(d.IDรายการ)}
                          className="text-amber-700 hover:text-amber-950 font-extrabold border border-amber-250 hover:bg-amber-50 px-3 py-1.5 rounded-xl transition duration-150 inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ดูเอกสาร</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400 font-medium">
                    ไม่พบรายงานเบิกจ่ายพัสดุที่ตรงกับข้อมูลค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
