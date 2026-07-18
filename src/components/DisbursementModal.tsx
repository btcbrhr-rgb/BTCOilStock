/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ArrowUpFromLine, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Tank, Vehicle, Project, User, Disbursement } from "../types";

interface DisbursementModalProps {
  show: boolean;
  editMode: boolean;
  editingDisbursement: Disbursement | null;
  tanks: Tank[];
  vehicles: Vehicle[];
  projects: Project[];
  users: User[];
  currentUser: User | null;
  onClose: () => void;
  onSubmit: (data: Disbursement) => void;
  generateNextId: () => string;
}

export default function DisbursementModal({
  show,
  editMode,
  editingDisbursement,
  tanks,
  vehicles,
  projects,
  users,
  currentUser,
  onClose,
  onSubmit,
  generateNextId,
}: DisbursementModalProps) {
  const [id, setId] = useState("");
  const [date, setDate] = useState("");
  const [tankId, setTankId] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [driver, setDriver] = useState("");
  const [project, setProject] = useState("");
  const [checker, setChecker] = useState("");

  useEffect(() => {
    if (show) {
      if (editMode && editingDisbursement) {
        setId(editingDisbursement.IDรายการ);
        setDate(editingDisbursement.วันที่);
        
        const matchedTank = tanks.find((t) => t["ชื่อคลัง/ถังเก็บ"] === editingDisbursement["ชื่อสินค้า (คลัง)"]);
        setTankId(matchedTank ? matchedTank.IDถัง : "");
        
        setPrice(editingDisbursement.ราคา);
        setUnit(editingDisbursement.หน่วยนับ);
        setQty(editingDisbursement.จำนวนที่จ่าย);
        setNotes(editingDisbursement.หมายเหตุ || "");
        setVehiclePlate(editingDisbursement.ทะเบียน || "");
        setDriver(editingDisbursement["ผู้เบิก/คนขับ"] || "");
        setProject(editingDisbursement.โครงการ || "");
        setChecker(editingDisbursement.ผู้ตรวจสอบ || "");
      } else {
        setId(generateNextId());
        setDate(new Date().toISOString().slice(0, 10));
        setTankId("");
        setPrice("");
        setUnit("");
        setQty("");
        setNotes("");
        setVehiclePlate("");
        setDriver("");
        setProject("");
        setChecker("");
      }
    }
  }, [show, editMode, editingDisbursement, tanks]);

  const handleTankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTankId(val);
    const matched = tanks.find((t) => t.IDถัง === val);
    if (matched) {
      setPrice(matched.ราคาน้ำมันอ้างอิง || 0);
      setUnit(matched.หน่วยนับ || "");
    }
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setVehiclePlate(val);
    // Dynamic autofill of driver name
    const matched = vehicles.find((v) => v["ทะเบียน/รหัสเครื่องจักร"] === val.trim());
    if (matched) {
      setDriver(matched.พนักงานขับรถประจำคัน || "");
    }
  };

  const calculatedTotal = (Number(qty) || 0) * (Number(price) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedTank = tanks.find((t) => t.IDถัง === tankId);
    if (!matchedTank) return;

    const record: Disbursement = {
      IDรายการ: id,
      วันที่: date,
      "ชื่อสินค้า (คลัง)": matchedTank["ชื่อคลัง/ถังเก็บ"],
      ราคา: Number(price) || 0,
      หน่วยนับ: unit,
      จำนวนที่จ่าย: Number(qty) || 0,
      มูลค่ารวม: calculatedTotal,
      หมายเหตุ: notes,
      โครงการ: project,
      "ผู้เบิก/คนขับ": driver,
      ทะเบียน: vehiclePlate,
      ผู้บันทึก: editMode && editingDisbursement ? editingDisbursement.ผู้บันทึก : (currentUser ? currentUser.Name : ""),
      ผู้ตรวจสอบ: checker,
      สถานะ: editMode && editingDisbursement ? editingDisbursement.สถานะ : "รอตรวจสอบ",
    };

    onSubmit(record);
  };

  const checkers = users.filter(
    (u) => u.Role === "ผู้ดูแลระบบสูงสุด" || u.Role === "ผู้ตรวจสอบ"
  );

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-amber-500 text-slate-950 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ArrowUpFromLine className="w-5 h-5 text-slate-950" />
                <h3 className="text-sm font-black">
                  {editMode ? `แก้ไขใบเบิกจ่ายพัสดุ (${id})` : "ลงทะเบียนเบิกจ่ายตัดสิทธิ์โควตาสต๊อก"}
                </h3>
              </div>
              <button onClick={onClose} className="text-slate-900 hover:text-slate-950 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Warehouse calculations */}
                <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-800 border-b pb-1.5 flex items-center space-x-1">
                    <span className="w-1.5 h-3 bg-amber-500 rounded-full"></span>
                    <span>1. ข้อมูลตัดจ่ายสิทธิ์คงคลัง</span>
                  </h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ID รายการเบิกจ่าย</label>
                    <input
                      type="text"
                      readOnly
                      value={id}
                      className="w-full bg-slate-200 text-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ถังจัดเก็บ / บัตรเติมตัดพัสดุ</label>
                    <select
                      required
                      value={tankId}
                      onChange={handleTankChange}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="" disabled>-- เลือกถังเก็บตัดจ่าย --</option>
                      {tanks.map((t) => (
                        <option key={t.IDถัง} value={t.IDถัง}>
                          {t["ชื่อคลัง/ถังเก็บ"]} ({t.ประเภทวัสดุ})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ราคาน้ำมันอ้างอิง</label>
                      <input
                        type="number"
                        readOnly
                        value={price}
                        className="w-full bg-slate-200 text-slate-600 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">หน่วยนับ</label>
                      <input
                        type="text"
                        readOnly
                        value={unit}
                        className="w-full bg-slate-200 text-slate-600 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">จำนวนที่เบิกเบิก</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={qty}
                        onChange={(e) => setQty(e.target.value === "" ? "" : parseFloat(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-black bg-white text-slate-750 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ยอดมูลค่ารวมทั้งสิ้น</label>
                      <input
                        type="text"
                        readOnly
                        value={calculatedTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        className="w-full bg-slate-200 text-slate-600 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">บันทึกเพิ่มเติม / หมายเหตุ</label>
                    <textarea
                      rows={2}
                      placeholder="เช่น ขนส่งดิน แคมป์สาม..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Right Column: Driver & Vehicle */}
                <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-800 border-b pb-1.5 flex items-center space-x-1">
                    <span className="w-1.5 h-3 bg-amber-500 rounded-full"></span>
                    <span>2. ข้อมูลผู้เบิก & ทะเบียนรถ</span>
                  </h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">วันที่ทำรายการเบิก</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ทะเบียนรถ / รหัสเครื่องจักร</label>
                    <input
                      type="text"
                      required
                      list="vehicles-autocomplete"
                      placeholder="พิมพ์หรือเลือกทะเบียน เช่น 83-1234"
                      value={vehiclePlate}
                      onChange={handleVehicleChange}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-amber-500 font-bold"
                    />
                    <datalist id="vehicles-autocomplete">
                      {vehicles.map((v) => (
                        <option key={v.IDรถ} value={v["ทะเบียน/รหัสเครื่องจักร"]}>
                          {v.พนักงานขับรถประจำคัน ? `(คนขับหลัก: ${v.พนักงานขับรถประจำคัน})` : ""}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">พนักงานขับรถ / ผู้เบิก</label>
                    <input
                      type="text"
                      required
                      placeholder="ชื่อ-สกุลพนักงานขับขี่"
                      value={driver}
                      onChange={(e) => setDriver(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">แคมป์โครงการก่อสร้าง</label>
                    <select
                      required
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="" disabled>-- เลือกโครงการ --</option>
                      {projects.map((p, idx) => (
                        <option key={idx} value={p["ชื่อโครงการ/ไซต์งาน"]}>
                          {p["ชื่อโครงการ/ไซต์งาน"]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">พนักงานบันทึก</label>
                      <input
                        type="text"
                        readOnly
                        value={editMode && editingDisbursement ? editingDisbursement.ผู้บันทึก : (currentUser ? currentUser.Name : "")}
                        className="w-full bg-slate-150 text-slate-500 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">วิศวกรผู้ตรวจสอบสิทธิ์</label>
                      <select
                        value={checker}
                        onChange={(e) => setChecker(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">-- ไม่บังคับตรวจสอบ --</option>
                        {checkers.map((u, idx) => (
                          <option key={idx} value={u.Name}>
                            {u.Name} ({u.Role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t pt-4 border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-600 hover:text-slate-800 border px-4 py-2 rounded-xl font-bold cursor-pointer transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="text-xs text-slate-950 bg-amber-500 hover:bg-amber-600 px-5 py-2.5 rounded-xl font-black shadow-md cursor-pointer transition"
                >
                  {editMode ? "บันทึกการแก้ไขข้อมูล" : "ลงบันทึกเบิกพัสดุและน้ำมัน"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
