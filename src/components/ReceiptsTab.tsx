/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { Search, Eye, FileSpreadsheet, PlusCircle, ArrowDownToLine } from "lucide-react";
import { Tank, Merchant, Receipt } from "../types";

interface ReceiptsTabProps {
  receipts: Receipt[];
  tanks: Tank[];
  merchants: Merchant[];
  onOpenForm: () => void;
  onOpenImport: () => void;
  onViewDetails: (id: string) => void;
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

export default function ReceiptsTab({
  receipts,
  tanks,
  merchants,
  onOpenForm,
  onOpenImport,
  onViewDetails,
}: ReceiptsTabProps) {
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [merchantFilter, setMerchantFilter] = useState("all");

  const filteredReceipts = useMemo(() => {
    const list = receipts.filter((r) => {
      const matchSearch =
        String(r.IDรายการ || "").toLowerCase().includes(search.toLowerCase()) ||
        String(r["เลขที่ใบสั่งชื้อ (PO)"] || "").toLowerCase().includes(search.toLowerCase()) ||
        String(r.โครงการ || "").toLowerCase().includes(search.toLowerCase()) ||
        String(r.เลขที่ใบส่งสินค้า || "").toLowerCase().includes(search.toLowerCase());

      const matchProduct = productFilter === "all" || r["ชื่อสินค้า (คลัง)"] === productFilter;
      const matchMerchant = merchantFilter === "all" || r.ร้านค้า === merchantFilter;

      return matchSearch && matchProduct && matchMerchant;
    });

    // Sort by Date Descending
    return list.sort((a, b) => new Date(b.วันที่รับเข้า).getTime() - new Date(a.วันที่รับเข้า).getTime());
  }, [receipts, search, productFilter, merchantFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Receipts Top Summary Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center">
            <ArrowDownToLine className="w-5 h-5 mr-2 text-indigo-600" />
            <span>ประวัติรายงานการรับเข้าคลังวัสดุ (Receipts)</span>
          </h2>
          <p className="text-xs text-slate-500">
            ระบบตรวจสอบ คีย์จัดหา และนำเข้าชุดเอกสารพัสดุยางมะตอยและเชื้อเพลิงอย่างเป็นระบบ
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
            className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/15 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>บันทึกการรับเข้า</span>
          </button>
        </div>
      </div>

      {/* Searching & Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="ค้นหา PO / บิล / โครงการ / ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">คลังสินค้าปลายทางทั้งหมด</option>
            {tanks.map((t) => (
              <option key={t.IDถัง} value={t["ชื่อคลัง/ถังเก็บ"]}>
                {t["ชื่อคลัง/ถังเก็บ"]}
              </option>
            ))}
          </select>
          <select
            value={merchantFilter}
            onChange={(e) => setMerchantFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">คู่ค้าจัดหาพัสดุทั้งหมด</option>
            {merchants.map((m) => (
              <option key={m.IDผู้ค้า} value={m["ชื่อร้านค้า/ผู้ให้บริการ"]}>
                {m["ชื่อร้านค้า/ผู้ให้บริการ"]}
              </option>
            ))}
          </select>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4 whitespace-nowrap">วันที่รับเข้า</th>
                <th className="py-3.5 px-4 whitespace-nowrap">ID รายการ / PO</th>
                <th className="py-3.5 px-4">ร้านคู่ค้าจัดส่ง</th>
                <th className="py-3.5 px-4">ถังพัสดุรับเข้า</th>
                <th className="py-3.5 px-4 text-right">จำนวนจัดซื้อ</th>
                <th className="py-3.5 px-4 text-right">มูลค่ารวม (บาท)</th>
                <th className="py-3.5 px-4">โครงการ</th>
                <th className="py-3.5 px-4 text-center">สถานะบิล</th>
                <th className="py-3.5 px-4 text-center">ดูและตรวจสอบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((r) => {
                  let badge = "";
                  if (r.สถานะ === "รอตรวจสอบ") {
                    badge = "bg-amber-50 text-amber-700 border-amber-200";
                  } else if (r.สถานะ === "อนุมัติแล้ว") {
                    badge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  } else {
                    badge = "bg-rose-50 text-rose-700 border-rose-200";
                  }

                  return (
                    <tr key={r.IDรายการ} className="hover:bg-slate-50/60 transition border-b border-slate-100">
                      <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateTh(r.วันที่รับเข้า)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="block font-black text-slate-900">{r.IDรายการ}</span>
                        <span className="text-[9px] text-slate-400 font-bold font-mono">
                          PO: {r["เลขที่ใบสั่งชื้อ (PO)"] || "-"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">{r.ร้านค้า}</td>
                      <td className="py-3.5 px-4 text-slate-800">{r["ชื่อสินค้า (คลัง)"]}</td>
                      <td className="py-3.5 px-4 text-right font-black text-indigo-650 font-mono">
                        {formatNumber(r.จำนวนที่ซื้อ, 2)} {r.หน่วยนับ}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 font-mono">
                        {formatNumber(r.มูลค่ารวม, 2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-[130px] truncate" title={r.โครงการ}>
                        {r.โครงการ}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badge}`}>
                          {r.สถานะ === "รอตรวจสอบ" ? "⏳ รอตรวจสอบ" : r.สถานะ === "อนุมัติแล้ว" ? "✅ อนุมัติแล้ว" : "❌ ปฏิเสธ"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onViewDetails(r.IDรายการ)}
                          className="text-indigo-600 hover:text-indigo-900 font-extrabold border border-indigo-150 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition duration-150 inline-flex items-center space-x-1 cursor-pointer"
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
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-medium">
                    ไม่พบรายการรับวัสดุพัสดุที่สอดคล้องกับพารามิเตอร์ค้าหา
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
