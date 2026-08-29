"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChatPanel } from "./ChatPanel";
import { MessageSquareText, X } from "lucide-react";

export function AskChatWidget() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // The full /ask page already is this experience — don't stack the widget on top of it.
  if (pathname === "/ask") return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[360px] h-[500px] card rounded-xl overflow-hidden shadow-2xl flex flex-col border border-panel-line">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-panel border-b border-panel-line shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-brand text-[13px]">✨</span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold text-t1 truncate">Ask LiquidMind</div>
                <div className="text-[10px] text-muted truncate">Live plant data, answered instantly</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="shrink-0 grid h-6 w-6 place-items-center rounded-md text-t3 hover:text-t1 hover:bg-surface-3 transition"
              aria-label="Close chat"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <ChatPanel compact />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 grid h-[52px] w-[52px] place-items-center rounded-full bg-brand text-white shadow-xl hover:bg-brand/90 transition"
        aria-label={open ? "Close Ask LiquidMind" : "Open Ask LiquidMind"}
      >
        {open ? <X size={22} /> : <MessageSquareText size={22} />}
      </button>
    </>
  );
}
