/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Settings2, Container, Truck, Building, Store, Users, Plus } from "lucide-react";
import { Tank, Vehicle, Project, Merchant, User, MasterDataType } from "../types";

interface MasterDataTabProps {
  tanks: Tank[];
  vehicles: Vehicle[];
  projects: Project[];
  merchants: Merchant[];
  users: User[];
  currentUser: User | null;
  onAdd: (subTab: MasterDataType) => void;
  onEdit: (subTab: MasterDataType, index: number) => void;
  onDelete: (subTab: MasterDataType, index: number) => void;
}

function formatNumber(num: number, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return "0.00";
  return Number(num).toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function MasterDataTab({
  tanks,
  vehicles,
  projects,
  merchants,
  users,
  currentUser,
  onAdd,
  onEdit,
  onDelete,
}: MasterDataTabProps) {
  const [subTab, setSubTab] = useState<MasterDataType>("tanks");

  const isOperator = currentUser?.Role === "ผู้บันทึกข้อมูล";

  const getSubTabTitle = () => {
    switch (subTab) {
      case "tanks":
        return "ตาราง: คลังจัดเก็บและบัตรเติมน้ำมัน (Tanks Registry)";
      case "vehicles":
        return "ตาราง: ทะเบียนรถและเครื่องจักรโครงการ (Vehicles Registry)";
      case "projects":
        return "ตาราง: รายชื่อโครงการและไซต์งานก่อสร้าง (Projects)";
      case "merchants":
        return "ตาราง: ทะเบียนผู้จัดส่งและร้านค้าคู่ค้า (Merchants)";
      case "users":
        return "ตาราง: บัญชีพนักงานและสิทธิ์ผู้ใช้งาน (Users Registry)";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-black text-slate-900 flex items-center">
          <Settings2 className="w-5 h-5 mr-2 text-amber-500" />
          <span>จัดการข้อมูลระบบหลัก (Master Data Management)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          ระบบกำหนดระเบียบและควบคุมตัวแปรสารบบข้อมูลแกนกลางของบริษัทในเครือทั้งหมด
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Sub Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setSubTab("tanks")}
            className={`px-5 py-3.5 text-xs font-bold border-r border-slate-100 flex items-center space-x-2.5 transition cursor-pointer ${
              subTab === "tanks" ? "text-indigo-600 bg-white border-b-2 border-b-indigo-600 font-black" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Container className="w-4 h-4" />
            <span>1. คลัง & ถังเก็บ (Tanks)</span>
          </button>
          <button
            onClick={() => setSubTab("vehicles")}
            className={`px-5 py-3.5 text-xs font-bold border-r border-slate-100 flex items-center space-x-2.5 transition cursor-pointer ${
              subTab === "vehicles" ? "text-indigo-600 bg-white border-b-2 border-b-indigo-600 font-black" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>2. ทะเบียนเครื่องจักร (Vehicles)</span>
          </button>
          <button
            onClick={() => setSubTab("projects")}
            className={`px-5 py-3.5 text-xs font-bold border-r border-slate-100 flex items-center space-x-2.5 transition cursor-pointer ${
              subTab === "projects" ? "text-indigo-600 bg-white border-b-2 border-b-indigo-600 font-black" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>3. รายชื่อโครงการ (Projects)</span>
          </button>
          <button
            onClick={() => setSubTab("merchants")}
            className={`px-5 py-3.5 text-xs font-bold border-r border-slate-100 flex items-center space-x-2.5 transition cursor-pointer ${
              subTab === "merchants" ? "text-indigo-600 bg-white border-b-2 border-b-indigo-600 font-black" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>4. ทะเบียนร้านคู่ค้า (Merchants)</span>
          </button>
          <button
            onClick={() => setSubTab("users")}
            className={`px-5 py-3.5 text-xs font-bold flex items-center space-x-2.5 transition cursor-pointer ${
              subTab === "users" ? "text-indigo-600 bg-white border-b-2 border-b-indigo-600 font-black" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>5. สิทธิ์ผู้ใช้งาน (Users)</span>
          </button>
        </div>

        {/* Content of Sub Tab */}
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h4 className="text-xs font-black text-slate-800 tracking-tight">
              {getSubTabTitle()}
            </h4>
            {!isOperator ? (
              <button
                onClick={() => onAdd(subTab)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มรายการใหม่</span>
              </button>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2.5 py-1 rounded-full">
                🔒 โหมดอ่านอย่างเดียว (สิทธิ์พนักงานคีย์ข้อมูล)
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              {subTab === "tanks" && (
                <>
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                      <th className="py-3 px-4">IDถัง</th>
                      <th className="py-3 px-4">ชื่อคลัง/ถังเก็บ</th>
                      <th className="py-3 px-4">ประเภทวัสดุ</th>
                      <th className="py-3 px-4 text-right">ความจุสูงสุด</th>
                      <th className="py-3 px-4 text-right">คงเหลือปัจจุบัน</th>
                      <th className="py-3 px-4 text-right">เกณฑ์เตือนวิกฤต</th>
                      <th className="py-3 px-4 text-right">ราคาน้ำมันอ้างอิง</th>
                      <th className="py-3 px-4">หน่วยนับ</th>
                      {!isOperator && <th className="py-3 px-4 text-center">ตัวเลือกจัดการ</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {tanks.map((t, idx) => (
                      <tr key={t.IDถัง} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-slate-500 font-bold">{t.IDถัง}</td>
                        <td className="py-3 px-4 text-slate-900">{t["ชื่อคลัง/ถังเก็บ"]}</td>
                        <td className="py-3 px-4">{t.ประเภทวัสดุ}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatNumber(t.ความจุสูงสุด, 0)}</td>
                        <td className="py-3 px-4 text-right font-mono text-indigo-600">{formatNumber(t.ปริมาณคงเหลือปัจจุบัน, 2)}</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-500">{formatNumber(t.เกณฑ์แจ้งเตือนต่ำวิกฤต, 0)}</td>
                        <td className="py-3 px-4 text-right font-mono text-amber-600">{formatNumber(t.ราคาน้ำมันอ้างอิง, 2)} ฿</td>
                        <td className="py-3 px-4">{t.หน่วยนับ}</td>
                        {!isOperator && (
                          <td className="py-3 px-4 text-center space-x-1.5 whitespace-nowrap">
                            <button onClick={() => onEdit("tanks", idx)} className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg">แก้ไข</button>
                            <button onClick={() => onDelete("tanks", idx)} className="text-rose-600 hover:text-rose-900 font-bold bg-rose-50 px-2.5 py-1 rounded-lg">ลบ</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {subTab === "vehicles" && (
                <>
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                      <th className="py-3 px-4">IDรถ</th>
                      <th className="py-3 px-4">ทะเบียน/รหัสเครื่องจักร</th>
                      <th className="py-3 px-4">พนักงานขับรถประจำคัน</th>
                      {!isOperator && <th className="py-3 px-4 text-center">ตัวเลือกจัดการ</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {vehicles.map((v, idx) => (
                      <tr key={v.IDรถ} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-slate-500 font-bold">{v.IDรถ}</td>
                        <td className="py-3 px-4 text-slate-900 font-bold">{v["ทะเบียน/รหัสเครื่องจักร"]}</td>
                        <td className="py-3 px-4">{v.พนักงานขับรถประจำคัน || "-"}</td>
                        {!isOperator && (
                          <td className="py-3 px-4 text-center space-x-1.5 whitespace-nowrap">
                            <button onClick={() => onEdit("vehicles", idx)} className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg">แก้ไข</button>
                            <button onClick={() => onDelete("vehicles", idx)} className="text-rose-600 hover:text-rose-900 font-bold bg-rose-50 px-2.5 py-1 rounded-lg">ลบ</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {subTab === "projects" && (
                <>
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                      <th className="py-3 px-4">ลำดับดัชนี</th>
                      <th className="py-3 px-4">ชื่อโครงการ/ไซต์งานก่อสร้าง</th>
                      {!isOperator && <th className="py-3 px-4 text-center">ตัวเลือกจัดการ</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {projects.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-slate-500 font-bold">#{idx + 1}</td>
                        <td className="py-3 px-4 text-slate-900 font-bold">{p["ชื่อโครงการ/ไซต์งาน"]}</td>
                        {!isOperator && (
                          <td className="py-3 px-4 text-center space-x-1.5 whitespace-nowrap">
                            <button onClick={() => onEdit("projects", idx)} className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg">แก้ไข</button>
                            <button onClick={() => onDelete("projects", idx)} className="text-rose-600 hover:text-rose-900 font-bold bg-rose-50 px-2.5 py-1 rounded-lg">ลบ</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {subTab === "merchants" && (
                <>
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                      <th className="py-3 px-4">IDผู้ค้า</th>
                      <th className="py-3 px-4">ชื่อร้านค้า/ผู้จัดจำหน่ายคู่สัญญา</th>
                      {!isOperator && <th className="py-3 px-4 text-center">ตัวเลือกจัดการ</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {merchants.map((m, idx) => (
                      <tr key={m.IDผู้ค้า} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-slate-500 font-bold">{m.IDผู้ค้า}</td>
                        <td className="py-3 px-4 text-slate-900 font-bold">{m["ชื่อร้านค้า/ผู้ให้บริการ"]}</td>
                        {!isOperator && (
                          <td className="py-3 px-4 text-center space-x-1.5 whitespace-nowrap">
                            <button onClick={() => onEdit("merchants", idx)} className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg">แก้ไข</button>
                            <button onClick={() => onDelete("merchants", idx)} className="text-rose-600 hover:text-rose-900 font-bold bg-rose-50 px-2.5 py-1 rounded-lg">ลบ</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {subTab === "users" && (
                <>
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                      <th className="py-3 px-4">ชื่อผู้ใช้ (Username)</th>
                      <th className="py-3 px-4">พนักงานผู้ปฏิบัติการ</th>
                      <th className="py-3 px-4">สิทธิ์การเข้าถึงระบบ</th>
                      {!isOperator && <th className="py-3 px-4 text-center">ตัวเลือกจัดการ</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {users.map((u, idx) => (
                      <tr key={u.Username} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{u.Username}</td>
                        <td className="py-3 px-4 text-slate-900 font-bold">{u.Name}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.Role === "ผู้ดูแลระบบสูงสุด"
                                ? "bg-rose-50 text-rose-700 border border-rose-100"
                                : u.Role === "ผู้ตรวจสอบ"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                : "bg-slate-100 text-slate-700 border"
                            }`}
                          >
                            {u.Role}
                          </span>
                        </td>
                        {!isOperator && (
                          <td className="py-3 px-4 text-center space-x-1.5 whitespace-nowrap">
                            <button onClick={() => onEdit("users", idx)} className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg">แก้ไข</button>
                            <button onClick={() => onDelete("users", idx)} className="text-rose-600 hover:text-rose-900 font-bold bg-rose-50 px-2.5 py-1 rounded-lg">ลบ</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
