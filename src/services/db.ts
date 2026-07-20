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

export function getDatabase(): Database {
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
