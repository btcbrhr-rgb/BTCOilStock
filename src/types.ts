/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Tank {
  IDถัง: string;
  "ชื่อคลัง/ถังเก็บ": string;
  ประเภทวัสดุ: string;
  ความจุสูงสุด: number;
  ปริมาณคงเหลือปัจจุบัน: number;
  เกณฑ์แจ้งเตือนต่ำวิกฤต: number;
  ราคาน้ำมันอ้างอิง: number;
  หน่วยนับ: string;
}

export interface Vehicle {
  IDรถ: string;
  "ทะเบียน/รหัสเครื่องจักร": string;
  พนักงานขับรถประจำคัน: string;
}

export interface Project {
  "ชื่อโครงการ/ไซต์งาน": string;
}

export interface Merchant {
  IDผู้ค้า: string;
  "ชื่อร้านค้า/ผู้ให้บริการ": string;
}

export interface User {
  Username: string;
  Password?: string;
  Name: string;
  Role: "ผู้ดูแลระบบสูงสุด" | "ผู้ตรวจสอบ" | "ผู้บันทึกข้อมูล";
}

export interface Receipt {
  IDรายการ: string;
  วันที่รับเข้า: string;
  ร้านค้า: string;
  "ชื่อสินค้า (คลัง)": string;
  ประเภทวัสดุ: string;
  ราคา: number;
  หน่วยนับ: string;
  จำนวนที่ซื้อ: number;
  ต้นทุนอื่นๆ: number;
  มูลค่ารวม: number;
  หมายเหตุ: string;
  โครงการ: string;
  "เลขที่ใบสั่งชื้อ (PO)": string;
  เลขที่ใบส่งสินค้า: string;
  สถานที่ส่ง: string;
  วันที่ครบกำหนดจ่าย: string;
  วันที่จ่าย: string;
  ผู้บันทึก: string;
  ผู้ตรวจสอบ: string;
  สถานะ: "อนุมัติแล้ว" | "รอตรวจสอบ" | "ไม่อนุมัติ";
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Disbursement {
  IDรายการ: string;
  วันที่: string;
  "ชื่อสินค้า (คลัง)": string;
  ราคา: number;
  หน่วยนับ: string;
  จำนวนที่จ่าย: number;
  มูลค่ารวม: number;
  หมายเหตุ: string;
  โครงการ: string;
  "ผู้เบิก/คนขับ": string;
  ทะเบียน: string;
  ผู้บันทึก: string;
  ผู้ตรวจสอบ: string;
  สถานะ: "อนุมัติแล้ว" | "รอตรวจสอบ" | "ไม่อนุมัติ";
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export type MasterDataType = "tanks" | "vehicles" | "projects" | "merchants" | "users";
export type TabType = "dashboard" | "receipts" | "disbursements" | "masterdata";
