/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FileText, Package, MapPin, Database, Truck, RotateCcw, CheckSquare, XSquare, Edit, Trash2, X, Info, History, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Receipt, Disbursement, User } from "../types";

interface DetailModalProps {
  show: boolean;
  type: "receipt" | "disbursement";
  record: any | null; // Receipt or Disbursement
  currentUser: User | null;
  onClose: () => void;
  onVerify: (status: "อนุมัติแล้ว" | "ไม่อนุมัติ") => void;
  onResetVerify: () => void;
  onOpenEdit: (id: string) => void;
  onDelete: (id: string) => void;
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

function formatDateTimeTh(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  let year = d.getFullYear();
  if (year < 2400) year += 543;
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} น.`;
}

export default function DetailModal({
  show,
  type,
  record,
  currentUser,
  onClose,
  onVerify,
  onResetVerify,
  onOpenEdit,
  onDelete,
}: DetailModalProps) {
  if (!record) return null;

  const isReceipt = type === "receipt";
  const r = record as Receipt;
  const d = record as Disbursement;

  const currentStatus = record.สถานะ || "รอตรวจสอบ";
  const isVerified = currentStatus === "อนุมัติแล้ว" || currentStatus === "ไม่อนุมัติ";
  const isApproverRole = currentUser?.Role === "ผู้ดูแลระบบสูงสุด" || currentUser?.Role === "ผู้ตรวจสอบ";

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
              <h3 className="text-sm font-black">
                {isReceipt ? `รายละเอียดบิลจัดหาเข้าคลัง: ${r.IDรายการ}` : `รายละเอียดใบเบิกจ่ายพัสดุ: ${d.IDรายการ}`}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Main Info Blocks */}
              <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-4 text-xs font-semibold text-slate-700">
                {isReceipt ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Block 1 */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-slate-800 border-b pb-1.5 flex items-center space-x-1.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>1. ข้อมูลบิล & เอกสารคู่ค้า</span>
                      </h4>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">ID รายการ</span>
                        <span className="font-mono font-black text-slate-900 text-sm">{r.IDรายการ}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">วันที่จัดรับเข้า</span>
                        <span className="font-bold text-slate-900">{formatDateTh(r.วันที่รับเข้า)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">ผู้ค้าจัดหา</span>
                        <span className="font-bold text-slate-900">{r.ร้านค้า || "-"}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">เลขที่สั่งซื้อ (PO)</span>
                        <span className="font-mono font-bold text-slate-900 text-xs">{r["เลขที่ใบสั่งชื้อ (PO)"] || "-"}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">เลขที่บิลส่งสินค้า</span>
                        <span className="font-mono font-bold text-slate-900 text-xs">{r.เลขที่ใบส่งสินค้า || "-"}</span>
                      </div>
                    </div>

                    {/* Block 2 */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-slate-800 border-b pb-1.5 flex items-center space-x-1.5">
                        <Package className="w-4 h-4 text-indigo-600" />
                        <span>2. หมวดวัสดุ & มูลค่าสุทธิ</span>
                      </h4>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">ชื่อคลังจัดเก็บปลายทาง</span>
                        <span className="font-bold text-slate-900">{r["ชื่อสินค้า (คลัง)"]}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">หมวดหมู่</span>
                        <span className="font-bold text-slate-900">{r.ประเภทวัสดุ}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">จำนวนที่รับเข้า</span>
                          <span className="font-mono font-black text-slate-900">{formatNumber(r.จำนวนที่ซื้อ, 2)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">หน่วยนับ</span>
                          <span className="font-bold text-slate-900">{r.หน่วยนับ}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">ราคาซื้อเฉลี่ย</span>
                          <span className="font-mono font-bold text-slate-900">{formatNumber(r.ราคา, 2)} ฿</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">ค่าบริการอื่นๆ</span>
                          <span className="font-mono font-bold text-slate-900">{formatNumber(r.ต้นทุนอื่นๆ, 2)} ฿</span>
                        </div>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl">
                        <span className="block text-[9px] font-bold text-indigo-700">ราคาสุทธิจัดหากลาง:</span>
                        <span className="text-sm font-black text-indigo-900 font-mono">
                          {formatNumber(r.มูลค่ารวม, 2)} บาท
                        </span>
                      </div>
                    </div>

                    {/* Block 3 */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-slate-800 border-b pb-1.5 flex items-center space-x-1.5">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span>3. ปลายทางโครงการ & บันทึก</span>
                      </h4>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">แคมป์โครงการปลายทาง</span>
                        <span className="font-bold text-slate-900">{r.โครงการ}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">สถานที่ส่งรับจริง</span>
                        <span className="font-bold text-slate-900">{r.สถานที่ส่ง || "-"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">ดิวชำระเงิน</span>
                          <span className="font-bold text-slate-900">{r.วันที่ครบกำหนดจ่าย ? formatDateTh(r.วันที่ครบกำหนดจ่าย) : "-"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">จ่ายจริงเมื่อ</span>
                          <span className="font-bold text-slate-900">{r.วันที่จ่าย ? formatDateTh(r.วันที่จ่าย) : "-"}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">เสมียนผู้คีย์</span>
                          <span className="font-bold text-slate-700">{r.ผู้บันทึก}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">วิศวกรผู้เช็คสิทธิ์</span>
                          <span className="font-bold text-slate-700">{r.ผู้ตรวจสอบ || "-"}</span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">บันทึกเพิ่มเติม</span>
                        <span className="font-medium text-slate-600 block max-h-16 overflow-y-auto bg-white p-2 border border-slate-100 rounded-lg">
                          {r.หมายเหตุ || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Disbursement Left */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-slate-800 border-b pb-1.5 flex items-center space-x-1.5">
                        <Database className="w-4 h-4 text-amber-600" />
                        <span>1. ข้อมูลบัญชีตัดจ่ายสิทธิ์คลัง</span>
                      </h4>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">ID รายการเบิกจ่าย</span>
                        <span className="font-mono font-black text-slate-900 text-sm">{d.IDรายการ}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">ตัดจ่ายพัสดุจากคลังถัง</span>
                        <span className="font-bold text-slate-900">{d["ชื่อสินค้า (คลัง)"]}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">ราคากลางอ้างอิง</span>
                          <span className="font-mono font-bold text-slate-900">{formatNumber(d.ราคา, 2)} ฿</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">หน่วยนับ</span>
                          <span className="font-bold text-slate-900">{d.หน่วยนับ}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-amber-500/10 border border-amber-200 p-2.5 rounded-xl">
                        <div>
                          <span className="block text-[9px] font-black text-amber-800 uppercase">จำนวนที่เบิกเบิก</span>
                          <span className="font-mono font-black text-slate-900 text-sm">{formatNumber(d.จำนวนที่จ่าย, 2)}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-black text-amber-800 uppercase">ยอดประเมินรวมสุทธิ</span>
                          <span className="font-mono font-black text-slate-950 text-sm">{formatNumber(d.มูลค่ารวม, 2)} ฿</span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">หมายเหตุวัตถุประสงค์เบิก</span>
                        <span className="font-medium text-slate-600 block max-h-20 overflow-y-auto bg-white p-2 border border-slate-100 rounded-lg">
                          {d.หมายเหตุ || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Disbursement Right */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-xs font-black text-slate-800 border-b pb-1.5 flex items-center space-x-1.5">
                        <Truck className="w-4 h-4 text-amber-600" />
                        <span>2. ข้อมูลพนักงานขับขี่ & ยานพาหนะ</span>
                      </h4>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">วันที่เริ่มดึงเบิก</span>
                        <span className="font-bold text-slate-900">{formatDateTh(d.วันที่)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">ทะเบียนรถ / เบอร์จักรกล</span>
                        <span className="font-bold text-slate-900 text-sm">{d.ทะเบียน || "-"}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">คนขับผู้เบิกสิทธิ์</span>
                        <span className="font-bold text-slate-900">{d["ผู้เบิก/คนขับ"]}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase">แคมป์งานปลายทาง</span>
                        <span className="font-bold text-slate-900">{d.โครงการ}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">พนักงานบันทึกคลัง</span>
                          <span className="font-bold text-slate-700">{d.ผู้บันทึก}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">วิศวกรผู้เช็คสิทธิ์</span>
                          <span className="font-bold text-slate-700">{d.ผู้ตรวจสอบ || "-"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit Log / History Track Section */}
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black text-slate-800 flex items-center space-x-1.5 border-b border-slate-200 pb-1.5">
                    <History className="w-4 h-4 text-indigo-600" />
                    <span>ประวัติบันทึกและตรวจสอบเอกสาร (System Audit Trail)</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                    {/* Created Log */}
                    <div className="flex items-start space-x-2.5">
                      <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="block font-black text-slate-500 uppercase tracking-wide text-[9px]">ผู้สร้างเอกสารเริ่มต้น</span>
                        <span className="font-bold text-slate-800">
                          {record.createdBy || record.ผู้บันทึก || "ระบบอัตโนมัติ"}
                        </span>
                        <span className="block text-slate-400 mt-0.5 text-[10px]">
                          เมื่อ {record.createdAt ? formatDateTimeTh(record.createdAt) : formatDateTh(isReceipt ? r.วันที่รับเข้า : d.วันที่)}
                        </span>
                      </div>
                    </div>

                    {/* Updated Log */}
                    <div className="flex items-start space-x-2.5 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                      <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
                        <Edit className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="block font-black text-slate-500 uppercase tracking-wide text-[9px]">ปรับปรุงล่าสุดโดย</span>
                        <span className="font-bold text-slate-800">
                          {record.updatedBy ? record.updatedBy : (record.createdBy || record.ผู้บันทึก || "ระบบอัตโนมัติ")}
                        </span>
                        <span className="block text-slate-400 mt-0.5 text-[10px]">
                          เมื่อ {record.updatedAt ? formatDateTimeTh(record.updatedAt) : "ยังไม่มีการแก้ไขหลังจากคีย์ตั้งต้น"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Status Trace */}
                  {record.สถานะ && (
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-bold">สถานะความถูกต้อง:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-black text-[10px] ${
                        record.สถานะ === "อนุมัติแล้ว"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : record.สถานะ === "ไม่อนุมัติ"
                          ? "bg-rose-50 text-rose-750 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        ● {record.สถานะ} {record.ผู้ตรวจสอบ ? `(โดย ${record.ผู้ตรวจสอบ})` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Warning Panel */}
              {isVerified && (
                <div className="p-3.5 bg-amber-50 border border-amber-250 text-amber-900 rounded-2xl text-xs flex items-start space-x-2.5">
                  <Info className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-black">สัญลักษณ์ตรวจสอบเสร็จสิ้น: ล็อกสถานะความปลอดภัย</p>
                    <p className="text-[10px] text-amber-700 mt-1 font-medium leading-relaxed">
                      เอกสารฉบับนี้ได้รับการลงนามความถูกต้องเป็นที่เรียบร้อย ปริมาณพัสดุในคลังได้รับปรับสมดุลคงคลังตามบัญชีจริงแล้ว
                      หากต้องการทำการ **แก้ไข** หรือ **ลบรายการ** กรุณาแจ้งผู้ตรวจสอบสิทธิ์โครงการ (Inspector / Admin) เพื่อทำการกดปลดล็อกก่อน
                    </p>
                  </div>
                </div>
              )}

              {/* Action Panels */}
              <div className="border-t border-slate-150 pt-4 space-y-3.5">
                <h4 className="text-xs font-black text-slate-900 flex items-center">
                  <span className="w-1.5 h-3.5 bg-slate-900 rounded-full mr-2"></span>
                  แผงควบคุมและประมวลผลคำสั่ง (Execution Actions Panel)
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {isVerified ? (
                    isApproverRole ? (
                      <button
                        onClick={onResetVerify}
                        className="col-span-2 bg-slate-200 hover:bg-slate-350 text-slate-750 font-black py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-slate-300 transition cursor-pointer"
                      >
                        <RotateCcw className="w-4.5 h-4.5 text-slate-600" />
                        <span>ยกเลิกการเช็คสิทธิ์ (Reset Verification Code)</span>
                      </button>
                    ) : (
                      <div className="col-span-2 text-center text-[11px] text-slate-450 font-extrabold bg-slate-100 py-3 rounded-xl border border-dashed">
                        🔒 ปิดสิทธิ์ประมวลผล: รายการถูกเซ็นต์เช็คแล้ว และสิทธิ์พนักงาน Operator ไม่สามารถปลดล็อกได้
                      </div>
                    )
                  ) : isApproverRole ? (
                    <>
                      <button
                        onClick={() => onVerify("อนุมัติแล้ว")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-md shadow-emerald-600/10 cursor-pointer"
                      >
                        <CheckSquare className="w-4.5 h-4.5" />
                        <span>ตรวจสอบอนุมัติสมดุลคงคลัง</span>
                      </button>
                      <button
                        onClick={() => onVerify("ไม่อนุมัติ")}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition shadow-md shadow-rose-600/10 cursor-pointer"
                      >
                        <XSquare className="w-4.5 h-4.5" />
                        <span>ปฏิเสธคำขอเบิกสิทธิ์พัสดุ</span>
                      </button>
                    </>
                  ) : (
                    <div className="col-span-2 text-center text-[11px] text-indigo-700 bg-indigo-50/70 border border-indigo-150 py-3 rounded-xl font-extrabold">
                      ⏳ รายการคีย์เสร็จสิ้น: รอวิศวกรผู้เช็คสิทธิ์ (Inspector) เซ็นลงนามเพื่อหักดุลสต๊อกอย่างเป็นทางการ
                    </div>
                  )}

                  {/* Operator Action Buttons (Only allowed if unlocked) */}
                  {!isVerified ? (
                    <>
                      <button
                        onClick={() => onOpenEdit(record.IDรายการ)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-750 border border-indigo-200 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                        <span>แก้ไขข้อมูลพัสดุ</span>
                      </button>
                      {isApproverRole ? (
                        <button
                          onClick={() => onDelete(record.IDรายการ)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-750 border border-rose-200 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>สั่งลบรายการใบงาน</span>
                        </button>
                      ) : (
                        <div className="text-center text-[10px] text-slate-400 flex items-center justify-center border border-dashed rounded-xl px-2 py-1 bg-slate-50">
                          สิทธิ์เสมียนคลัง: ไม่สามารถสั่งลบเอกสารหลักได้
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
