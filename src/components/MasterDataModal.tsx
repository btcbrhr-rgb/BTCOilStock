/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MasterDataType } from "../types";

interface MasterDataModalProps {
  show: boolean;
  subTab: MasterDataType;
  editIndex: number | null;
  activeData: any; // Pre-filled data in edit mode
  onClose: () => void;
  onSubmit: (data: any) => void;
  generateNextId: (subTab: MasterDataType) => string;
}

export default function MasterDataModal({
  show,
  subTab,
  editIndex,
  activeData,
  onClose,
  onSubmit,
  generateNextId,
}: MasterDataModalProps) {
  // We'll declare states for all possible form fields
  // Tanks Fields
  const [tankId, setTankId] = useState("");
  const [tankName, setTankName] = useState("");
  const [tankMaterial, setTankMaterial] = useState("");
  const [tankMax, setTankMax] = useState<number | "">("");
  const [tankCurrent, setTankCurrent] = useState<number | "">("");
  const [tankThreshold, setTankThreshold] = useState<number | "">("");
  const [tankPrice, setTankPrice] = useState<number | "">("");
  const [tankUnit, setTankUnit] = useState("");

  // Vehicles Fields
  const [vehicleId, setVehicleId] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleDriver, setVehicleDriver] = useState("");

  // Projects Fields
  const [projectName, setProjectName] = useState("");

  // Merchants Fields
  const [merchantId, setMerchantId] = useState("");
  const [merchantName, setMerchantName] = useState("");

  // Users Fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"ผู้ดูแลระบบสูงสุด" | "ผู้ตรวจสอบ" | "ผู้บันทึกข้อมูล">("ผู้บันทึกข้อมูล");

  useEffect(() => {
    if (show) {
      const editMode = editIndex !== null;
      if (subTab === "tanks") {
        setTankId(editMode ? activeData.IDถัง : generateNextId("tanks"));
        setTankName(editMode ? activeData["ชื่อคลัง/ถังเก็บ"] : "");
        setTankMaterial(editMode ? activeData.ประเภทวัสดุ : "");
        setTankMax(editMode ? activeData.ความจุสูงสุด : "");
        setTankCurrent(editMode ? activeData.ปริมาณคงเหลือปัจจุบัน : "");
        setTankThreshold(editMode ? activeData.เกณฑ์แจ้งเตือนต่ำวิกฤต : "");
        setTankPrice(editMode ? activeData.ราคาน้ำมันอ้างอิง : "");
        setTankUnit(editMode ? activeData.หน่วยนับ : "");
      } else if (subTab === "vehicles") {
        setVehicleId(editMode ? activeData.IDรถ : generateNextId("vehicles"));
        setVehiclePlate(editMode ? activeData["ทะเบียน/รหัสเครื่องจักร"] : "");
        setVehicleDriver(editMode ? activeData.พนักงานขับรถประจำคัน : "");
      } else if (subTab === "projects") {
        setProjectName(editMode ? activeData["ชื่อโครงการ/ไซต์งาน"] : "");
      } else if (subTab === "merchants") {
        setMerchantId(editMode ? activeData.IDผู้ค้า : generateNextId("merchants"));
        setMerchantName(editMode ? activeData["ชื่อร้านค้า/ผู้ให้บริการ"] : "");
      } else if (subTab === "users") {
        setUsername(editMode ? activeData.Username : "");
        setPassword(editMode ? activeData.Password || "" : "");
        setFullName(editMode ? activeData.Name : "");
        setRole(editMode ? activeData.Role : "ผู้บันทึกข้อมูล");
      }
    }
  }, [show, subTab, editIndex, activeData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let data: any = {};

    if (subTab === "tanks") {
      data = {
        IDถัง: tankId,
        "ชื่อคลัง/ถังเก็บ": tankName,
        ประเภทวัสดุ: tankMaterial,
        ความจุสูงสุด: Number(tankMax) || 0,
        ปริมาณคงเหลือปัจจุบัน: Number(tankCurrent) || 0,
        เกณฑ์แจ้งเตือนต่ำวิกฤต: Number(tankThreshold) || 0,
        ราคาน้ำมันอ้างอิง: Number(tankPrice) || 0,
        หน่วยนับ: tankUnit,
      };
    } else if (subTab === "vehicles") {
      data = {
        IDรถ: vehicleId,
        "ทะเบียน/รหัสเครื่องจักร": vehiclePlate,
        พนักงานขับรถประจำคัน: vehicleDriver,
      };
    } else if (subTab === "projects") {
      data = {
        "ชื่อโครงการ/ไซต์งาน": projectName,
      };
    } else if (subTab === "merchants") {
      data = {
        IDผู้ค้า: merchantId,
        "ชื่อร้านค้า/ผู้ให้บริการ": merchantName,
      };
    } else if (subTab === "users") {
      data = {
        Username: username,
        Password: password,
        Name: fullName,
        Role: role,
      };
    }

    onSubmit(data);
  };

  const getTitle = () => {
    const act = editIndex !== null ? "แก้ไข" : "เพิ่ม";
    switch (subTab) {
      case "tanks":
        return `${act}ข้อมูลถังจัดเก็บ / บัตรคลัง`;
      case "vehicles":
        return `${act}ข้อมูลรถและเครื่องจักร`;
      case "projects":
        return `${act}ข้อมูลโครงการ / ไซต์งาน`;
      case "merchants":
        return `${act}ข้อมูลผู้ส่งพัสดุคู่ค้า`;
      case "users":
        return `${act}บัญชีพนักงานเข้าระบบ`;
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-xs font-black">{getTitle()}</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-3.5">
                {subTab === "tanks" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ID ถังพัสดุ</label>
                      <input
                        type="text"
                        readOnly
                        value={tankId}
                        className="w-full bg-slate-200 text-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ชื่อเรียกถังจัดเก็บ / บัตรเติมเงิน</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น ถังดีเซล แคมป์ประโคนชัย"
                        value={tankName}
                        onChange={(e) => setTankName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ประเภทวัสดุผลิตภัณฑ์</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น น้ำมันดีเซลหมุนเร็ว, ยางมะตอย AC-20"
                        value={tankMaterial}
                        onChange={(e) => setTankMaterial(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">ความจุพิกัดสูงสุด</label>
                        <input
                          type="number"
                          required
                          placeholder="0.00"
                          value={tankMax}
                          onChange={(e) => setTankMax(e.target.value === "" ? "" : parseFloat(e.target.value))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">ปริมาณคงเหลือปัจจุบัน</label>
                        <input
                          type="number"
                          required
                          placeholder="0.00"
                          value={tankCurrent}
                          onChange={(e) => setTankCurrent(e.target.value === "" ? "" : parseFloat(e.target.value))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">เกณฑ์เตือนสต๊อกต่ำ</label>
                        <input
                          type="number"
                          required
                          placeholder="0.00"
                          value={tankThreshold}
                          onChange={(e) => setTankThreshold(e.target.value === "" ? "" : parseFloat(e.target.value))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500 font-bold font-mono text-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">ราคาน้ำมันอ้างอิง</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="0.00"
                          value={tankPrice}
                          onChange={(e) => setTankPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500 font-bold font-mono text-amber-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">หน่วยนับปริมาณ</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น ลิตร, กิโลกรัม, บาท"
                        value={tankUnit}
                        onChange={(e) => setTankUnit(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}

                {subTab === "vehicles" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ID รถในสังกัด</label>
                      <input
                        type="text"
                        readOnly
                        value={vehicleId}
                        className="w-full bg-slate-200 text-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ทะเบียนรถ / รหัสเครื่องจักร</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น 83-1234 บุรีรัมย์"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ชื่อพนักงานขับประจำการ</label>
                      <input
                        type="text"
                        placeholder="ระบุชื่อ-สกุลพนักงานขับรถประจำ"
                        value={vehicleDriver}
                        onChange={(e) => setVehicleDriver(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}

                {subTab === "projects" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ชื่อโครงการ / แคมป์ไซต์ก่อสร้าง</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น โครงการถนนสายหลัก บุรีรัมย์"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                  </>
                )}

                {subTab === "merchants" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ID ร้านค้าคู่ค้า</label>
                      <input
                        type="text"
                        readOnly
                        value={merchantId}
                        className="w-full bg-slate-200 text-slate-600 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ชื่อบริษัท / ร้านผู้จัดส่งพัสดุ</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น บจก. ปตท. พาร์ทเนอร์"
                        value={merchantName}
                        onChange={(e) => setMerchantName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                  </>
                )}

                {subTab === "users" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">บัญชีเข้าใช้งาน (Username)</label>
                      <input
                        type="text"
                        required
                        disabled={editIndex !== null}
                        placeholder="เช่น anucha.k"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500 font-bold disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">รหัสความปลอดภัย (Password)</label>
                      <input
                        type="password"
                        required
                        placeholder="ระบุรหัสผ่านของคุณ"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">ชื่อจริงพนักงาน (Full name)</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น นายอภิสิทธิ์ ใจกล้า"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">สิทธิ์ในการตรวจสอบข้อมูล (Role)</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-750 focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="ผู้บันทึกข้อมูล">ผู้บันทึกข้อมูล (Operator / เสมียนคลัง)</option>
                        <option value="ผู้ตรวจสอบ">ผู้ตรวจสอบ (Inspector / วิศวกรโครงการ)</option>
                        <option value="ผู้ดูแลระบบสูงสุด">ผู้ดูแลระบบสูงสุด (Administrator)</option>
                      </select>
                    </div>
                  </>
                )}
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
                  className="text-xs text-white bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-xl font-black shadow-md cursor-pointer transition"
                >
                  บันทึกข้อมูลแกนกลาง
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
