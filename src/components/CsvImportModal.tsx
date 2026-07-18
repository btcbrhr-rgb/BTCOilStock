/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { FileSpreadsheet, UploadCloud, SearchCheck, RefreshCw, X, Download, AlertTriangle, CheckSquare, Square, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Receipt, Disbursement, Tank, Project, Merchant, Vehicle } from "../types";
import { Database } from "../services/db";

interface CsvImportModalProps {
  show: boolean;
  type: "receipts" | "disbursements";
  onClose: () => void;
  onImportComplete: (importedData: any[], masterRegUpdates?: {
    newTanks: Tank[];
    newProjects: Project[];
    newMerchants: Merchant[];
    newVehicles: Vehicle[];
  }) => void;
  showToast: (title: string, desc: string, type: "success" | "error") => void;
  db: Database;
}

function formatNumber(num: number, decimals = 2) {
  if (num === null || num === undefined || isNaN(num)) return "0.00";
  return Number(num).toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function CsvImportModal({
  show,
  type,
  onClose,
  onImportComplete,
  showToast,
  db,
}: CsvImportModalProps) {
  const [fileSelected, setFileSelected] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [csvText, setCsvText] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [previewActive, setPreviewActive] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Missing Master Data Tracking
  const [missingTanks, setMissingTanks] = useState<string[]>([]);
  const [missingProjects, setMissingProjects] = useState<string[]>([]);
  const [missingMerchants, setMissingMerchants] = useState<string[]>([]);
  const [missingVehicles, setMissingVehicles] = useState<string[]>([]);
  const [autoRegisterMaster, setAutoRegisterMaster] = useState<boolean>(true);

  const resetState = () => {
    setFileSelected(false);
    setFileName("");
    setCsvText("");
    setParsedRows([]);
    setPreviewActive(false);
    setImporting(false);
    setProgressPct(0);
    setProgressLog([]);
    setMissingTanks([]);
    setMissingProjects([]);
    setMissingMerchants([]);
    setMissingVehicles([]);
    setAutoRegisterMaster(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let val = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          val += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === "," && !inQ) {
        out.push(val);
        val = "";
      } else {
        val += ch;
      }
    }
    out.push(val);
    return out.map((v) => v.trim().replace(/^["']|["']$/g, "").trim());
  };

  const resolveHeaderStandard = (csvHeader: string): string => {
    const h = csvHeader.trim().replace(/^["']|["']$/g, "").trim().toLowerCase();
    
    // Thai and English column mappings
    const aliasMap: { [key: string]: string[] } = {
      IDรายการ: ["idรายการ", "ไอดีรายการ", "เลขที่รายการ", "รหัสรายการ", "id", "รายการ", "id รายการ"],
      วันที่รับเข้า: ["วันที่รับเข้า", "วันที่", "วันที่ทำรายการ", "วันเวลา", "เวลา"],
      วันที่: ["วันที่", "วันที่เบิกจ่าย", "วันที่เบิก", "วันที่ทำรายการ", "วันเวลา", "เวลา", "วันที่รับเข้า"],
      ร้านค้า: ["ร้านค้า", "ผู้ค้า", "ผู้ให้บริการ", "ชื่อผู้ให้บริการ", "ร้านค้า/ผู้ให้บริการ"],
      "ชื่อสินค้า (คลัง)": ["ชื่อสินค้า (คลัง)", "ชื่อสินค้า", "สินค้า", "คลัง", "ถังเก็บ", "ถังจัดเก็บ", "ปั๊ม", "คลังสินค้า", "รายการ", "คลังสิทธิ์"],
      ประเภทวัสดุ: ["ประเภทวัสดุ", "ประเภท", "กลุ่มวัสดุ", "ชนิดวัสดุ"],
      ราคา: ["ราคา", "ราคาต่อหน่วย", "ราคาต่อลิตร", "ราคาต่อบาท", "ราคาต่อลิตร/ลิตร", "ราคาต่อตัน/ตัน", "ราคาต่อหน่วย", "ราคาต่อกิโลกรัม/กิโลกรัม", "ราคาต่อลิตร/บาท", "ราคาต่อกิโลกรัม", "ราคาต่อตัน", "ราคาต่อบาท", "ราคาต่อลิตร", "ราคาต่อหน่วย", "ราคา/หน่วย"],
      หน่วยนับ: ["หน่วยนับ", "หน่วย"],
      จำนวนที่ซื้อ: ["จำนวนที่ซื้อ", "จำนวนซื้อ", "จำนวน", "ปริมาณ", "ปริมาณซื้อ"],
      จำนวนที่จ่าย: ["จำนวนที่จ่าย", "จำนวนเบิก", "จำนวนที่เบิก", "จำนวน", "ปริมาณ", "ปริมาณเบิก", "ปริมาณที่เบิก"],
      ต้นทุนอื่นๆ: ["ต้นทุนอื่นๆ", "ค่าจัดหา", "ต้นทุนแฝง", "ค่าขนส่ง", "ค่าดำเนินการ"],
      มูลค่ารวม: ["มูลค่ารวม", "ราคารวม", "รวมเงิน", "ยอดเงิน", "ยอดรวม"],
      โครงการ: ["โครงการ", "โครงการปลายทาง", "ไซต์งาน", "แคมป์งาน", "ชื่อโครงการ/ไซต์งาน", "แคมป์"],
      "เลขที่ใบสั่งชื้อ (PO)": ["เลขที่ใบสั่งชื้อ (po)", "เลขที่ใบสั่งซื้อ (po)", "เลขที่ใบสั่งซื้อ", "เลขที่ใบสั่งชื้อ", "po", "ใบสั่งซื้อ"],
      เลขที่ใบส่งสินค้า: ["เลขที่ใบส่งสินค้า", "เลขที่ใบส่งของ", "ใบส่งของ", "เลขที่บิล", "บิล", "เลขบิล"],
      สถานที่ส่ง: ["สถานที่ส่ง", "จุดส่งสินค้า", "จุดรับมอบ"],
      วันที่ครบกำหนดจ่าย: ["วันที่ครบกำหนดจ่าย", "กำหนดจ่าย", "ดิวจ่าย", "กำหนดชำระ"],
      วันที่จ่าย: ["วันที่จ่าย", "วันที่ชำระเงิน", "วันที่จ่ายเงิน"],
      ผู้บันทึก: ["ผู้บันทึก", "พนักงานผู้บันทึก", "ผู้ทำรายการ"],
      ผู้ตรวจสอบ: ["ผู้ตรวจสอบ", "วิศวกรผู้ตรวจสอบ", "วิศวกร"],
      "ผู้เบิก/คนขับ": ["ผู้เบิก/คนขับ", "ผู้เบิก", "คนขับ", "คนขับรถ", "พนักงานขับรถ", "ชื่อคนขับ", "ชื่อผู้เบิก"],
      ทะเบียน: ["ทะเบียน", "ทะเบียนรถ", "รหัสเครื่องจักร", "ทะเบียน/รหัสเครื่องจักร", "รถยนต์", "เบอร์รถ"]
    };

    for (const std in aliasMap) {
      if (aliasMap[std].some((alias) => alias.toLowerCase() === h)) {
        if (type === "receipts" && std === "วันที่") continue;
        if (type === "disbursements" && std === "วันที่รับเข้า") continue;
        if (type === "receipts" && std === "จำนวนที่จ่าย") continue;
        if (type === "disbursements" && std === "จำนวนที่ซื้อ") continue;
        return std;
      }
    }
    return csvHeader;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSelected(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file, "UTF-8");
  };

  const triggerPreview = () => {
    if (!csvText) return;

    const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length < 2) {
      showToast("ไฟล์สเปรดชีตไม่สมบูรณ์", "ไม่พบแถวข้อมูลสำหรับประมวลผล", "error");
      return;
    }

    const headers = parseLine(lines[0]);
    const list: any[] = [];
    const prefix = type === "receipts" ? "REC" : "DISB";
    const year = new Date().getFullYear();

    for (let i = 1; i < lines.length; i++) {
      const cells = parseLine(lines[i]);
      // Skip empty line structures
      if (cells.length === 0 || (cells.length === 1 && cells[0] === "")) continue;

      const obj: { [key: string]: any } = {
        IDรายการ: `${prefix}-${year}-${String(100 + i).padStart(3, "0")}`,
        สถานะ: "รอตรวจสอบ"
      };

      headers.forEach((h, colIdx) => {
        const stdHeader = resolveHeaderStandard(h);
        if (cells[colIdx] !== undefined) {
          let cellVal = cells[colIdx];
          if (/^-?[\d,]+(?:\.\d+)?$/.test(cellVal)) {
            cellVal = cellVal.replace(/,/g, ""); // Clean numeric commas
          }
          obj[stdHeader] = cellVal;
        }
      });

      // Recalculate totals dynamically
      if (type === "receipts") {
        const qty = parseFloat(obj["จำนวนที่ซื้อ"]) || 0;
        const price = parseFloat(obj["ราคา"]) || 0;
        const other = parseFloat(obj["ต้นทุนอื่นๆ"]) || 0;
        obj["จำนวนที่ซื้อ"] = qty;
        obj["ราคา"] = price;
        obj["ต้นทุนอื่นๆ"] = other;
        obj["มูลค่ารวม"] = (qty * price) + other;
      } else {
        const qty = parseFloat(obj["จำนวนที่จ่าย"]) || 0;
        const price = parseFloat(obj["ราคา"]) || 0;
        obj["จำนวนที่จ่าย"] = qty;
        obj["ราคา"] = price;
        obj["มูลค่ารวม"] = qty * price;
      }

      list.push(obj);
    }

    if (list.length === 0) {
      showToast("ไฟล์สเปรดชีตไม่สมบูรณ์", "ไม่มีแถวข้อมูลที่สามารถประมวลผลได้", "error");
      return;
    }

    // Detect missing master data elements
    const tanksInCsv = Array.from(new Set(list.map((r) => r["ชื่อสินค้า (คลัง)"]).filter(Boolean))) as string[];
    const projectsInCsv = Array.from(new Set(list.map((r) => r["โครงการ"]).filter(Boolean))) as string[];
    const merchantsInCsv = type === "receipts" 
      ? Array.from(new Set(list.map((r) => r["ร้านค้า"]).filter(Boolean))) as string[] 
      : [];
    const vehiclesInCsv = type === "disbursements"
      ? Array.from(new Set(list.map((r) => r["ทะเบียน"]).filter(Boolean))) as string[]
      : [];

    const existingTanks = db.tanks.map((t) => t["ชื่อคลัง/ถังเก็บ"].trim().toLowerCase());
    const existingProjects = db.projects.map((p) => p["ชื่อโครงการ/ไซต์งาน"].trim().toLowerCase());
    const existingMerchants = db.merchants.map((m) => m["ชื่อร้านค้า/ผู้ให้บริการ"].trim().toLowerCase());
    const existingVehicles = db.vehicles.map((v) => v["ทะเบียน/รหัสเครื่องจักร"].trim().toLowerCase());

    const missingT = tanksInCsv.filter((t) => !existingTanks.includes(t.trim().toLowerCase()));
    const missingP = projectsInCsv.filter((p) => !existingProjects.includes(p.trim().toLowerCase()));
    const missingM = merchantsInCsv.filter((m) => !existingMerchants.includes(m.trim().toLowerCase()));
    const missingV = vehiclesInCsv.filter((v) => !existingVehicles.includes(v.trim().toLowerCase()));

    setMissingTanks(missingT);
    setMissingProjects(missingP);
    setMissingMerchants(missingM);
    setMissingVehicles(missingV);

    setParsedRows(list);
    setPreviewActive(true);
  };

  const executeImport = () => {
    setImporting(true);
    setProgressPct(10);
    const log: string[] = ["// เริ่มต้นประมวลผลข้อมูลนำเข้า...", `// ยอดนำเข้าทั้งหมด: ${parsedRows.length} รายการ`];
    setProgressLog(log);

    const newTanks: Tank[] = [];
    const newProjects: Project[] = [];
    const newMerchants: Merchant[] = [];
    const newVehicles: Vehicle[] = [];

    if (autoRegisterMaster) {
      log.push(`🔄 ตรวจสอบและลงทะเบียนข้อมูลระบบหลักอัตโนมัติ...`);
      
      // Auto register missing Tanks/Stores
      missingTanks.forEach((tName) => {
        const matchingRow = parsedRows.find(row => row["ชื่อสินค้า (คลัง)"] === tName);
        const unit = matchingRow ? matchingRow["หน่วยนับ"] || "ลิตร" : "ลิตร";
        const price = matchingRow ? parseFloat(matchingRow["ราคา"]) || 0 : 30.00;
        
        let typeMaterial = "น้ำมันดีเซลหมุนเร็ว";
        let maxCap = 50000;
        if (tName.toLowerCase().includes("บัตร") || tName.toLowerCase().includes("fleet") || tName.toLowerCase().includes("ppt")) {
          typeMaterial = "วงเงินบัตรเติมน้ำมัน";
          maxCap = 200000;
        } else if (tName.toLowerCase().includes("ยาง") || tName.toLowerCase().includes("crs") || tName.toLowerCase().includes("ac")) {
          typeMaterial = "ยางมะตอย AC-20";
          maxCap = 50000;
        }

        const newTankId = `TANK-${String(db.tanks.length + 1 + newTanks.length).padStart(2, "0")}`;
        newTanks.push({
          IDถัง: newTankId,
          "ชื่อคลัง/ถังเก็บ": tName,
          ประเภทวัสดุ: typeMaterial,
          ความจุสูงสุด: maxCap,
          ปริมาณคงเหลือปัจจุบัน: 0, 
          เกณฑ์แจ้งเตือนต่ำวิกฤต: Math.round(maxCap * 0.15),
          ราคาน้ำมันอ้างอิง: price,
          หน่วยนับ: unit
        });
        log.push(`✅ [ลงทะเบียนคลังใหม่] ${tName} -> รหัส ${newTankId}`);
      });

      // Auto register missing Projects
      missingProjects.forEach((pName) => {
        newProjects.push({
          "ชื่อโครงการ/ไซต์งาน": pName
        });
        log.push(`✅ [ลงทะเบียนโครงการใหม่] ${pName}`);
      });

      // Auto register missing Merchants
      missingMerchants.forEach((mName) => {
        const newMerchantId = `MER-${String(db.merchants.length + 1 + newMerchants.length).padStart(2, "0")}`;
        newMerchants.push({
          IDผู้ค้า: newMerchantId,
          "ชื่อร้านค้า/ผู้ให้บริการ": mName
        });
        log.push(`✅ [ลงทะเบียนร้านค้าใหม่] ${mName} -> รหัส ${newMerchantId}`);
      });

      // Auto register missing Vehicles
      missingVehicles.forEach((vName) => {
        const matchingRow = parsedRows.find(row => row["ทะเบียน"] === vName);
        const driver = matchingRow ? matchingRow["ผู้เบิก/คนขับ"] || "ไม่ระบุพนักงานขับ" : "ไม่ระบุพนักงานขับ";

        const newVehicleId = `VEH-${String(db.vehicles.length + 1 + newVehicles.length).padStart(3, "0")}`;
        newVehicles.push({
          IDรถ: newVehicleId,
          "ทะเบียน/รหัสเครื่องจักร": vName,
          พนักงานขับรถประจำคัน: driver
        });
        log.push(`✅ [ลงทะเบียนรถใหม่] ${vName} (คนขับ: ${driver}) -> รหัส ${newVehicleId}`);
      });
    }

    setProgressLog([...log]);

    // Simulate batch uploading of chunks
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      const pct = Math.min(100, 20 + step * 25);
      setProgressPct(pct);

      if (step === 1) {
        log.push(`⏳ กำลังจับคู่บิลพัสดุ เข้ากับระบบโครงการก่อสร้างปลายทาง...`);
        setProgressLog([...log]);
      } else if (step === 2) {
        log.push(`⏳ ปรับเกณฑ์ดัชนีคงเหลือในระบบคลังพัสดุ...`);
        setProgressLog([...log]);
      } else if (step === 3) {
        log.push(`🎉 [เสร็จสิ้น] นำเข้าประวัติพัสดุรวม ${parsedRows.length} รายการ เรียบร้อยสมบูรณ์!`);
        setProgressLog([...log]);
        clearInterval(interval);

        setTimeout(() => {
          onImportComplete(parsedRows, {
            newTanks,
            newProjects,
            newMerchants,
            newVehicles
          });
          showToast(
            "นำเข้าข้อมูลสำเร็จ",
            `ระบบได้นำเข้ารายการ ${parsedRows.length} แถว และอัปเดตข้อมูลระบบหลัก ${newTanks.length + newProjects.length + newMerchants.length + newVehicles.length} รายการเรียบร้อยแล้ว`,
            "success"
          );
          onClose();
          resetState();
        }, 800);
      }
    }, 600);
  };

  const downloadReceiptTemplate = () => {
    const csvContent = 
      "วันที่รับเข้า,ร้านค้า,ชื่อสินค้า (คลัง),หมวดหมู่,ราคา,หน่วยนับ,จำนวนที่ซื้อ,ต้นทุนอื่นๆ,มูลค่ารวม,หมายเหตุ,โครงการ,เลขที่ใบสั่งชื้อ (PO),เลขที่ใบส่งสินค้า,สถานที่ส่ง,วันที่ครบกำหนดจ่าย,วันที่จ่าย,ผู้บันทึก,ผู้ตรวจสอบ\n" +
      "30/08/2568,บริษัท จักราชการปิโตรเลียม จำกัด,น้ำมันดีเซล (ออยเลอร์ ทบ.83-7829),น้ำมันดีเซล,29.85,ลิตร,5000,0,149250.00,,(38)ทล.24 อ.ปราสาท-อ.สังขะ ตอน2 จ.สุรินทร์ (ปี2568),PO6800077,0681/30,แพล้นปราสาท,,,แพรวพรรณ,TRUE\n" +
      "05/08/2568,บริษัท พีพีที 2024 จำกัด,บัตร PPT 2221126208 (BTC 00),บัตรเติมน้ำมัน PPT,1.00,บาท,10000,0,10000.00,,(38)ทล.24 อ.ปราสาท-อ.สังขะ ตอน2 จ.สุรินทร์ (ปี2568),,,เติมเงินเข้า บัตร PPT,,,,FALSE\n" +
      "15/09/2568,บริษัท จักราชการปิโตรเลียม จำกัด,น้ำมันดีเซล (ออยเลอร์ ทบ.83-7829),น้ำมันดีเซล,29.85,ลิตร,5000,0,149250.00,,(38)ทล.24 อ.ปราสาท-อ.สังขะ ตอน2 จ.สุรินทร์ (ปี2568),PO6800101,,,,,FALSE\n";
    triggerDownload(csvContent, "template_receipts_sample.csv");
  };

  const downloadDisbursementTemplate = () => {
    const csvContent =
      "วันที่,ชื่อสินค้า (คลัง),ราคา,หน่วยนับ,จำนวนที่จ่าย,มูลค่ารวม,หมายเหตุ,โครงการ,ผู้เบิก/คนขับ,ทะเบียน,ผู้บันทึก,ผู้ตรวจสอบ\n" +
      "01/09/2568,น้ำมันดีเซล (ออยเลอร์ ทบ.83-7829),29.85,ลิตร,50.21,1498.77,,(38)ทล.24 อ.ปราสาท-อ.สังขะ ตอน2 จ.สุรินทร์ (ปี2568),,รถเฮี๊ยบ 83-8192,พิมพ์ผกา เปลื้องหน่าย,FALSE\n" +
      "31/08/2568,บัตร PPT 2221126208 (BTC 00),1.00,บาท,34280.40,34280.40,,(38)ทล.24 อ.ปราสาท-อ.สังขะ ตอน2 จ.สุรินทร์ (ปี2568),รถบริษัท,,,FALSE\n" +
      "03/09/2568,น้ำมันดีเซล (ออยเลอร์ ทบ.83-7829),29.85,ลิตร,100.27,2993.06,,(38)ทล.24 อ.ปราสาท-อ.สังขะ ตอน2 จ.สุรินทร์ (ปี2568),สมเกียรติ เจรจา,รถแบคโฮ ตง-5524,พิมพ์ผกา เปลื้องหน่าย,FALSE\n" +
      "05/08/2568,บัตร PPT 2221126208 (BTC 00),1.00,บาท,2950.00,2950.00,,(38)ทล.24 อ.ปราสาท-อ.สังขะ ตอน2 จ.สุรินทร์ (ปี2568),ธณัฐ์ชัย อินทร์ตา,,,FALSE\n";
    triggerDownload(csvContent, "template_disbursements_sample.csv");
  };

  const triggerDownload = (content: string, filename: string) => {
    // Prefix UTF-8 Byte Order Mark (BOM) so MS Excel opens Thai characters beautifully
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const headersToShow = type === "receipts"
    ? ["IDรายการ", "วันที่รับเข้า", "ร้านค้า", "ชื่อสินค้า (คลัง)", "จำนวนที่ซื้อ", "มูลค่ารวม", "โครงการ"]
    : ["IDรายการ", "วันที่", "ชื่อสินค้า (คลัง)", "จำนวนที่จ่าย", "มูลค่ารวม", "ผู้เบิก/คนขับ", "ทะเบียน", "โครงการ"];

  const hasMissingMaster = missingTanks.length > 0 || missingProjects.length > 0 || missingMerchants.length > 0 || missingVehicles.length > 0;

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
            <div className="bg-emerald-600 text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-100" />
                <h3 className="text-sm font-black">
                  นำเข้าพัสดุสะสมจากไฟล์สเปรดชีต CSV ({type === "receipts" ? "บิลรับเข้า" : "บิลเบิกจ่าย"})
                </h3>
              </div>
              <button onClick={() => { onClose(); resetState(); }} className="text-white/80 hover:text-white transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!previewActive && !importing && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Guidelines Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-start space-x-2 text-slate-800">
                      <Info className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs font-black">คำแนะนำโครงสร้างคอลัมน์ในสเปรดชีต:</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-medium">
                          รองรับการนำเข้าข้อมูลจากระบบสเปรดชีตผ่านไฟล์ <code className="bg-slate-200/60 px-1 py-0.5 rounded text-slate-700">.csv</code> (UTF-8) ระบบตรวจจับชื่อหัวตารางภาษาไทยแบบยืดหยุ่น เช่น <span className="font-bold text-slate-600">วันที่, ชื่อสินค้า (คลัง), ราคา, หน่วยนับ, จำนวนที่จ่าย, มูลค่ารวม, โครงการ, ทะเบียน, ผู้เบิก</span> โดยอัตโนมัติ หากไม่มีข้อมูลคลังหรือโครงการในระบบหลัก ระบบจะเปิดระบบลงทะเบียนให้ท่านก่อนการยืนยัน
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dropzone */}
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 transition cursor-pointer relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2 text-slate-500">
                      <UploadCloud className="w-10 h-10 mx-auto text-slate-400" />
                      <p className="text-xs font-black text-slate-700" id="csv-file-status">
                        {fileSelected ? `เลือกไฟล์สำเร็จ: ${fileName}` : "คลิกเพื่ออัปโหลดไฟล์ หรือลากและวางไฟล์ CSV ของคุณลงในช่องนี้"}
                      </p>
                      <p className="text-[10px] text-slate-450 font-bold">เฉพาะไฟล์ .csv ที่เปิดด้วย MS Excel ภาษาไทยได้ปกติ</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Grid with Master Registration Detection */}
              {previewActive && !importing && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Status Banner */}
                  <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl">
                    <div>
                      <h4 className="text-xs font-black text-indigo-900 flex items-center">
                        <SearchCheck className="w-4 h-4 mr-1.5" />
                        ผลการจำลองแมปข้อมูลสเปรดชีต (Pre-Check Parser Grid)
                      </h4>
                      <p className="text-[10px] text-indigo-700 mt-0.5 font-bold">
                        ทำความสะอาดตัวเลข คอมมา และคำขยะโดยอัตโนมัติพร้อมสำหรับการนำเข้า
                      </p>
                    </div>
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full">
                      ตรวจพบ {parsedRows.length} รายการ
                    </span>
                  </div>

                  {/* Master Data Registration Detection Section */}
                  {hasMissingMaster ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start space-x-2 text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0 animate-bounce" />
                        <div>
                          <h4 className="text-xs font-black">ตรวจพบข้อมูลใหม่ที่ไม่มีในระบบระบบหลักหลัก (Missing Master Data Detected)</h4>
                          <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed font-bold">
                            ระบบพบรายการในไฟล์นำเข้าที่ยังไม่ได้ลงทะเบียนในสารบบหลัก หากยืนยันระบบหลักจะลงทะเบียนข้อมูลเหล่านี้ให้อัตโนมัติ:
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-medium text-slate-700 bg-white/70 border border-amber-100 p-3.5 rounded-xl">
                        {missingTanks.length > 0 && (
                          <div>
                            <span className="font-extrabold text-amber-800">📦 คลังสินค้า/ถังเก็บใหม่ ({missingTanks.length}):</span>
                            <p className="text-slate-500 font-bold truncate">{missingTanks.join(", ")}</p>
                          </div>
                        )}
                        {missingProjects.length > 0 && (
                          <div>
                            <span className="font-extrabold text-amber-800">🚧 โครงการก่อสร้างใหม่ ({missingProjects.length}):</span>
                            <p className="text-slate-500 font-bold truncate">{missingProjects.join(", ")}</p>
                          </div>
                        )}
                        {missingMerchants.length > 0 && (
                          <div>
                            <span className="font-extrabold text-amber-800">🏪 ร้านค้าผู้จัดส่งใหม่ ({missingMerchants.length}):</span>
                            <p className="text-slate-500 font-bold truncate">{missingMerchants.join(", ")}</p>
                          </div>
                        )}
                        {missingVehicles.length > 0 && (
                          <div>
                            <span className="font-extrabold text-amber-800">🚛 ทะเบียนรถ/เครื่องจักรใหม่ ({missingVehicles.length}):</span>
                            <p className="text-slate-500 font-bold truncate">{missingVehicles.join(", ")}</p>
                          </div>
                        )}
                      </div>

                      {/* Auto register checkbox */}
                      <button
                        type="button"
                        onClick={() => setAutoRegisterMaster(!autoRegisterMaster)}
                        className="flex items-center space-x-2 text-[11px] font-black text-amber-900 cursor-pointer select-none py-1 hover:text-amber-950 transition"
                      >
                        {autoRegisterMaster ? (
                          <CheckSquare className="w-4.5 h-405 text-amber-600 fill-amber-100" />
                        ) : (
                          <Square className="w-4.5 h-4.5 text-slate-350" />
                        )}
                        <span>อนุญาตให้ระบบลงทะเบียน ข้อมูลหลัก อัตโนมัติ (แนะนำ เพื่อความลื่นไหลของระบบบัญชี)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-black px-3.5 py-2.5 rounded-2xl">
                      ✅ ตรวจสอบข้อมูลหลักสมบูรณ์ครบถ้วน ไม่พบข้อมูลค้างลงทะเบียนใดๆ ในสเปรดชีตนี้
                    </div>
                  )}

                  {/* Excel Sheet Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-[220px] shadow-inner bg-slate-50">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead className="bg-slate-800 text-white font-black border-b sticky top-0">
                        <tr>
                          {headersToShow.map((h) => (
                            <th key={h} className="py-2.5 px-3 border-r border-slate-700 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white font-bold text-slate-700">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 border-b">
                            {headersToShow.map((h) => {
                              const val = row[h];
                              return (
                                <td key={h} className="py-2 px-3 border-r border-slate-100 truncate max-w-[160px]">
                                  {typeof val === "number" ? formatNumber(val, 2) : String(val || "-")}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Progress view */}
              {importing && (
                <div className="space-y-4 py-6 animate-in fade-in duration-200">
                  <div className="text-center space-y-2">
                    <div className="inline-flex bg-indigo-50 text-indigo-700 p-3.5 rounded-full">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-black text-slate-800">กำลังนำเข้าและประสานระบบหลักพัสดุ...</h4>
                    <p className="text-xs text-slate-500 font-bold">บันทึกแถวยอดระบบและปริมาตรสะสม...</p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl text-[10px] font-mono leading-relaxed h-[150px] overflow-y-auto">
                    {progressLog.map((log, lIdx) => (
                      <p key={lIdx} className={log.startsWith("❌") ? "text-rose-400" : "text-emerald-400"}>
                        {log}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex justify-end space-x-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => { onClose(); resetState(); }}
                  className="text-xs text-slate-600 hover:text-slate-800 border px-4 py-2 rounded-xl font-bold cursor-pointer transition hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                {!previewActive && !importing && (
                  <button
                    type="button"
                    disabled={!fileSelected}
                    onClick={triggerPreview}
                    className={`text-xs text-white px-5 py-2.5 rounded-xl font-black shadow-md cursor-pointer transition ${
                      fileSelected ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-300 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    ตรวจสอบความเข้ากันได้
                  </button>
                )}
                {previewActive && !importing && (
                  <button
                    type="button"
                    onClick={executeImport}
                    className="text-xs text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl font-black shadow-md cursor-pointer transition"
                  >
                    ยืนยันนำเข้าข้อมูลสะสม
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
