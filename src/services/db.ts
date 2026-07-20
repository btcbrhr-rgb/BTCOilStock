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
export const SHEETS_URL_KEY = "sdms_sheets_url";

export const DEFAULT_USERS: User[] = [
  { Username: "admin", Password: "123", Name: "ผู้ดูแลระบบสูงสุด (Admin)", Role: "ผู้ดูแลระบบสูงสุด" }
];

export const DEFAULT_TANKS: Tank[] = [
  {
    IDถัง: "TNK-001",
    "ชื่อคลัง/ถังเก็บ": "ถังเหล็กดีเซลไซต์งาน A (10,000L)",
    ประเภทวัสดุ: "ดีเซลหมุนเร็ว B7",
    ความจุสูงสุด: 10000,
    ปริมาณคงเหลือปัจจุบัน: 7850.50,
    เกณฑ์แจ้งเตือนต่ำวิกฤต: 2000,
    ราคาน้ำมันอ้างอิง: 32.94,
    หน่วยนับ: "ลิตร"
  },
  {
    IDถัง: "TNK-002",
    "ชื่อคลัง/ถังเก็บ": "ถังเหล็กดีเซลแคมป์ B (5,000L)",
    ประเภทวัสดุ: "ดีเซลหมุนเร็ว B7",
    ความจุสูงสุด: 5000,
    ปริมาณคงเหลือปัจจุบัน: 1250.00,
    เกณฑ์แจ้งเตือนต่ำวิกฤต: 1000,
    ราคาน้ำมันอ้างอิง: 32.94,
    หน่วยนับ: "ลิตร"
  },
  {
    IDถัง: "TNK-003",
    "ชื่อคลัง/ถังเก็บ": "บัตรเติมน้ำมัน Fleet Card (กองกลาง)",
    ประเภทวัสดุ: "ดีเซล Fleet Card",
    ความจุสูงสุด: 100000,
    ปริมาณคงเหลือปัจจุบัน: 45000.00,
    เกณฑ์แจ้งเตือนต่ำวิกฤต: 15000,
    ราคาน้ำมันอ้างอิง: 33.50,
    หน่วยนับ: "บาท"
  },
  {
    IDถัง: "TNK-004",
    "ชื่อคลัง/ถังเก็บ": "ถังเก็บยางมะตอยไซต์ C (30,000kg)",
    ประเภทวัสดุ: "ยางแอสฟัลต์ CSS-1",
    ความจุสูงสุด: 30000,
    ปริมาณคงเหลือปัจจุบัน: 18900.00,
    เกณฑ์แจ้งเตือนต่ำวิกฤต: 5000,
    ราคาน้ำมันอ้างอิง: 28.50,
    หน่วยนับ: "กิโลกรัม"
  }
];

export const DEFAULT_VEHICLES: Vehicle[] = [
  {
    IDรถ: "VEH-001",
    "ทะเบียน/รหัสเครื่องจักร": "10-5432 บุรีรัมย์ (รถสิบล้อ)",
    พนักงานขับรถประจำคัน: "นายสมชาย ใจดี"
  },
  {
    IDรถ: "VEH-002",
    "ทะเบียน/รหัสเครื่องจักร": "ถข-9999 กรุงเทพ (รถตักดิน)",
    พนักงานขับรถประจำคัน: "นายวิชัย รักชาติ"
  },
  {
    IDรถ: "VEH-003",
    "ทะเบียน/รหัสเครื่องจักร": "8ก-8888 บุรีรัมย์ (รถบดถนน)",
    พนักงานขับรถประจำคัน: "นายสมศักดิ์ ขยันงาน"
  }
];

export const DEFAULT_PROJECTS: Project[] = [
  { "ชื่อโครงการ/ไซต์งาน": "โครงการถนนสายทางหลวงแผ่นดิน 244 (ช่วงบุรีรัมย์-ประโคนชัย)" },
  { "ชื่อโครงการ/ไซต์งาน": "ไซต์งานก่อสร้างสะพานข้ามแยกประโคนชัย" },
  { "ชื่อโครงการ/ไซต์งาน": "แคมป์พักคนงานก่อสร้างบุรีรัมย์ (กองกลาง)" }
];

export const DEFAULT_MERCHANTS: Merchant[] = [
  { IDผู้ค้า: "MER-001", "ชื่อร้านค้า/ผู้ให้บริการ": "ปั๊ม ปตท. บุรีรัมย์สามชัยบริการ" },
  { IDผู้ค้า: "MER-002", "ชื่อร้านค้า/ผู้ให้บริการ": "บจก. ค้าส่งยางมะตอยไทย" },
  { IDผู้ค้า: "MER-003", "ชื่อร้านค้า/ผู้ให้บริการ": "ปั๊มบางจาก ประโคนชัยศิริพงษ์" }
];

export const DEFAULT_RECEIPTS: Receipt[] = [
  {
    IDรายการ: "REC-001",
    วันที่รับเข้า: "2026-07-15",
    ร้านค้า: "ปั๊ม ปตท. บุรีรัมย์สามชัยบริการ",
    "ชื่อสินค้า (คลัง)": "ถังเหล็กดีเซลไซต์งาน A (10,000L)",
    ประเภทวัสดุ: "ดีเซลหมุนเร็ว B7",
    ราคา: 32.94,
    หน่วยนับ: "ลิตร",
    จำนวนที่ซื้อ: 5000,
    ต้นทุนอื่นๆ: 1500,
    มูลค่ารวม: 166200,
    หมายเหตุ: "รับน้ำมันดีเซลล็อตใหญ่เข้าคลังหลักเพื่อสำรองจ่าย",
    โครงการ: "โครงการถนนสายทางหลวงแผ่นดิน 244 (ช่วงบุรีรัมย์-ประโคนชัย)",
    "เลขที่ใบสั่งชื้อ (PO)": "PO-202607-001",
    เลขที่ใบส่งสินค้า: "INV-998877",
    สถานที่ส่ง: "ไซต์งาน A",
    วันที่ครบกำหนดจ่าย: "2026-08-15",
    วันที่จ่าย: "",
    ผู้บันทึก: "ผู้ดูแลระบบสูงสุด (Admin)",
    ผู้ตรวจสอบ: "",
    สถานะ: "อนุมัติแล้ว"
  },
  {
    IDรายการ: "REC-002",
    วันที่รับเข้า: "2026-07-18",
    ร้านค้า: "บจก. ค้าส่งยางมะตอยไทย",
    "ชื่อสินค้า (คลัง)": "ถังเก็บยางมะตอยไซต์ C (30,000kg)",
    ประเภทวัสดุ: "ยางแอสฟัลต์ CSS-1",
    ราคา: 28.50,
    หน่วยนับ: "กิโลกรัม",
    จำนวนที่ซื้อ: 10000,
    ต้นทุนอื่นๆ: 3500,
    มูลค่ารวม: 288500,
    หมายเหตุ: "จัดซื้อยางแอสฟัลต์สำหรับการบดถนนลาดยางมะตอย",
    โครงการ: "ไซต์งานก่อสร้างสะพานข้ามแยกประโคนชัย",
    "เลขที่ใบสั่งชื้อ (PO)": "PO-202607-002",
    เลขที่ใบส่งสินค้า: "INV-221144",
    สถานที่ส่ง: "ไซต์งาน C",
    วันที่ครบกำหนดจ่าย: "2026-08-18",
    วันที่จ่าย: "2026-07-19",
    ผู้บันทึก: "ผู้ดูแลระบบสูงสุด (Admin)",
    ผู้ตรวจสอบ: "",
    สถานะ: "อนุมัติแล้ว"
  }
];

export const DEFAULT_DISBURSEMENTS: Disbursement[] = [
  {
    IDรายการ: "DIS-001",
    วันที่: "2026-07-16",
    "ชื่อสินค้า (คลัง)": "ถังเหล็กดีเซลไซต์งาน A (10,000L)",
    ราคา: 32.94,
    หน่วยนับ: "ลิตร",
    จำนวนที่จ่าย: 1200,
    มูลค่ารวม: 39528,
    หมายเหตุ: "จ่ายน้ำมันรถสิบล้อสำหรับขนดินทำทางหลวง",
    โครงการ: "โครงการถนนสายทางหลวงแผ่นดิน 244 (ช่วงบุรีรัมย์-ประโคนชัย)",
    "ผู้เบิก/คนขับ": "นายสมชาย ใจดี",
    ทะเบียน: "10-5432 บุรีรัมย์ (รถสิบล้อ)",
    ผู้บันทึก: "ผู้ดูแลระบบสูงสุด (Admin)",
    ผู้ตรวจสอบ: "",
    สถานะ: "อนุมัติแล้ว"
  },
  {
    IDรายการ: "DIS-002",
    วันที่: "2026-07-17",
    "ชื่อสินค้า (คลัง)": "ถังเหล็กดีเซลไซต์งาน A (10,000L)",
    ราคา: 32.94,
    หน่วยนับ: "ลิตร",
    จำนวนที่จ่าย: 850,
    มูลค่ารวม: 27999,
    หมายเหตุ: "จ่ายน้ำมันสำหรับรถตักดินไซต์สะพาน",
    โครงการ: "ไซต์งานก่อสร้างสะพานข้ามแยกประโคนชัย",
    "ผู้เบิก/คนขับ": "นายวิชัย รักชาติ",
    ทะเบียน: "ถข-9999 กรุงเทพ (รถตักดิน)",
    ผู้บันทึก: "ผู้ดูแลระบบสูงสุด (Admin)",
    ผู้ตรวจสอบ: "",
    สถานะ: "อนุมัติแล้ว"
  }
];

export function getDatabase(): Database {
  return {
    tanks: DEFAULT_TANKS,
    vehicles: DEFAULT_VEHICLES,
    projects: DEFAULT_PROJECTS,
    merchants: DEFAULT_MERCHANTS,
    users: DEFAULT_USERS,
    receipts: DEFAULT_RECEIPTS,
    disbursements: DEFAULT_DISBURSEMENTS
  };
}

export function saveDatabase(db: Database): void {
  // ไม่บันทึกลง localStorage ตามที่ผู้ใช้งานเน้นย้ำเพื่อไม่ให้สับสน โดยจะใช้ Google Sheets เป็นแหล่งข้อมูลเดียวโดยตรง
}

export function resetDatabase(): Database {
  return {
    tanks: [],
    vehicles: [],
    projects: [],
    merchants: [],
    users: DEFAULT_USERS,
    receipts: [],
    disbursements: []
  };
}

// Google Sheets Helpers
export function getSheetsUrl(): string {
  return localStorage.getItem(SHEETS_URL_KEY) || "";
}

export function saveSheetsUrl(url: string): void {
  localStorage.setItem(SHEETS_URL_KEY, url);
}

export async function testSheetsConnection(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify({ action: "test" }),
    });
    const result = await response.json();
    return result.status === "success";
  } catch (e) {
    console.error("Sheets connection test failed", e);
    return false;
  }
}

export async function fetchDatabaseFromSheets(url: string): Promise<Database> {
  const response = await fetch(url, {
    method: "GET",
    mode: "cors",
  });
  const result = await response.json();
  if (result.status === "success" && result.data) {
    const sheetsDb = result.data;
    if (!sheetsDb.users || sheetsDb.users.length === 0) {
      sheetsDb.users = DEFAULT_USERS;
    }
    return sheetsDb;
  }
  throw new Error(result.message || "Failed to load from Sheets");
}

export async function syncDatabaseToSheets(url: string, db: Database): Promise<void> {
  const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({ action: "sync", db }),
  });
  const result = await response.json();
  if (result.status !== "success") {
    throw new Error(result.message || "Failed to sync with Sheets");
  }
}

// Helper to handle stock balance of a Tank based on transaction states
export function recalculateTankStocks(db: Database): Database {
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
