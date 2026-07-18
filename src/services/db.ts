/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tank, Vehicle, Project, Merchant, User, Receipt, Disbursement } from "../types";

export interface Database {
  tanks: Tank[];
  vehicles: Vehicle[];
  projects: Project[];
  merchants: Merchant[];
  users: User[];
  receipts: Receipt[];
  disbursements: Disbursement[];
}

const STORAGE_KEY = "sdms_premium_db";

const DEFAULT_TANKS: Tank[] = [
  {
    IDถัง: "TANK-01",
    "ชื่อคลัง/ถังเก็บ": "ถังดีเซลคลังใหญ่ (แคมป์บุรีรัมย์)",
    ประเภทวัสดุ: "น้ำมันดีเซลหมุนเร็ว",
    ความจุสูงสุด: 30000,
    ปริมาณคงเหลือปัจจุบัน: 18500,
    เกณฑ์แจ้งเตือนต่ำวิกฤต: 5000,
    ราคาน้ำมันอ้างอิง: 32.50,
    หน่วยนับ: "ลิตร"
  },
  {
    IDถัง: "TANK-02",
    "ชื่อคลัง/ถังเก็บ": "ถังยางมะตอยอุ่น AC-20 (ไซโล B)",
    ประเภทวัสดุ: "ยางมะตอย AC-20",
    ความจุสูงสุด: 50000,
    ปริมาณคงเหลือปัจจุบัน: 12000,
    เกณฑ์แจ้งเตือนต่ำวิกฤต: 10000,
    ราคาน้ำมันอ้างอิง: 24.00,
    หน่วยนับ: "กิโลกรัม"
  },
  {
    IDถัง: "TANK-03",
    "ชื่อคลัง/ถังเก็บ": "บัตรเติมน้ำมันดีเซล Fleet Card (สิบล้อ)",
    ประเภทวัสดุ: "วงเงินบัตรเติมน้ำมัน",
    ความจุสูงสุด: 100000,
    ปริมาณคงเหลือปัจจุบัน: 78000,
    เกณฑ์แจ้งเตือนต่ำวิกฤต: 20000,
    ราคาน้ำมันอ้างอิง: 1.00,
    หน่วยนับ: "บาท"
  },
  {
    IDถัง: "TANK-04",
    "ชื่อคลัง/ถังเก็บ": "บัตรเติมน้ำมันแก๊สโซฮอล์ Fleet Card (รถผู้ควบคุม)",
    ประเภทวัสดุ: "วงเงินบัตรเติมน้ำมัน",
    ความจุสูงสุด: 50000,
    ปริมาณคงเหลือปัจจุบัน: 15000,
    เกณฑ์แจ้งเตือนต่ำวิกฤต: 10000,
    ราคาน้ำมันอ้างอิง: 1.00,
    หน่วยนับ: "บาท"
  }
];

const DEFAULT_VEHICLES: Vehicle[] = [
  { IDรถ: "VEH-001", "ทะเบียน/รหัสเครื่องจักร": "83-1234 บุรีรัมย์", พนักงานขับรถประจำคัน: "นายสมชาย ใจดี" },
  { IDรถ: "VEH-002", "ทะเบียน/รหัสเครื่องจักร": "84-5678 บุรีรัมย์", พนักงานขับรถประจำคัน: "นายประหยัด รวดเร็ว" },
  { IDรถ: "VEH-003", "ทะเบียน/รหัสเครื่องจักร": "EX-200 KOMATSU", พนักงานขับรถประจำคัน: "นายวิชัย ทนทาน" }
];

const DEFAULT_PROJECTS: Project[] = [
  { "ชื่อโครงการ/ไซต์งาน": "โครงการถนนทางหลวงหมายเลข 218 บุรีรัมย์-นางรอง" },
  { "ชื่อโครงการ/ไซต์งาน": "โครงการปรับปรุงทางต่างระดับสามแยกประโคนชัย" },
  { "ชื่อโครงการ/ไซต์งาน": "โครงการก่อสร้างเลี่ยงเมืองบุรีรัมย์ (ฝั่งใต้)" }
];

const DEFAULT_MERCHANTS: Merchant[] = [
  { IDผู้ค้า: "MER-01", "ชื่อร้านค้า/ผู้ให้บริการ": "บจก. ปตท. น้ำมันและการค้าปลีก" },
  { IDผู้ค้า: "MER-02", "ชื่อร้านค้า/ผู้ให้บริการ": "บมจ. พีทีจี เอ็นเนอยี" },
  { IDผู้ค้า: "MER-03", "ชื่อร้านค้า/ผู้ให้บริการ": "โรงกลั่นยางมะตอยนครราชสีมา" }
];

const DEFAULT_USERS: User[] = [
  { Username: "admin", Password: "123", Name: "คุณสมศักดิ์ ผู้จัดการระบบ", Role: "ผู้ดูแลระบบสูงสุด" },
  { Username: "inspector", Password: "123", Name: "วิศวกรธีรพล ผู้ตรวจสอบ", Role: "ผู้ตรวจสอบ" },
  { Username: "operator", Password: "123", Name: "สมหญิง เสมียนคลัง", Role: "ผู้บันทึกข้อมูล" }
];

const DEFAULT_RECEIPTS: Receipt[] = [
  {
    IDรายการ: "REC-2026-001",
    วันที่รับเข้า: "2026-07-10",
    ร้านค้า: "บจก. ปตท. น้ำมันและการค้าปลีก",
    "ชื่อสินค้า (คลัง)": "ถังดีเซลคลังใหญ่ (แคมป์บุรีรัมย์)",
    ประเภทวัสดุ: "น้ำมันดีเซลหมุนเร็ว",
    ราคา: 32.50,
    หน่วยนับ: "ลิตร",
    จำนวนที่ซื้อ: 10000,
    ต้นทุนอื่นๆ: 1500,
    มูลค่ารวม: 326500,
    หมายเหตุ: "บิลส่งของรอบปกติแคมป์แรก",
    โครงการ: "โครงการถนนทางหลวงหมายเลข 218 บุรีรัมย์-นางรอง",
    "เลขที่ใบสั่งชื้อ (PO)": "PO-2026-0098",
    เลขที่ใบส่งสินค้า: "DO-99214A",
    สถานที่ส่ง: "คลังหลักแคมป์บุรีรัมย์",
    วันที่ครบกำหนดจ่าย: "2026-08-10",
    วันที่จ่าย: "2026-07-15",
    ผู้บันทึก: "สมหญิง เสมียนคลัง",
    ผู้ตรวจสอบ: "วิศวกรธีรพล ผู้ตรวจสอบ",
    สถานะ: "อนุมัติแล้ว"
  },
  {
    IDรายการ: "REC-2026-002",
    วันที่รับเข้า: "2026-07-12",
    ร้านค้า: "โรงกลั่นยางมะตอยนครราชสีมา",
    "ชื่อสินค้า (คลัง)": "ถังยางมะตอยอุ่น AC-20 (ไซโล B)",
    ประเภทวัสดุ: "ยางมะตอย AC-20",
    ราคา: 24.00,
    หน่วยนับ: "กิโลกรัม",
    จำนวนที่ซื้อ: 5000,
    ต้นทุนอื่นๆ: 3000,
    มูลค่ารวม: 123000,
    หมายเหตุ: "ยางเหนียวคุณภาพสูงล็อตบ่าย",
    โครงการ: "โครงการปรับปรุงทางต่างระดับสามแยกประโคนชัย",
    "เลขที่ใบสั่งชื้อ (PO)": "PO-2026-0105",
    เลขที่ใบส่งสินค้า: "DO-55291",
    สถานที่ส่ง: "ไซโลเก็บฝั่งขวา",
    วันที่ครบกำหนดจ่าย: "2026-08-12",
    วันที่จ่าย: "",
    ผู้บันทึก: "สมหญิง เสมียนคลัง",
    ผู้ตรวจสอบ: "",
    สถานะ: "รอตรวจสอบ"
  }
];

const DEFAULT_DISBURSEMENTS: Disbursement[] = [
  {
    IDรายการ: "DISB-2026-001",
    วันที่: "2026-07-14",
    "ชื่อสินค้า (คลัง)": "ถังดีเซลคลังใหญ่ (แคมป์บุรีรัมย์)",
    ราคา: 32.50,
    หน่วยนับ: "ลิตร",
    จำนวนที่จ่าย: 1200,
    มูลค่ารวม: 39000,
    หมายเหตุ: "เติมสิบล้อหัวลากงานหน้าเหมือง",
    โครงการ: "โครงการถนนทางหลวงหมายเลข 218 บุรีรัมย์-นางรอง",
    "ผู้เบิก/คนขับ": "นายสมชาย ใจดี",
    ทะเบียน: "83-1234 บุรีรัมย์",
    ผู้บันทึก: "สมหญิง เสมียนคลัง",
    ผู้ตรวจสอบ: "วิศวกรธีรพล ผู้ตรวจสอบ",
    สถานะ: "อนุมัติแล้ว"
  },
  {
    IDรายการ: "DISB-2026-002",
    วันที่: "2026-07-15",
    "ชื่อสินค้า (คลัง)": "บัตรเติมน้ำมันดีเซล Fleet Card (สิบล้อ)",
    ราคา: 1.00,
    หน่วยนับ: "บาท",
    จำนวนที่จ่าย: 5000,
    มูลค่ารวม: 5000,
    หมายเหตุ: "เบิกวงเงินค่าน้ำมันรถขนดิน",
    โครงการ: "โครงการก่อสร้างเลี่ยงเมืองบุรีรัมย์ (ฝั่งใต้)",
    "ผู้เบิก/คนขับ": "นายประหยัด รวดเร็ว",
    ทะเบียน: "84-5678 บุรีรัมย์",
    ผู้บันทึก: "สมหญิง เสมียนคลัง",
    ผู้ตรวจสอบ: "",
    สถานะ: "รอตรวจสอบ"
  }
];

export function getDatabase(): Database {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const db: Database = {
      tanks: DEFAULT_TANKS,
      vehicles: DEFAULT_VEHICLES,
      projects: DEFAULT_PROJECTS,
      merchants: DEFAULT_MERCHANTS,
      users: DEFAULT_USERS,
      receipts: DEFAULT_RECEIPTS,
      disbursements: DEFAULT_DISBURSEMENTS
    };
    saveDatabase(db);
    return db;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    const db: Database = {
      tanks: DEFAULT_TANKS,
      vehicles: DEFAULT_VEHICLES,
      projects: DEFAULT_PROJECTS,
      merchants: DEFAULT_MERCHANTS,
      users: DEFAULT_USERS,
      receipts: DEFAULT_RECEIPTS,
      disbursements: DEFAULT_DISBURSEMENTS
    };
    saveDatabase(db);
    return db;
  }
}

export function saveDatabase(db: Database): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetDatabase(): Database {
  const db: Database = {
    tanks: DEFAULT_TANKS,
    vehicles: DEFAULT_VEHICLES,
    projects: DEFAULT_PROJECTS,
    merchants: DEFAULT_MERCHANTS,
    users: DEFAULT_USERS,
    receipts: DEFAULT_RECEIPTS,
    disbursements: DEFAULT_DISBURSEMENTS
  };
  saveDatabase(db);
  return db;
}

// Helper to handle stock balance of a Tank based on transaction states
export function recalculateTankStocks(db: Database): Database {
  // Start with tank definitions but with zero stock
  // We want to calculate from baseline stock if we had a proper stock card ledger.
  // But in this system, "ปริมาณคงเหลือปัจจุบัน" is directly adjusted by transaction approvals.
  // Let's implement incremental updates during transition states.
  return db;
}

// Incrementally updates tank stock upon approval or disapproval
export function adjustStockForTransaction(
  db: Database,
  type: "receipt" | "disbursement",
  tankName: string,
  qty: number,
  direction: "add" | "subtract"
): Database {
  const tankIndex = db.tanks.findIndex(t => t["ชื่อคลัง/ถังเก็บ"] === tankName);
  if (tankIndex !== -1) {
    const tank = db.tanks[tankIndex];
    const change = direction === "add" ? qty : -qty;
    const nextStock = tank.ปริมาณคงเหลือปัจจุบัน + change;
    // Keep between 0 and maximum capacity
    tank.ปริมาณคงเหลือปัจจุบัน = Math.max(0, Math.min(tank.ความจุสูงสุด, nextStock));
    db.tanks[tankIndex] = tank;
  }
  return db;
}
