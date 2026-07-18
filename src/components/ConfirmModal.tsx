/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  isWarning?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  show,
  title,
  message,
  isWarning = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4"
          >
            <div className="flex items-center space-x-3.5">
              <div
                className={`p-3 rounded-full flex items-center justify-center ${
                  isWarning ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"
                }`}
              >
                {isWarning ? <AlertTriangle className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
              </div>
              <h3 className="text-sm font-black text-slate-900">{title}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">{message}</p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={onCancel}
                className="text-xs text-slate-600 border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl font-bold transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={onConfirm}
                className={`text-xs text-white px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                  isWarning ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                ยืนยัน
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
