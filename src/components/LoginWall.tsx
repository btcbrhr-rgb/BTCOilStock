/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Fuel, User as UserIcon, KeyRound, ArrowRight } from "lucide-react";
import { User } from "../types";

interface LoginWallProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export default function LoginWall({ users, onLoginSuccess }: LoginWallProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    // Simulate network delay for realistic visual flow
    setTimeout(() => {
      const match = users.find(
        (u) =>
          u.Username.toLowerCase() === username.trim().toLowerCase() &&
          u.Password === password
      );

      if (match) {
        onLoginSuccess(match);
      } else {
        setErrorMsg("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950">
      {/* Background with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070')",
        }}
      />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl p-8 space-y-6 relative overflow-hidden">
        {/* Brand Identity */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-amber-500 text-slate-950 p-3.5 rounded-2xl shadow-xl shadow-amber-500/25">
            <Fuel className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">บจก.บุรีรัมย์ธงชัยก่อสร้าง</h1>
          <p className="text-xs text-slate-300 font-medium">ระบบเชื่อมโยงคลังและบัตรเติมน้ำมัน (SDMS Premium)</p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs text-center rounded-xl font-semibold animate-pulse">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
              ชื่อผู้ใช้งาน (Username)
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ระบุบัญชีผู้ใช้งาน (e.g. admin, inspector, operator)"
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500 transition duration-150"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ระบุรหัสผ่านของคุณ (e.g. 123)"
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500 transition duration-150"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-slate-950 font-black py-3.5 rounded-xl text-xs shadow-lg shadow-amber-500/15 transition duration-150 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-slate-950 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>กำลังยืนยันตัวตน...</span>
              </>
            ) : (
              <>
                <span>เข้าสู่ระบบความปลอดภัย</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-[9px] text-slate-450 leading-relaxed font-semibold">
            ทดลองเข้าใช้งาน: admin / 123 (Admin) | inspector / 123 (Checker) | operator / 123 (Recorder)
          </p>
        </div>
      </div>
    </div>
  );
}
