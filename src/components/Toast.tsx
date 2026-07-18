/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, CheckCircle, AlertOctagon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ToastProps {
  show: boolean;
  title: string;
  desc: string;
  type: "success" | "error";
  onClose: () => void;
}

export default function Toast({ show, title, desc, type, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-55 p-4 rounded-2xl border flex items-center space-x-3.5 shadow-xl max-w-sm bg-white"
          style={{
            borderColor: type === "success" ? "#e2f8f0" : "#fbebeb",
          }}
        >
          <div
            className={`p-2.5 rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-white ${
              type === "success" ? "bg-emerald-500" : "bg-rose-500"
            }`}
          >
            {type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
          </div>
          <div className="flex-grow min-w-0 pr-2">
            <h4 className="text-xs font-black text-slate-900 truncate">{title}</h4>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-relaxed break-words">{desc}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition duration-150 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
