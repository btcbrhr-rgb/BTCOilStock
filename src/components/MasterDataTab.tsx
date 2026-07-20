/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import {
  Settings2,
  Container,
  Truck,
  Building,
  Store,
  Users,
  Plus,
  Cloud,
  RefreshCw,
  Check,
  Copy,
  Trash2,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Tank, Vehicle, Project, Merchant, User, MasterDataType } from "../types";

interface MasterDataTabProps {
  tanks: Tank[];
  vehicles: Vehicle[];
  projects: Project[];
  merchants: Merchant[];
  users: User[];
  currentUser: User | null;
  sheetsUrl: string;
  isSheetsLoading: boolean;
  onSaveSheetsUrl: (url: string) => void;
  onTestSheetsConnection: (url: string) => Promise<boolean>;
  onSyncWithSheets: () => void;
  onPullFromSheets: () => void;
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

const APPS_SCRIPT_CODE = `// BURIRAM THONGCHAI SDMS - Google Apps Script Backend
const SHEETS = ["tanks", "vehicles", "projects", "merchants", "users", "receipts", "disbursements"];

const SCHEMAS = {
  tanks: ["IDถัง", "ชื่อคลัง/ถังเก็บ", "ประเภทวัสดุ", "ความจุสูงสุด", "ปริมาณคงเหลือปัจจุบัน", "เกณฑ์แจ้งเตือนต่ำวิกฤต", "ราคาน้ำมันอ้างอิง", "หน่วยนับ"],
  vehicles: ["IDรถ", "ทะเบียน/รหัสเครื่องจักร", "พนักงานขับรถประจำคัน"],
  projects: ["ชื่อโครงการ/ไซต์งาน"],
  merchants: ["IDผู้ค้า", "ชื่อร้านค้า/ผู้ให้บริการ"],
  users: ["Username", "Password", "Name", "Role"],
  receipts: ["IDรายการ", "วันที่รับเข้า", "ร้านค้า", "ชื่อสินค้า (คลัง)", "ประเภทวัสดุ", "ราคา", "หน่วยนับ", "จำนวนที่ซื้อ", "ต้นทุนอื่นๆ", "มูลค่ารวม", "หมายเหตุ", "โครงการ", "เลขที่ใบสั่งชื้อ (PO)", "เลขที่ใบส่งสินค้า", "สถานที่ส่ง", "วันที่ครบกำหนดจ่าย", "วันที่จ่าย", "ผู้บันทึก", "ผู้ตรวจสอบ", "สถานะ", "createdAt", "createdBy", "updatedAt", "updatedBy"],
  disbursements: ["IDรายการ", "วันที่", "ชื่อสินค้า (คลัง)", "ราคา", "หน่วยนับ", "จำนวนที่จ่าย", "มูลค่ารวม", "หมายเหตุ", "โครงการ", "ผู้เบิก/คนขับ", "ทะเบียน", "ผู้บันทึก", "ผู้ตรวจสอบ", "สถานะ", "createdAt", "createdBy", "updatedAt", "updatedBy"]
};

function doGet(e) {
  try {
    var db = loadDatabase();
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: db }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    
    if (action === "test") {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "เชื่อมต่อสำเร็จ!" }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader("Access-Control-Allow-Origin", "*");
    }
    
    if (action === "sync") {
      saveDatabase(postData.db);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "ซิงค์ข้อมูลสำเร็จ!" }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader("Access-Control-Allow-Origin", "*");
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "ไม่พบ Action ที่ระบุ" }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}

function loadDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var db = {};
  
  SHEETS.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      var headers = SCHEMAS[sheetName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      if (sheetName === "users") {
        var headers = SCHEMAS[sheetName];
        var defaultAdminRow = ["admin", "123", "ผู้ดูแลระบบสูงสุด (Admin)", "ผู้ดูแลระบบสูงสุด"];
        sheet.getRange(2, 1, 1, headers.length).setValues([defaultAdminRow]);
        data = sheet.getDataRange().getValues();
      } else {
        db[sheetName] = [];
        return;
      }
    }
    
    var headers = data[0];
    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var row = {};
      var hasData = false;
      for (var j = 0; j < headers.length; j++) {
        var value = data[i][j];
        if (value !== "" && value !== null && value !== undefined) {
          hasData = true;
        }
        if (sheetName === "tanks" && (headers[j] === "ความจุสูงสุด" || headers[j] === "ปริมาณคงเหลือปัจจุบัน" || headers[j] === "เกณฑ์แจ้งเตือนต่ำวิกฤต" || headers[j] === "ราคาน้ำมันอ้างอิง")) {
          value = Number(value) || 0;
        } else if (sheetName === "receipts" && (headers[j] === "ราคา" || headers[j] === "จำนวนที่ซื้อ" || headers[j] === "ต้นทุนอื่นๆ" || headers[j] === "มูลค่ารวม")) {
          value = Number(value) || 0;
        } else if (sheetName === "disbursements" && (headers[j] === "ราคา" || headers[j] === "จำนวนที่จ่าย" || headers[j] === "มูลค่ารวม")) {
          value = Number(value) || 0;
        }
        row[headers[j]] = value;
      }
      if (hasData) {
        rows.push(row);
      }
    }
    db[sheetName] = rows;
  });
  
  return db;
}

function saveDatabase(db) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  SHEETS.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    sheet.clear();
    
    var headers = SCHEMAS[sheetName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    var items = db[sheetName] || [];
    if (items.length === 0) return;
    
    var values = items.map(function(item) {
      return headers.map(function(header) {
        var val = item[header];
        if (val === undefined || val === null) return "";
        return val;
      });
    });
    
    sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  });
}`;

export default function MasterDataTab({
  tanks,
  vehicles,
  projects,
  merchants,
  users,
  currentUser,
  sheetsUrl,
  isSheetsLoading,
  onSaveSheetsUrl,
  onTestSheetsConnection,
  onSyncWithSheets,
  onPullFromSheets,
  onAdd,
  onEdit,
  onDelete,
}: MasterDataTabProps) {
  const [subTab, setSubTab] = useState<string>("tanks");
  const [inputUrl, setInputUrl] = useState(sheetsUrl);
  const [copied, setCopied] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

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
      case "sheets":
        return "การเชื่อมต่อระบบฐานข้อมูลคลาวด์: Google Sheets Integration API";
      default:
        return "ตารางข้อมูลแกนกลาง";
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveUrl = () => {
    onSaveSheetsUrl(inputUrl.trim());
  };

  const handleTestConnection = async () => {
    setTestSuccess(null);
    const result = await onTestSheetsConnection(inputUrl.trim());
    setTestSuccess(result);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center">
            <Settings2 className="w-5 h-5 mr-2 text-indigo-600 animate-spin-slow" />
            <span>จัดการข้อมูลระบบหลัก (Master Data Management)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ระบบกำหนดระเบียบและควบคุมตัวแปรสารบบข้อมูลแกนกลางของบริษัทในเครือทั้งหมด
          </p>
        </div>
        {sheetsUrl && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black bg-indigo-50 border border-indigo-150 text-indigo-700">
            <Cloud className="w-3.5 h-3.5 mr-1.5" />
            เชื่อมต่อ Google Sheets คลาวด์เรียบร้อย
          </span>
        )}
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
            <span>2. เครื่องจักร (Vehicles)</span>
          </button>
          <button
            onClick={() => setSubTab("projects")}
            className={`px-5 py-3.5 text-xs font-bold border-r border-slate-100 flex items-center space-x-2.5 transition cursor-pointer ${
              subTab === "projects" ? "text-indigo-600 bg-white border-b-2 border-b-indigo-600 font-black" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>3. ไซต์งาน (Projects)</span>
          </button>
          <button
            onClick={() => setSubTab("merchants")}
            className={`px-5 py-3.5 text-xs font-bold border-r border-slate-100 flex items-center space-x-2.5 transition cursor-pointer ${
              subTab === "merchants" ? "text-indigo-600 bg-white border-b-2 border-b-indigo-600 font-black" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>4. ร้านค้าคู่ค้า (Merchants)</span>
          </button>
          <button
            onClick={() => setSubTab("users")}
            className={`px-5 py-3.5 text-xs font-bold border-r border-slate-100 flex items-center space-x-2.5 transition cursor-pointer ${
              subTab === "users" ? "text-indigo-600 bg-white border-b-2 border-b-indigo-600 font-black" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>5. พนักงานสิทธิ์ (Users)</span>
          </button>
          <button
            onClick={() => setSubTab("sheets")}
            className={`px-5 py-3.5 text-xs font-black flex items-center space-x-2.5 transition cursor-pointer text-indigo-700 bg-indigo-50/40 hover:bg-indigo-50 ${
              subTab === "sheets" ? "text-indigo-900 bg-white border-b-2 border-b-indigo-700 font-extrabold" : ""
            }`}
          >
            <Cloud className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>6. เชื่อมต่อ Google Sheets (API)</span>
          </button>
        </div>

        {/* Content of Sub Tab */}
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h4 className="text-xs font-black text-slate-800 tracking-tight flex items-center">
              {subTab === "sheets" && <Cloud className="w-4 h-4 mr-1.5 text-indigo-600" />}
              <span>{getSubTabTitle()}</span>
            </h4>
            {subTab !== "sheets" && (
              !isOperator ? (
                <button
                  onClick={() => onAdd(subTab as MasterDataType)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มรายการใหม่</span>
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2.5 py-1 rounded-full border border-slate-150">
                  🔒 โหมดอ่านอย่างเดียว (สิทธิ์พนักงานคีย์ข้อมูล)
                </span>
              )
            )}
          </div>

          {/* Table renderings for normal sub-tabs */}
          {subTab === "tanks" && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
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
                  {tanks.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-bold bg-slate-50/30">
                        📭 ไม่พบข้อมูลคลังจัดเก็บน้ำมันในสารบบหลัก (กรุณาลงทะเบียนถังเก็บเพื่อเริ่มต้นใช้งาน)
                      </td>
                    </tr>
                  ) : (
                    tanks.map((t, idx) => (
                      <tr key={t.IDถัง} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-slate-500 font-bold">{t.IDถัง}</td>
                        <td className="py-3 px-4 text-slate-900 font-black">{t["ชื่อคลัง/ถังเก็บ"]}</td>
                        <td className="py-3 px-4">{t.ประเภทวัสดุ}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatNumber(t.ความจุสูงสุด, 0)}</td>
                        <td className="py-3 px-4 text-right font-mono text-indigo-600 font-bold">{formatNumber(t.ปริมาณคงเหลือปัจจุบัน, 2)}</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-500">{formatNumber(t.เกณฑ์แจ้งเตือนต่ำวิกฤต, 0)}</td>
                        <td className="py-3 px-4 text-right font-mono text-amber-600">{formatNumber(t.ราคาน้ำมันอ้างอิง, 2)} ฿</td>
                        <td className="py-3 px-4">{t.หน่วยนับ}</td>
                        {!isOperator && (
                          <td className="py-3 px-4 text-center space-x-1.5 whitespace-nowrap">
                            <button onClick={() => onEdit("tanks", idx)} className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg transition cursor-pointer">แก้ไข</button>
                            <button onClick={() => onDelete("tanks", idx)} className="text-rose-600 hover:text-rose-900 font-bold bg-rose-50 px-2.5 py-1 rounded-lg transition cursor-pointer">ลบ</button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {subTab === "vehicles" && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="py-3 px-4">IDรถ</th>
                    <th className="py-3 px-4">ทะเบียน/รหัสเครื่องจักร</th>
                    <th className="py-3 px-4">พนักงานขับรถประจำคัน</th>
                    {!isOperator && <th className="py-3 px-4 text-center">ตัวเลือกจัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-bold bg-slate-50/30">
                        📭 ไม่พบข้อมูลเครื่องจักร/รถยนต์ในสารบบระบบหลัก
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((v, idx) => (
                      <tr key={v.IDรถ} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-slate-500 font-bold">{v.IDรถ}</td>
                        <td className="py-3 px-4 text-slate-900 font-bold">{v["ทะเบียน/รหัสเครื่องจักร"]}</td>
                        <td className="py-3 px-4">{v.พนักงานขับรถประจำคัน || "-"}</td>
                        {!isOperator && (
                          <td className="py-3 px-4 text-center space-x-1.5 whitespace-nowrap">
                            <button onClick={() => onEdit("vehicles", idx)} className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg transition cursor-pointer">แก้ไข</button>
                            <button onClick={() => onDelete("vehicles", idx)} className="text-rose-600 hover:text-rose-900 font-bold bg-rose-50 px-2.5 py-1 rounded-lg transition cursor-pointer">ลบ</button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {subTab === "projects" && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="py-3 px-4">ลำดับดัชนี</th>
                    <th className="py-3 px-4">ชื่อโครงการ/ไซต์งานก่อสร้าง</th>
                    {!isOperator && <th className="py-3 px-4 text-center">ตัวเลือกจัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 font-bold bg-slate-50/30">
                        📭 ไม่พบรายชื่อโครงการก่อสร้างในสารบบหลัก
                      </td>
                    </tr>
                  ) : (
                    projects.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-slate-500 font-bold">#{idx + 1}</td>
                        <td className="py-3 px-4 text-slate-900 font-bold">{p["ชื่อโครงการ/ไซต์งาน"]}</td>
                        {!isOperator && (
                          <td className="py-3 px-4 text-center space-x-1.5 whitespace-nowrap">
                            <button onClick={() => onEdit("projects", idx)} className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg transition cursor-pointer">แก้ไข</button>
                            <button onClick={() => onDelete("projects", idx)} className="text-rose-600 hover:text-rose-900 font-bold bg-rose-50 px-2.5 py-1 rounded-lg transition cursor-pointer">ลบ</button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {subTab === "merchants" && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="py-3 px-4">IDผู้ค้า</th>
                    <th className="py-3 px-4">ชื่อร้านค้า/ผู้จัดจำหน่ายคู่สัญญา</th>
                    {!isOperator && <th className="py-3 px-4 text-center">ตัวเลือกจัดการ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {merchants.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 font-bold bg-slate-50/30">
                        📭 ไม่พบรายชื่อร้านค้าผู้ขายวัสดุในระบบหลัก
                      </td>
                    </tr>
                  ) : (
                    merchants.map((m, idx) => (
                      <tr key={m.IDผู้ค้า} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-slate-500 font-bold">{m.IDผู้ค้า}</td>
                        <td className="py-3 px-4 text-slate-900 font-bold">{m["ชื่อร้านค้า/ผู้ให้บริการ"]}</td>
                        {!isOperator && (
                          <td className="py-3 px-4 text-center space-x-1.5 whitespace-nowrap">
                            <button onClick={() => onEdit("merchants", idx)} className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg transition cursor-pointer">แก้ไข</button>
                            <button onClick={() => onDelete("merchants", idx)} className="text-rose-600 hover:text-rose-900 font-bold bg-rose-50 px-2.5 py-1 rounded-lg transition cursor-pointer">ลบ</button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {subTab === "users" && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
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
                      <td className="py-3 px-4 text-slate-900 font-black">{u.Name}</td>
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
                          <button onClick={() => onEdit("users", idx)} className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg transition cursor-pointer">แก้ไข</button>
                          <button onClick={() => onDelete("users", idx)} className="text-rose-600 hover:text-rose-900 font-bold bg-rose-50 px-2.5 py-1 rounded-lg transition cursor-pointer">ลบ</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Google Sheets Integration subtab */}
          {subTab === "sheets" && (
            <div className="space-y-6">
              {/* Top Configuration Card */}
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-4">
                <div className="flex items-start space-x-3">
                  <Cloud className="w-5 h-5 text-indigo-600 mt-1" />
                  <div>
                    <h5 className="text-xs font-black text-slate-900">ตั้งค่าความพึงสิทธิ์: Google Sheets Web App Connection</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ระบุลิงก์ Web App URL ที่ได้จาก Google Apps Script เพื่อเปิดใช้งานการซิงค์ข้อมูลลงสู่ Google Sheets โดยตรง
                    </p>
                  </div>
                </div>

                {/* Input block */}
                <div className="flex flex-col md:flex-row items-stretch gap-2.5">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-inner font-mono text-slate-700 pr-10"
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                    />
                    {isSheetsLoading && (
                      <div className="absolute right-3 top-3.5">
                        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <button
                      onClick={handleSaveUrl}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>บันทึกที่อยู่ URL</span>
                    </button>
                    <button
                      onClick={handleTestConnection}
                      disabled={isSheetsLoading || !inputUrl}
                      className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-extrabold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSheetsLoading ? "animate-spin" : ""}`} />
                      <span>ทดสอบการเชื่อมต่อสเปรดชีต</span>
                    </button>
                  </div>
                </div>

                {/* Test success/fail visual card */}
                {testSuccess !== null && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-top-2 duration-200 ${
                      testSuccess
                        ? "bg-green-50 border-green-150 text-green-700"
                        : "bg-rose-50 border-rose-150 text-rose-700"
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      {testSuccess
                        ? "✓ การเชื่อมต่อสำเร็จแล้ว! แอปพลิเคชันตอบรับการอ่านเขียนสเปรดชีตอย่างสมบูรณ์แบบ"
                        : "✗ การเชื่อมต่อล้มเหลว! สคริปต์ไม่ตอบรับ โปรดตรวจสอบความถูกต้องของ URL และการตั้งค่าสิทธิ์ให้เข้าถึงได้เป็น 'Everyone'"}
                    </span>
                  </div>
                )}

                {/* Database Sync Actions bar */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2">
                  <button
                    onClick={onSyncWithSheets}
                    disabled={isSheetsLoading || !sheetsUrl}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center space-x-2 shadow-sm disabled:opacity-50"
                  >
                    <Cloud className="w-4 h-4 text-sky-400" />
                    <span>ซิงค์ข้อมูลปัจจุบันทั้งหมดขึ้น Google Sheets (คลิกเดียวตั้งต้น)</span>
                  </button>
                  <button
                    onClick={onPullFromSheets}
                    disabled={isSheetsLoading || !sheetsUrl}
                    className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-black px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center space-x-2 shadow-sm disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4 text-indigo-600" />
                    <span>ดึงฐานข้อมูลเวอร์ชันล่าสุดจาก Google Sheets (Pull Data)</span>
                  </button>
                </div>
              </div>

              {/* Instructions Setup Guide - Perfectly styled like user's blueprint */}
              <div className="border border-slate-200 p-6 rounded-2xl space-y-6">
                <div>
                  <h5 className="text-xs font-black text-slate-950 flex items-center">
                    <span className="bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] mr-2">i</span>
                    <span>คู่มือขั้นตอนการจัดเตรียม Google Sheets เป็นดาต้าเบสระบบ (Netlify Ready)</span>
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    โปรดปฏิบัติตามทั้ง 4 ขั้นตอนนี้เพื่อย้ายข้อมูลออฟไลน์ในเครื่องขึ้นมาจัดเก็บบน Google Sheets ของบริษัทอย่างปลอดภัยไร้กังวล
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Step 1 */}
                  <div className="bg-slate-55/40 border border-slate-150 p-4 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">1</span>
                      <span className="font-black text-slate-900">สร้าง Google Sheet และเปิดสคริปต์</span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      เข้าไปที่ลิงก์ <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-bold">sheets.new</a> เพื่อสร้างสเปรดชีตอันใหม่แกะกล่อง จากนั้นมองหาแถบเมนูด้านบน คลิกที่ <strong className="text-slate-700">"ส่วนขยาย" (Extensions)</strong> &gt; <strong className="text-slate-700">"Apps Script"</strong> เพื่อเปิดเครื่องมือแก้ไขสคริปต์เบื้องหลัง
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-slate-55/40 border border-slate-150 p-4 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">2</span>
                      <span className="font-black text-slate-900">คัดลอกรหัสโค้ด Apps Script ไปใช้งาน</span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      คลิกปุ่มสีน้ำเงินเข้มด้านล่างนี้เพื่อคัดลอกรหัสสคริปต์ระบบ ไปวางทับลบโค้ดเริ่มต้นที่ว่างเปล่าในไฟล์ <code className="font-mono bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[10px]">รหัส.gs</code> ของคุณให้หมดทั้งหมด ครบทุกตัวอักษร
                    </p>
                    <button
                      onClick={handleCopyCode}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] flex items-center space-x-1.5 transition cursor-pointer shadow"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          <span>คัดลอกโค้ดสำเร็จ!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-300" />
                          <span>คัดลอกซอร์สโค้ด Apps Script</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-slate-55/40 border border-slate-150 p-4 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">3</span>
                      <span className="font-black text-slate-900">ทำให้ใช้งานได้ในฐานะเว็บแอป (Deploy)</span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      กดรูปดิสก์เพื่อเซฟ &gt; คลิกปุ่มสีฟ้าขวาบน <strong className="text-indigo-600">"ทำให้ใช้งานได้" (Deploy)</strong> &gt;เลือก <strong className="text-slate-700">"การจัดการการใช้งานใหม่" (New deployment)</strong> &gt; คลิกรูปฟันเฟืองเลือก <strong className="text-slate-700">"เว็บแอป" (Web app)</strong>
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-500 font-semibold">
                      <li>ผู้ปฏิบัติการเว็บแอป (Execute as): เลือกเป็น <strong className="text-slate-800">"ตัวคุณเอง" (Me)</strong></li>
                      <li>ผู้มีสิทธิ์เข้าถึง (Who has access): ต้องเปลี่ยนเป็น <strong className="text-rose-600 font-black">"ทุกคน" (Anyone)</strong></li>
                    </ul>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-slate-55/40 border border-slate-150 p-4 rounded-xl space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">4</span>
                      <span className="font-black text-slate-900">นำที่อยู่ URL มาใส่และบันทึก</span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      กดปุ่ม Deploy ระบบจะขออนุมัติสิทธิ์ (Authorize Access) ให้กดยืนยันให้หมด จากนั้นหน้าจอจะแสดง <strong className="text-slate-700">"URL ของเว็บแอป"</strong> ให้ทำการคัดลอกเอาลิงก์ดังกล่าวมาวางในช่องกล่องข้อมูลหลักด้านบนนี้ บันทึกและซิงค์ใช้งานได้เลย!
                    </p>
                  </div>
                </div>

                {/* Quick Code Preview Drawer */}
                <div className="space-y-2">
                  <span className="text-[11px] font-black text-slate-700">พรีวิวซอร์สโค้ดที่จะใช้งานใน Apps Script:</span>
                  <div className="bg-slate-950 text-slate-350 p-4 rounded-xl text-[10px] font-mono h-40 overflow-y-auto scrollbar-thin border border-slate-800 select-all leading-relaxed whitespace-pre">
                    {APPS_SCRIPT_CODE}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
