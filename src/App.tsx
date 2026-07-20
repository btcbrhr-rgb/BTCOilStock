/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Fuel, LogOut } from "lucide-react";

import {
  getDatabase,
  saveDatabase,
  adjustStockForTransaction,
  getSheetsUrl,
  saveSheetsUrl,
  testSheetsConnection,
  fetchDatabaseFromSheets,
  syncDatabaseToSheets,
  resetDatabase,
  Database
} from "./services/db";
import {
  User,
  Tank,
  Vehicle,
  Project,
  Merchant,
  Receipt,
  Disbursement,
  TabType,
  MasterDataType
} from "./types";

import LoginWall from "./components/LoginWall";
import DashboardTab from "./components/DashboardTab";
import ReceiptsTab from "./components/ReceiptsTab";
import DisbursementsTab from "./components/DisbursementsTab";
import MasterDataTab from "./components/MasterDataTab";

import ReceiptModal from "./components/ReceiptModal";
import DisbursementModal from "./components/DisbursementModal";
import MasterDataModal from "./components/MasterDataModal";
import CsvImportModal from "./components/CsvImportModal";
import DetailModal from "./components/DetailModal";
import ConfirmModal from "./components/ConfirmModal";
import Toast from "./components/Toast";

export default function App() {
  // Database States
  const [db, setDb] = useState(() => getDatabase());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>("dashboard");

  // Sheets States
  const [sheetsUrl, setSheetsUrl] = useState(() => getSheetsUrl());
  const [isSheetsLoading, setIsSheetsLoading] = useState(false);

  // Auto-sync wrapper
  const saveDbState = (updatedDb: Database) => {
    setDb(updatedDb);

    if (sheetsUrl) {
      syncDatabaseToSheets(sheetsUrl, updatedDb)
        .then(() => {
          console.log("Auto-synced to Sheets successfully");
        })
        .catch((err) => {
          console.error("Auto-sync failed:", err);
          triggerToast(
            "บันทึกข้อมูลล้มเหลว",
            "ไม่สามารถอัปเดตข้อมูลลง Google Sheets ได้โดยตรง (กรุณาเช็คอินเทอร์เน็ตหรือสิทธิ์ของสคริปต์)",
            "error"
          );
        });
    } else {
      triggerToast(
        "ไม่สามารถเซฟข้อมูลได้",
        "กรุณาตั้งค่าเชื่อมต่อ Google Sheets ก่อนทำรายการเพื่อไม่ให้ข้อมูลสูญหาย",
        "error"
      );
    }
  };

  // Pull data from Sheets on app startup
  useEffect(() => {
    const url = getSheetsUrl();
    if (url) {
      setIsSheetsLoading(true);
      fetchDatabaseFromSheets(url)
        .then((sheetsDb) => {
          setDb(sheetsDb);
          triggerToast(
            "โหลดข้อมูลคลาวด์สำเร็จ",
            "ดึงข้อมูลล่าสุดจาก Google Sheets โดยตรงสำเร็จ!",
            "success"
          );
        })
        .catch((err) => {
          console.error("Startup Sheets fetch failed:", err);
          triggerToast(
            "โหลดข้อมูลไม่สำเร็จ",
            "ไม่สามารถดึงข้อมูลจาก Google Sheets ได้โดยตรง (กรุณาตรวจสอบลิงก์เชื่อมต่อหรือตั้งค่าใหม่)",
            "error"
          );
        })
        .finally(() => {
          setIsSheetsLoading(false);
        });
    }
  }, []);

  // Sheets Connection handlers
  const handleSaveSheetsUrl = (url: string) => {
    saveSheetsUrl(url);
    setSheetsUrl(url);
    triggerToast("บันทึกที่อยู่สำเร็จ", "บันทึก URL เว็บแอป Google Sheets เรียบร้อยแล้ว", "success");
  };

  const handleTestSheetsConnection = async (url: string): Promise<boolean> => {
    setIsSheetsLoading(true);
    try {
      const isOk = await testSheetsConnection(url);
      if (isOk) {
        triggerToast("เชื่อมต่อสำเร็จ!", "สเปรดชีตตอบรับการเชื่อมต่ออย่างถูกต้อง", "success");
        return true;
      } else {
        triggerToast("เชื่อมต่อล้มเหลว", "เว็บแอปไม่ตอบกลับ โปรดตรวจสอบสิทธิ์เข้าถึงสเปรดชีต (Everyone)", "error");
        return false;
      }
    } catch (err) {
      triggerToast("เชื่อมต่อล้มเหลว", "ไม่สามารถติดต่อสเปรดชีตได้ โปรดตรวจสอบลิงก์ URL อีกครั้ง", "error");
      return false;
    } finally {
      setIsSheetsLoading(false);
    }
  };

  const handleSyncWithSheets = async () => {
    if (!sheetsUrl) {
      triggerToast("ไม่พบลิงก์เชื่อมต่อ", "โปรดระบุและบันทึก URL เว็บแอปก่อนทำการซิงค์ข้อมูล", "error");
      return;
    }
    setIsSheetsLoading(true);
    try {
      await syncDatabaseToSheets(sheetsUrl, db);
      triggerToast("ซิงค์คลาวด์สำเร็จ!", "ส่งออกฐานข้อมูลปัจจุบันไปยัง Google Sheets เรียบร้อยแล้ว", "success");
    } catch (err) {
      console.error(err);
      triggerToast("ซิงค์ล้มเหลว", "ไม่สามารถส่งข้อมูลขึ้นสเปรดชีตได้ โปรดตรวจสอบสิทธิ์เข้าถึงหรือลิงก์", "error");
    } finally {
      setIsSheetsLoading(false);
    }
  };

  const handlePullFromSheets = async () => {
    if (!sheetsUrl) {
      triggerToast("ไม่พบลิงก์เชื่อมต่อ", "โปรดระบุและบันทึก URL เว็บแอปก่อนดึงข้อมูล", "error");
      return;
    }
    setIsSheetsLoading(true);
    try {
      const sheetsDb = await fetchDatabaseFromSheets(sheetsUrl);
      setDb(sheetsDb);
      triggerToast("ดึงข้อมูลสำเร็จ!", "อัปเดตข้อมูลตรงจาก Google Sheets สำเร็จเรียบร้อย", "success");
    } catch (err) {
      console.error(err);
      triggerToast("ดึงข้อมูลล้มเหลว", "ไม่สามารถนำข้อมูลลงมาจากสเปรดชีตได้ โปรดตรวจสอบลิงก์", "error");
    } finally {
      setIsSheetsLoading(false);
    }
  };

  // Project filter linking for Project Cost Summary
  const [filterProjectName, setFilterProjectName] = useState<string>("all");

  // Modals Visibility
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptEditMode, setReceiptEditMode] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);

  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const [disbursementEditMode, setDisbursementEditMode] = useState(false);
  const [editingDisbursement, setEditingDisbursement] = useState<Disbursement | null>(null);

  const [showMasterModal, setShowMasterModal] = useState(false);
  const [masterSubTab, setMasterSubTab] = useState<MasterDataType>("tanks");
  const [masterEditIndex, setEditIndex] = useState<number | null>(null);

  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvType, setCsvType] = useState<"receipts" | "disbursements">("receipts");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailType, setDetailType] = useState<"receipt" | "disbursement">("receipt");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Reusable Confirmation
  const [confirm, setConfirm] = useState<{
    show: boolean;
    title: string;
    message: string;
    isWarning: boolean;
    onOk: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    isWarning: true,
    onOk: () => {},
  });

  // Reusable Toasts
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    desc: string;
    type: "success" | "error";
  }>({
    show: false,
    title: "",
    desc: "",
    type: "success",
  });

  const triggerToast = (title: string, desc: string, type: "success" | "error" = "success") => {
    setToast({ show: true, title, desc, type });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  // Safe incremental IDs generator
  const getNextReceiptId = () => {
    let max = 0;
    db.receipts.forEach((r) => {
      const match = r.IDรายการ.match(/(\d+)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > max) max = val;
      }
    });
    const year = new Date().getFullYear();
    return `REC-${year}-${String(max + 1).padStart(3, "0")}`;
  };

  const getNextDisbursementId = () => {
    let max = 0;
    db.disbursements.forEach((d) => {
      const match = d.IDรายการ.match(/(\d+)$/);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val > max) max = val;
      }
    });
    const year = new Date().getFullYear();
    return `DISB-${year}-${String(max + 1).padStart(3, "0")}`;
  };

  const getNextMasterId = (type: MasterDataType) => {
    if (type === "tanks") {
      return `TANK-${String(db.tanks.length + 1).padStart(2, "0")}`;
    } else if (type === "vehicles") {
      return `VEH-${String(db.vehicles.length + 1).padStart(3, "0")}`;
    } else if (type === "merchants") {
      return `MER-${String(db.merchants.length + 1).padStart(2, "0")}`;
    }
    return "";
  };

  // Transaction Actions (Receipt CRUD & balance checks)
  const handleReceiptSubmit = (data: Receipt) => {
    let updatedReceipts = [...db.receipts];
    let updatedDb = { ...db };

    if (receiptEditMode && editingReceipt) {
      const idx = updatedReceipts.findIndex((r) => r.IDรายการ === editingReceipt.IDรายการ);
      if (idx !== -1) {
        // If it was already verified/approved, handle stock adjustments
        if (editingReceipt.สถานะ === "อนุมัติแล้ว") {
          updatedDb = adjustStockForTransaction(
            updatedDb,
            "receipt",
            editingReceipt["ชื่อสินค้า (คลัง)"],
            editingReceipt.จำนวนที่ซื้อ,
            "subtract"
          );
        }
        
        // Add audit metadata on edit
        const auditData = {
          ...data,
          createdAt: editingReceipt.createdAt || new Date().toISOString(),
          createdBy: editingReceipt.createdBy || editingReceipt.ผู้บันทึก || currentUser?.Name || "ระบบ",
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.Name || "ระบบ",
        };
        updatedReceipts[idx] = auditData;

        if (data.สถานะ === "อนุมัติแล้ว") {
          updatedDb = adjustStockForTransaction(
            updatedDb,
            "receipt",
            data["ชื่อสินค้า (คลัง)"],
            data.จำนวนที่ซื้อ,
            "add"
          );
        }
      }
    } else {
      // Add audit metadata on create
      const auditData = {
        ...data,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.Name || data.ผู้บันทึก || "ระบบ",
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.Name || data.ผู้บันทึก || "ระบบ",
      };
      updatedReceipts.push(auditData);
      if (data.สถานะ === "อนุมัติแล้ว") {
        updatedDb = adjustStockForTransaction(
          updatedDb,
          "receipt",
          data["ชื่อสินค้า (คลัง)"],
          data.จำนวนที่ซื้อ,
          "add"
        );
      }
    }

    updatedDb.receipts = updatedReceipts;
    saveDbState(updatedDb);

    setShowReceiptModal(false);
    setReceiptEditMode(false);
    setEditingReceipt(null);
    triggerToast(
      receiptEditMode ? "แก้ไขเสร็จสมบูรณ์" : "บันทึกคลังพัสดุแล้ว",
      receiptEditMode
        ? `ปรับปรุงรายละเอียดใบนำส่ง ${data.IDรายการ} สำเร็จ`
        : `บันทึกจัดหาวัสดุ ${data.IDรายการ} เข้าระบบสำเร็จ`
    );
  };

  const handleDisbursementSubmit = (data: Disbursement) => {
    let updatedDisb = [...db.disbursements];
    let updatedDb = { ...db };

    // Check balance limits if creating or changing
    const targetTank = db.tanks.find((t) => t["ชื่อคลัง/ถังเก็บ"] === data["ชื่อสินค้า (คลัง)"]);
    if (targetTank) {
      let baselineStock = targetTank.ปริมาณคงเหลือปัจจุบัน;
      
      // If we are editing, temporarily restore original stock before checking limit
      if (disbursementEditMode && editingDisbursement && editingDisbursement.สถานะ === "อนุมัติแล้ว") {
        baselineStock += editingDisbursement.จำนวนที่จ่าย;
      }

      if (data.จำนวนที่จ่าย > baselineStock) {
        triggerToast(
          "ยอดคงคลังไม่เพียงพอ!",
          `ถังจัดเก็บมีพัสดุพร้อมเบิกใช้สูงสุดเพียง ${baselineStock} ${targetTank.หน่วยนับ}`,
          "error"
        );
        return;
      }
    }

    // Auto register vehicle if not in registry
    const vehicleExists = db.vehicles.some((v) => v["ทะเบียน/รหัสเครื่องจักร"] === data.ทะเบียน.trim());
    if (data.ทะเบียน.trim() && !vehicleExists) {
      const nextVehId = `VEH-${String(db.vehicles.length + 1).padStart(3, "0")}`;
      updatedDb.vehicles.push({
        IDรถ: nextVehId,
        "ทะเบียน/รหัสเครื่องจักร": data.ทะเบียน.trim(),
        พนักงานขับรถประจำคัน: data["ผู้เบิก/คนขับ"],
      });
    }

    if (disbursementEditMode && editingDisbursement) {
      const idx = updatedDisb.findIndex((d) => d.IDรายการ === editingDisbursement.IDรายการ);
      if (idx !== -1) {
        // Rollback original approved disbursement stock
        if (editingDisbursement.สถานะ === "อนุมัติแล้ว") {
          updatedDb = adjustStockForTransaction(
            updatedDb,
            "disbursement",
            editingDisbursement["ชื่อสินค้า (คลัง)"],
            editingDisbursement.จำนวนที่จ่าย,
            "add"
          );
        }

        // Add audit metadata on edit
        const auditData = {
          ...data,
          createdAt: editingDisbursement.createdAt || new Date().toISOString(),
          createdBy: editingDisbursement.createdBy || editingDisbursement.ผู้บันทึก || currentUser?.Name || "ระบบ",
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.Name || "ระบบ",
        };
        updatedDisb[idx] = auditData;

        // Apply new approved stock deduction
        if (data.สถานะ === "อนุมัติแล้ว") {
          updatedDb = adjustStockForTransaction(
            updatedDb,
            "disbursement",
            data["ชื่อสินค้า (คลัง)"],
            data.จำนวนที่จ่าย,
            "subtract"
          );
        }
      }
    } else {
      // Add audit metadata on create
      const auditData = {
        ...data,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.Name || data.ผู้บันทึก || "ระบบ",
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.Name || data.ผู้บันทึก || "ระบบ",
      };
      updatedDisb.push(auditData);
      if (data.สถานะ === "อนุมัติแล้ว") {
        updatedDb = adjustStockForTransaction(
          updatedDb,
          "disbursement",
          data["ชื่อสินค้า (คลัง)"],
          data.จำนวนที่จ่าย,
          "subtract"
        );
      }
    }

    updatedDb.disbursements = updatedDisb;
    saveDbState(updatedDb);

    setShowDisbursementModal(false);
    setDisbursementEditMode(false);
    setEditingDisbursement(null);
    triggerToast(
      disbursementEditMode ? "แก้ไขเสร็จสมบูรณ์" : "บันทึกตัดโควตาคลังแล้ว",
      disbursementEditMode
        ? `ปรับปรุงข้อมูลใบเบิกพัสดุ ${data.IDรายการ} สำเร็จ`
        : `เบิกตัดดุลวัสดุ ${data.IDรายการ} และลงทะเบียนสิทธิ์เรียบร้อย`
    );
  };

  // Master Data Add/Edit/Delete
  const handleMasterSubmit = (data: any) => {
    const updatedDb = { ...db };
    const editMode = masterEditIndex !== null;

    if (masterSubTab === "tanks") {
      if (editMode) {
        updatedDb.tanks[masterEditIndex!] = data;
      } else {
        updatedDb.tanks.push(data);
      }
    } else if (masterSubTab === "vehicles") {
      if (editMode) {
        updatedDb.vehicles[masterEditIndex!] = data;
      } else {
        updatedDb.vehicles.push(data);
      }
    } else if (masterSubTab === "projects") {
      if (editMode) {
        updatedDb.projects[masterEditIndex!] = data;
      } else {
        updatedDb.projects.push(data);
      }
    } else if (masterSubTab === "merchants") {
      if (editMode) {
        updatedDb.merchants[masterEditIndex!] = data;
      } else {
        updatedDb.merchants.push(data);
      }
    } else if (masterSubTab === "users") {
      if (editMode) {
        updatedDb.users[masterEditIndex!] = data;
      } else {
        // Prevent duplicate usernames
        const exists = db.users.some(
          (u) => u.Username.toLowerCase() === data.Username.trim().toLowerCase()
        );
        if (exists) {
          triggerToast("ข้อผิดพลาดระบบบัญชี", "ชื่อผู้ใช้งานนี้ถูกจองในสารบบแล้ว", "error");
          return;
        }
        updatedDb.users.push(data);
      }
    }

    saveDbState(updatedDb);
    setShowMasterModal(false);
    setEditIndex(null);
    triggerToast(
      editMode ? "บันทึกการแก้ไขแล้ว" : "เพิ่มสารบบสำเร็จ",
      `ปรับปรุงตารางข้อมูล ${masterSubTab.toUpperCase()} แกนกลางสำเร็จ`
    );
  };

  const handleMasterDelete = (type: MasterDataType, idx: number) => {
    let targetName = "";
    if (type === "tanks") targetName = db.tanks[idx]["ชื่อคลัง/ถังเก็บ"];
    else if (type === "vehicles") targetName = db.vehicles[idx]["ทะเบียน/รหัสเครื่องจักร"];
    else if (type === "projects") targetName = db.projects[idx]["ชื่อโครงการ/ไซต์งาน"];
    else if (type === "merchants") targetName = db.merchants[idx]["ชื่อร้านค้า/ผู้ให้บริการ"];
    else if (type === "users") targetName = db.users[idx].Username;

    setConfirm({
      show: true,
      title: `ลบสิทธิ์พารามิเตอร์ระบบ (${type.toUpperCase()})`,
      message: `คำเตือน: คุณแน่ใจที่จะลบข้อมูล "${targetName}" ออกจากสารบบฐานข้อมูลหลักพัสดุหรือไม่?`,
      isWarning: true,
      onOk: () => {
        const updatedDb = { ...db };
        if (type === "tanks") updatedDb.tanks.splice(idx, 1);
        else if (type === "vehicles") updatedDb.vehicles.splice(idx, 1);
        else if (type === "projects") updatedDb.projects.splice(idx, 1);
        else if (type === "merchants") updatedDb.merchants.splice(idx, 1);
        else if (type === "users") updatedDb.users.splice(idx, 1);

        saveDbState(updatedDb);
        setConfirm((prev) => ({ ...prev, show: false }));
        triggerToast("ลบข้อมูลสำเร็จ", "ดึงแถวออกจากสเปรดชีตแกนกลางเรียบร้อย");
      },
    });
  };

  // CSV batches importing
  const handleCsvImportComplete = (
    importedRows: any[],
    masterRegUpdates?: {
      newTanks: Tank[];
      newProjects: Project[];
      newMerchants: Merchant[];
      newVehicles: Vehicle[];
    }
  ) => {
    const updatedDb = { ...db };

    // Register missing master data if any was auto-detected and registered
    if (masterRegUpdates) {
      if (masterRegUpdates.newTanks && masterRegUpdates.newTanks.length > 0) {
        updatedDb.tanks = [...updatedDb.tanks, ...masterRegUpdates.newTanks];
      }
      if (masterRegUpdates.newProjects && masterRegUpdates.newProjects.length > 0) {
        updatedDb.projects = [...updatedDb.projects, ...masterRegUpdates.newProjects];
      }
      if (masterRegUpdates.newMerchants && masterRegUpdates.newMerchants.length > 0) {
        updatedDb.merchants = [...updatedDb.merchants, ...masterRegUpdates.newMerchants];
      }
      if (masterRegUpdates.newVehicles && masterRegUpdates.newVehicles.length > 0) {
        updatedDb.vehicles = [...updatedDb.vehicles, ...masterRegUpdates.newVehicles];
      }
    }

    if (csvType === "receipts") {
      const nextReceipts = [...db.receipts, ...importedRows];
      updatedDb.receipts = nextReceipts;

      // Auto update approved CSV stock
      importedRows.forEach((r) => {
        if (r.สถานะ === "อนุมัติแล้ว") {
          adjustStockForTransaction(updatedDb, "receipt", r["ชื่อสินค้า (คลัง)"], r.จำนวนที่ซื้อ, "add");
        }
      });
    } else {
      const nextDisb = [...db.disbursements, ...importedRows];
      updatedDb.disbursements = nextDisb;

      // Auto update approved CSV stock
      importedRows.forEach((d) => {
        if (d.สถานะ === "อนุมัติแล้ว") {
          adjustStockForTransaction(updatedDb, "disbursement", d["ชื่อสินค้า (คลัง)"], d.จำนวนที่จ่าย, "subtract");
        }
      });
    }

    saveDbState(updatedDb);
  };

  // Approver controls (Verify/Reject/Reset)
  const handleVerifyTransaction = (status: "อนุมัติแล้ว" | "ไม่อนุมัติ") => {
    if (!selectedRecord) return;
    const isApproved = status === "อนุมัติแล้ว";

    setConfirm({
      show: true,
      title: isApproved ? "ลงนามอนุมัติตราสารคงคลัง" : "ปฏิเสธและยกเลิกใบเบิกสิทธิ์",
      message: isApproved
        ? `คุณยืนยันความถูกต้องของใบรายการนี้ เพื่อปรับสมดุลคงคลังตามสถิติจริงหรือไม่?`
        : `คำเตือน: หากกดปฏิเสธ ยอดพัสดุที่เคยปรับสต๊อกชั่วคราวจะถูกยกเลิกการปรับทันที`,
      isWarning: !isApproved,
      onOk: () => {
        const updatedDb = { ...db };
        if (detailType === "receipt") {
          const idx = updatedDb.receipts.findIndex((r) => r.IDรายการ === selectedRecord.IDรายการ);
          if (idx !== -1) {
            const originalStatus = updatedDb.receipts[idx].สถานะ;
            updatedDb.receipts[idx].สถานะ = status;

            // Update audit info
            updatedDb.receipts[idx].updatedAt = new Date().toISOString();
            updatedDb.receipts[idx].updatedBy = currentUser?.Name || "ระบบ";
            if (!updatedDb.receipts[idx].createdAt) {
              updatedDb.receipts[idx].createdAt = new Date().toISOString();
              updatedDb.receipts[idx].createdBy = updatedDb.receipts[idx].ผู้บันทึก || "ระบบ";
            }

            // Handle stock balance
            if (originalStatus !== "อนุมัติแล้ว" && status === "อนุมัติแล้ว") {
              adjustStockForTransaction(
                updatedDb,
                "receipt",
                selectedRecord["ชื่อสินค้า (คลัง)"],
                selectedRecord.จำนวนที่ซื้อ,
                "add"
              );
            } else if (originalStatus === "อนุมัติแล้ว" && status === "ไม่อนุมัติ") {
              adjustStockForTransaction(
                updatedDb,
                "receipt",
                selectedRecord["ชื่อสินค้า (คลัง)"],
                selectedRecord.จำนวนที่ซื้อ,
                "subtract"
              );
            }
          }
        } else {
          const idx = updatedDb.disbursements.findIndex((d) => d.IDรายการ === selectedRecord.IDรายการ);
          if (idx !== -1) {
            const originalStatus = updatedDb.disbursements[idx].สถานะ;
            updatedDb.disbursements[idx].text = status; // support both
            updatedDb.disbursements[idx].สถานะ = status;

            // Update audit info
            updatedDb.disbursements[idx].updatedAt = new Date().toISOString();
            updatedDb.disbursements[idx].updatedBy = currentUser?.Name || "ระบบ";
            if (!updatedDb.disbursements[idx].createdAt) {
              updatedDb.disbursements[idx].createdAt = new Date().toISOString();
              updatedDb.disbursements[idx].createdBy = updatedDb.disbursements[idx].ผู้บันทึก || "ระบบ";
            }

            // Handle stock balance
            if (originalStatus !== "อนุมัติแล้ว" && status === "อนุมัติแล้ว") {
              adjustStockForTransaction(
                updatedDb,
                "disbursement",
                selectedRecord["ชื่อสินค้า (คลัง)"],
                selectedRecord.จำนวนที่จ่าย,
                "subtract"
              );
            } else if (originalStatus === "อนุมัติแล้ว" && status === "ไม่อนุมัติ") {
              adjustStockForTransaction(
                updatedDb,
                "disbursement",
                selectedRecord["ชื่อสินค้า (คลัง)"],
                selectedRecord.จำนวนที่จ่าย,
                "add"
              );
            }
          }
        }

        saveDbState(updatedDb);
        setShowDetailModal(false);
        setConfirm((prev) => ({ ...prev, show: false }));
        triggerToast("อนุมัติเสร็จสิ้น", `ใบรายการ ${selectedRecord.IDรายการ} ได้รับการลงบันทึกเป็นสิทธิ์ "${status}"`);
      },
    });
  };

  const handleResetVerification = () => {
    if (!selectedRecord) return;

    setConfirm({
      show: true,
      title: "ยกเลิกสัญลักษณ์การเช็คสิทธิ์ (Reset Status)",
      message: `คุณแน่ใจหรือไม่ที่ต้องการดึงใบรายการ ${selectedRecord.IDรายการ} กลับมาอยู่ในสถานะรอตรวจสอบเพื่อแก้ไข?`,
      isWarning: true,
      onOk: () => {
        const updatedDb = { ...db };
        if (detailType === "receipt") {
          const idx = updatedDb.receipts.findIndex((r) => r.IDรายการ === selectedRecord.IDรายการ);
          if (idx !== -1) {
            const originalStatus = updatedDb.receipts[idx].สถานะ;
            updatedDb.receipts[idx].สถานะ = "รอตรวจสอบ";

            // Update audit info
            updatedDb.receipts[idx].updatedAt = new Date().toISOString();
            updatedDb.receipts[idx].updatedBy = currentUser?.Name || "ระบบ";

            // If it was approved, remove from stock
            if (originalStatus === "อนุมัติแล้ว") {
              adjustStockForTransaction(
                updatedDb,
                "receipt",
                selectedRecord["ชื่อสินค้า (คลัง)"],
                selectedRecord.จำนวนที่ซื้อ,
                "subtract"
              );
            }
          }
        } else {
          const idx = updatedDb.disbursements.findIndex((d) => d.IDรายการ === selectedRecord.IDรายการ);
          if (idx !== -1) {
            const originalStatus = updatedDb.disbursements[idx].สถานะ;
            updatedDb.disbursements[idx].สถานะ = "รอตรวจสอบ";

            // Update audit info
            updatedDb.disbursements[idx].updatedAt = new Date().toISOString();
            updatedDb.disbursements[idx].updatedBy = currentUser?.Name || "ระบบ";

            // If it was approved, add back to stock
            if (originalStatus === "อนุมัติแล้ว") {
              adjustStockForTransaction(
                updatedDb,
                "disbursement",
                selectedRecord["ชื่อสินค้า (คลัง)"],
                selectedRecord.จำนวนที่จ่าย,
                "add"
              );
            }
          }
        }

        saveDbState(updatedDb);
        setShowDetailModal(false);
        setConfirm((prev) => ({ ...prev, show: false }));
        triggerToast("ปลดล็อกเอกสารสำเร็จ", `เปลี่ยนสถานะใบรายการ ${selectedRecord.IDรายการ} เป็นรอตรวจสอบอีกครั้ง`);
      },
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirm({
      show: true,
      title: "ยืนยันลบใบรายงานทรานแซกชัน",
      message: `คุณยืนยันที่จะลบเอกสารพัสดุเลขที่ ${id} ออกจากระบบสเปรดชีตอย่างถาวรหรือไม่? (หากอนุมัติแล้วจะทำการปรับคืนยอดพัสดุในถังให้)`,
      isWarning: true,
      onOk: () => {
        const updatedDb = { ...db };
        if (detailType === "receipt") {
          const idx = updatedDb.receipts.findIndex((r) => r.IDรายการ === id);
          if (idx !== -1) {
            const r = updatedDb.receipts[idx];
            if (r.สถานะ === "อนุมัติแล้ว") {
              adjustStockForTransaction(updatedDb, "receipt", r["ชื่อสินค้า (คลัง)"], r.จำนวนที่ซื้อ, "subtract");
            }
            updatedDb.receipts.splice(idx, 1);
          }
        } else {
          const idx = updatedDb.disbursements.findIndex((d) => d.IDรายการ === id);
          if (idx !== -1) {
            const d = updatedDb.disbursements[idx];
            if (d.get === "อนุมัติแล้ว" || d.สถานะ === "อนุมัติแล้ว") {
              adjustStockForTransaction(updatedDb, "disbursement", d["ชื่อสินค้า (คลัง)"], d.จำนวนที่จ่าย, "add");
            }
            updatedDb.disbursements.splice(idx, 1);
          }
        }

        saveDbState(updatedDb);
        setShowDetailModal(false);
        setConfirm((prev) => ({ ...prev, show: false }));
        triggerToast("ลบสำเร็จ", `ลบเอกสารใบงาน ${id} เรียบร้อยแล้ว`);
      },
    });
  };

  const handleOpenEditInDetail = (id: string) => {
    setShowDetailModal(false);
    if (detailType === "receipt") {
      const match = db.receipts.find((r) => r.IDรายการ === id);
      if (match) {
        setEditingReceipt(match);
        setReceiptEditMode(true);
        setShowReceiptModal(true);
      }
    } else {
      const match = db.disbursements.find((d) => d.IDรายการ === id);
      if (match) {
        setEditingDisbursement(match);
        setDisbursementEditMode(true);
        setShowDisbursementModal(true);
      }
    }
  };

  // Navigations linking
  const handleFilterDisoutByProject = (proj: string) => {
    setFilterProjectName(proj);
    setCurrentTab("disbursements");
  };

  // Handle successful login
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    triggerToast("ลงชื่อเข้าใช้สำเร็จ", `สิทธิ์เข้าใช้งานระดับ: ${user.Role}`);
  };

  const handleLogout = () => {
    setConfirm({
      show: true,
      title: "ออกจากระบบรักษาความปลอดภัย",
      message: "คุณต้องการล็อกเอาท์ออกจากเซสชั่นการทำรายการปัจจุบันใช่หรือไม่?",
      isWarning: false,
      onOk: () => {
        setCurrentUser(null);
        setConfirm((prev) => ({ ...prev, show: false }));
        triggerToast("ล็อกเอาท์สำเร็จ", "เซสชั่นปลอดภัยถูกยกเลิกแล้ว");
      },
    });
  };

  // Autoload database updates if needed
  useEffect(() => {
    setDb(getDatabase());
  }, []);

  if (!currentUser) {
    return <LoginWall users={db.users} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Header navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 text-amber-500 p-2 rounded-xl shadow-md flex items-center justify-center">
                <Fuel className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-sm sm:text-base font-black text-slate-900 block leading-none tracking-tight">
                  BURIRAM THONGCHAI ERP
                </span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block mt-1">
                  ระบบเชื่อมโยงคลังและบัตรเติมน้ำมัน (SDMS Premium)
                </span>
              </div>
            </div>

            {/* Session Info */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-50 border border-indigo-150 text-indigo-700">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>เชื่อมโยงสมดุลคลาวด์ (LIVE DB)</span>
              </div>

              <div className="flex items-center space-x-2.5 bg-slate-100 border border-slate-200/80 p-1.5 pr-3.5 rounded-full">
                <div className="w-7 h-7 bg-slate-900 text-amber-500 rounded-full flex items-center justify-center font-black text-xs shadow-sm">
                  {currentUser.Name.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left hidden md:block">
                  <span className="text-[11px] font-black text-slate-800 block leading-tight">
                    {currentUser.Name}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                    {currentUser.Role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-full transition duration-150 cursor-pointer"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Tabs Navigation */}
      <nav className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              onClick={() => {
                setCurrentTab("dashboard");
                setFilterProjectName("all");
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 cursor-pointer transition duration-150 ${
                currentTab === "dashboard"
                  ? "bg-slate-800 text-amber-500 font-extrabold shadow-inner"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              <span>แดชบอร์ด & คลังน้ำมัน</span>
            </button>
            <button
              onClick={() => setCurrentTab("receipts")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 cursor-pointer transition duration-150 ${
                currentTab === "receipts"
                  ? "bg-slate-800 text-amber-500 font-extrabold shadow-inner"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span>ประวัติจัดซื้อรับเข้า</span>
            </button>
            <button
              onClick={() => setCurrentTab("disbursements")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 cursor-pointer transition duration-150 ${
                currentTab === "disbursements"
                  ? "bg-slate-800 text-amber-500 font-extrabold shadow-inner"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>ประวัติเบิกจ่ายไซต์งาน</span>
            </button>
            <button
              onClick={() => setCurrentTab("masterdata")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 cursor-pointer transition duration-150 ${
                currentTab === "masterdata"
                  ? "bg-slate-800 text-amber-500 font-extrabold shadow-inner"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>จัดการข้อมูลหลัก</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Containers */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {currentTab === "dashboard" && (
          <DashboardTab
            tanks={db.tanks}
            receipts={db.receipts}
            disbursements={db.disbursements}
            projects={db.projects}
            onFilterDisbursementsByProject={handleFilterDisoutByProject}
          />
        )}

        {currentTab === "receipts" && (
          <ReceiptsTab
            receipts={db.receipts}
            tanks={db.tanks}
            merchants={db.merchants}
            onOpenForm={() => {
              setReceiptEditMode(false);
              setEditingReceipt(null);
              setShowReceiptModal(true);
            }}
            onOpenImport={() => {
              setCsvType("receipts");
              setShowCsvModal(true);
            }}
            onViewDetails={(id) => {
              const matched = db.receipts.find((r) => r.IDรายการ === id);
              if (matched) {
                setSelectedRecord(matched);
                setDetailType("receipt");
                setShowDetailModal(true);
              }
            }}
          />
        )}

        {currentTab === "disbursements" && (
          <DisbursementsTab
            disbursements={db.disbursements}
            tanks={db.tanks}
            projects={db.projects}
            filterProject={filterProjectName}
            onOpenForm={() => {
              setDisbursementEditMode(false);
              setEditingDisbursement(null);
              setShowDisbursementModal(true);
            }}
            onOpenImport={() => {
              setCsvType("disbursements");
              setShowCsvModal(true);
            }}
            onViewDetails={(id) => {
              const matched = db.disbursements.find((d) => d.IDรายการ === id);
              if (matched) {
                setSelectedRecord(matched);
                setDetailType("disbursement");
                setShowDetailModal(true);
              }
            }}
          />
        )}

        {currentTab === "masterdata" && (
          <MasterDataTab
            tanks={db.tanks}
            vehicles={db.vehicles}
            projects={db.projects}
            merchants={db.merchants}
            users={db.users}
            currentUser={currentUser}
            sheetsUrl={sheetsUrl}
            isSheetsLoading={isSheetsLoading}
            onSaveSheetsUrl={handleSaveSheetsUrl}
            onTestSheetsConnection={handleTestSheetsConnection}
            onSyncWithSheets={handleSyncWithSheets}
            onPullFromSheets={handlePullFromSheets}
            onAdd={(sub) => {
              setMasterSubTab(sub);
              setEditIndex(null);
              setShowMasterModal(true);
            }}
            onEdit={(sub, idx) => {
              setMasterSubTab(sub);
              setEditIndex(idx);
              let activeData = null;
              if (sub === "tanks") activeData = db.tanks[idx];
              else if (sub === "vehicles") activeData = db.vehicles[idx];
              else if (sub === "projects") activeData = db.projects[idx];
              else if (sub === "merchants") activeData = db.merchants[idx];
              else if (sub === "users") activeData = db.users[idx];

              setSelectedRecord(activeData);
              setShowMasterModal(true);
            }}
            onDelete={(sub, idx) => {
              handleMasterDelete(sub, idx);
            }}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-6 text-center text-xs font-semibold">
        <p>© 2026 บจก.บุรีรัมย์ธงชัยก่อสร้าง - ระบบจัดการสต๊อกและสิทธิ์บัตรเติมน้ำมัน SDMS Premium</p>
        <p className="text-[10px] text-slate-650 mt-1 font-medium">
          ระบบขับเคลื่อนโดย React 19 + TypeScript + Recharts + Tailwind CSS
        </p>
      </footer>

      {/* FORM MODAL 1: RECEIPTS */}
      <ReceiptModal
        show={showReceiptModal}
        editMode={receiptEditMode}
        editingReceipt={editingReceipt}
        tanks={db.tanks}
        merchants={db.merchants}
        projects={db.projects}
        users={db.users}
        currentUser={currentUser}
        onClose={() => setShowReceiptModal(false)}
        onSubmit={handleReceiptSubmit}
        generateNextId={getNextReceiptId}
      />

      {/* FORM MODAL 2: DISBURSEMENTS */}
      <DisbursementModal
        show={showDisbursementModal}
        editMode={disbursementEditMode}
        editingDisbursement={editingDisbursement}
        tanks={db.tanks}
        vehicles={db.vehicles}
        projects={db.projects}
        users={db.users}
        currentUser={currentUser}
        onClose={() => setShowDisbursementModal(false)}
        onSubmit={handleDisbursementSubmit}
        generateNextId={getNextDisbursementId}
      />

      {/* FORM MODAL 3: MASTER DATA ADD/EDIT */}
      <MasterDataModal
        show={showMasterModal}
        subTab={masterSubTab}
        editIndex={masterEditIndex}
        activeData={selectedRecord}
        onClose={() => {
          setShowMasterModal(false);
          setEditIndex(null);
        }}
        onSubmit={handleMasterSubmit}
        generateNextId={getNextMasterId}
      />

      {/* MODAL 4: CSV EXCEL IMPORTER */}
      <CsvImportModal
        show={showCsvModal}
        type={csvType}
        onClose={() => setShowCsvModal(false)}
        onImportComplete={handleCsvImportComplete}
        showToast={triggerToast}
        db={db}
      />

      {/* MODAL 5: DOCUMENT DETAILS VIEW & AUDITING */}
      <DetailModal
        show={showDetailModal}
        type={detailType}
        record={selectedRecord}
        currentUser={currentUser}
        onClose={() => setShowDetailModal(false)}
        onVerify={handleVerifyTransaction}
        onResetVerify={handleResetVerification}
        onOpenEdit={handleOpenEditInDetail}
        onDelete={handleDeleteTransaction}
      />

      {/* REUSABLE CONFIRM DIALOG */}
      <ConfirmModal
        show={confirm.show}
        title={confirm.title}
        message={confirm.message}
        isWarning={confirm.isWarning}
        onConfirm={confirm.onOk}
        onCancel={() => setConfirm((prev) => ({ ...prev, show: false }))}
      />

      {/* FLOATING TOASTS SYSTEM */}
      <Toast
        show={toast.show}
        title={toast.title}
        desc={toast.desc}
        type={toast.type}
        onClose={closeToast}
      />
    </div>
  );
}
