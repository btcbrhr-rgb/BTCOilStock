/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ArrowDownToLine, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Tank, Merchant, Project, User, Receipt } from "../types";

interface ReceiptModalProps {
  show: boolean;
  editMode: boolean;
  editingReceipt: Receipt | null;
  tanks: Tank[];
  merchants: Merchant[];
  projects: Project[];
  users: User[];
  currentUser: User | null;
  onClose: () => void;
  onSubmit: (data: Receipt) => void;
  generateNextId: () => string;
}

function formatNumber(num: number, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return "0.00";
  return Number(num).toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function ReceiptModal({
  show,
  editMode,
  editingReceipt,
  tanks,
  merchants,
  projects,
  users,
  currentUser,
  onClose,
  onSubmit,
  generateNextId,
}: ReceiptModalProps) {
  const [id, setId] = useState("");
  const [date, setDate] = useState("");
  const [merchant, setMerchant] = useState("");
  const [tankId, setTankId] = useState("");
  const [po, setPo] = useState("");
  const [delivery, setDelivery] = useState("");
  const [category, setCategory] = useState("");
  const [qty, setQty] = useState<number | "">("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [otherCost, setOtherCost] = useState<number | "">("");
  const [project, setProject] = useState("");
  const [deliveryPlace, setDeliveryPlace] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [checker, setChecker] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (show) {
      if (editMode && editingReceipt) {
        setId(editingReceipt.IDรายการ);
        setDate(editingReceipt.วันที่รับเข้า);
        setMerchant(editingReceipt.ร้านค้า);
        
        const matchedTank = tanks.find((t) => t["ชื่อคลัง/ถังเก็บ"] === editingReceipt["ชื่อสินค้า (คลัง)"]);
        setTankId(matchedTank ? matchedTank.IDถัง : "");
        
        setPo(editingReceipt["เลขที่ใบสั่งชื้อ (PO)"] || "");
        setDelivery(editingReceipt.เลขที่ใบส่งสินค้า || "");
        setCategory(editingReceipt.ประเภทวัสดุ);
        setQty(editingReceipt.จำนวนที่ซื้อ);
        setUnit(editingReceipt.หน่วยนับ);
        setPrice(editingReceipt.ราคา);
        setOtherCost(editingReceipt.ต้นทุนอื่นๆ || 0);
        setProject(editingReceipt.โครงการ);
        setDeliveryPlace(editingReceipt.สถานที่ส่ง || "");
        setDueDate(editingReceipt.วันที่ครบกำหนดจ่าย || "");
        setPaymentDate(editingReceipt.วันที่จ่าย || "");
        setChecker(editingReceipt.ผู้ตรวจสอบ || "");
        setNotes(editingReceipt.หมายเหตุ || "");
      } else {
        setId(generateNextId());
        setDate(new Date().toISOString().slice(0, 10));
        setMerchant("");
        setTankId("");
        setPo("");
        setDelivery("");
        setCategory("");
        setQty("");
        setUnit("");
        setPrice("");
        setOtherCost(0);
        setProject("");
        setDeliveryPlace("");
        setDueDate("");
        setPaymentDate("");
        setChecker("");
        setNotes("");
      }
    }
  }, [show, editMode, editingReceipt, tanks]);

  const handleTankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTankId(val);
    const matched = tanks.find((t) => t.IDถัง === val);
    if (matched) {
      setUnit(matched.หน่วยนับ || "");
      setPrice(matched.ราคาน้ำมันอ้างอิง || 0);
      setCategory(matched.ประเภทวัสดุ || "ทั่วไป");
    }
  };

  const calculatedTotal = ((Number(qty) || 0) * (Number(price) || 0)) + (Number(otherCost) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedTank = tanks.find((t) => t.IDถัง === tankId);
    if (!matchedTank) return;

    const record: Receipt = {
      IDรายการ: id,
      วันที่รับเข้า: date,
      ร้านค้า: merchant,
      "ชื่อสินค้า (คลัง)": matchedTank["ชื่อคลัง/ถังเก็บ"],
      ประเภทวัสดุ: category || "ทั่วไป",
      ราคา: Number(price) || 0,
      หน่วยนับ: unit,
      จำนวนที่ซื้อ: Number(qty) || 0,
      ต้นทุนอื่นๆ: Number(otherCost) || 0,
      มูลค่ารวม: calculatedTotal,
      หมายเหตุ: notes,
      โครงการ: project,
      "เลขที่ใบสั่งชื้อ (PO)": po,
      เลขที่ใบส่งสินค้า: delivery,
      สถานที่ส่ง: deliveryPlace,
      วันที่ครบกำหนดจ่าย: dueDate,
      วันที่จ่าย: paymentDate,
      ผู้บันทึก: editMode && editingReceipt ? editingReceipt.ผู้บันทึก : (currentUser ? currentUser.Name : ""),
      ผู้ตรวจสอบ: checker,
      สถานะ: editMode && editingReceipt ? editingReceipt.สถานะ : "รอตรวจสอบ",
    };

    onSubmit(record);
  };

  // Filter users to find checkers/approvers
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
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ArrowDownToLine className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black">
                  {editMode ? `แก้ไขบันทึกรับวัสดุเข้าคลัง (${id})` : "ลงบันทึกรับวัสดุเข้าคลังพัสดุ"}
                </h3>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Document Data */}
                <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-800 border-b pb-1.5 flex items-center space-x-1">
                    <span className="w-1.5 h-3 bg-indigo-500 rounded-full"></span>
                    <span>1. เอกสารการสั่งซื้อ & คู่ค้า</span>
                  </h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ID รายการ</label>
                    <input
                      type="text"
                      readOnly
                      value={id}
                      className="w-full bg-slate-200 text-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">วันที่รับพัสดุเข้าคลัง</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ร้านค้า / คู่ค้า</label>
                    <select
                      required
                      value={merchant}
                      onChange={(e) => setMerchant(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="" disabled>-- เลือกผู้ค้าจัดซื้อ --</option>
                      {merchants.map((m) => (
                        <option key={m.IDผู้ค้า} value={m["ชื่อร้านค้า/ผู้ให้บริการ"]}>
                          {m["ชื่อร้านค้า/ผู้ให้บริการ"]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">เลขที่ใบสั่งซื้อ (PO)</label>
                    <input
                      type="text"
                      placeholder="เช่น PO-2026-XXXX"
                      value={po}
                      onChange={(e) => setPo(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">เลขที่บิล / ใบส่งของ</label>
                    <input
                      type="text"
                      placeholder="เช่น DO-XXXXXX"
                      value={delivery}
                      onChange={(e) => setDelivery(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* 2. Warehouse Cost */}
                <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-800 border-b pb-1.5 flex items-center space-x-1">
                    <span className="w-1.5 h-3 bg-indigo-500 rounded-full"></span>
                    <span>2. ข้อมูลพัสดุ & ราคากลาง</span>
                  </h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">เลือกถังเก็บ/สิทธิ์คลังปลายทาง</label>
                    <select
                      required
                      value={tankId}
                      onChange={handleTankChange}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="" disabled>-- เลือกถังคลัง --</option>
                      {tanks.map((t) => (
                        <option key={t.IDถัง} value={t.IDถัง}>
                          {t["ชื่อคลัง/ถังเก็บ"]} ({t.ประเภทวัสดุ})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ประเภทวัสดุวัสดุ</label>
                    <input
                      type="text"
                      readOnly
                      placeholder="ดึงจากถังเก็บระบบอัตโนมัติ"
                      value={category}
                      className="w-full bg-slate-200 text-slate-600 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none border"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">จำนวนที่ซื้อ</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={qty}
                        onChange={(e) => setQty(e.target.value === "" ? "" : parseFloat(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-black bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">หน่วยนับ</label>
                      <input
                        type="text"
                        readOnly
                        value={unit}
                        className="w-full bg-slate-200 text-slate-600 rounded-xl px-3 py-2 text-xs focus:outline-none border font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ราคาต่อหน่วย (บาท)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ค่าขนส่ง/บริการอื่น</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={otherCost}
                        onChange={(e) => setOtherCost(e.target.value === "" ? "" : parseFloat(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-2xl">
                    <span className="block text-[10px] font-bold text-indigo-700">ราคามูลค่าสุทธิสุทธิ (บาท):</span>
                    <span className="text-lg font-black text-indigo-900 font-mono">
                      {formatNumber(calculatedTotal, 2)}
                    </span>
                  </div>
                </div>

                {/* 3. Site and Checker */}
                <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-800 border-b pb-1.5 flex items-center space-x-1">
                    <span className="w-1.5 h-3 bg-indigo-500 rounded-full"></span>
                    <span>3. โครงการปลายทาง & ตรวจสอบ</span>
                  </h4>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">ไซต์โครงการที่ใช้</label>
                    <select
                      required
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="" disabled>-- เลือกโครงการก่อสร้าง --</option>
                      {projects.map((p, idx) => (
                        <option key={idx} value={p["ชื่อโครงการ/ไซต์งาน"]}>
                          {p["ชื่อโครงการ/ไซต์งาน"]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">จุดจัดส่งวัสดุจริง</label>
                    <input
                      type="text"
                      placeholder="ระบุชื่อไซต์งาน แคมป์เก็บย่อย"
                      value={deliveryPlace}
                      onChange={(e) => setDeliveryPlace(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">กำหนดชำระเงิน</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">วันที่จ่ายจริง</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">เสมียนบันทึก</label>
                      <input
                        type="text"
                        readOnly
                        value={editMode && editingReceipt ? editingReceipt.ผู้บันทึก : (currentUser ? currentUser.Name : "")}
                        className="w-full bg-slate-150 text-slate-500 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ผู้ตรวจสอบหลัก</label>
                      <select
                        value={checker}
                        onChange={(e) => setChecker(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
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
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">รายละเอียดเพิ่มเติม</label>
                    <textarea
                      rows={2}
                      placeholder="ใส่รายละเอียดสำคัญประกอบบิลรับพัสดุ..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                    />
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
                  className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl font-black shadow-md cursor-pointer transition"
                >
                  {editMode ? "บันทึกการแก้ไขข้อมูล" : "ลงทะเบียนจัดเก็บพัสดุ"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
