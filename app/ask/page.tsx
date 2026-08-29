"use client";
import { PageHeader } from "@/components/ui";
import { ChatPanel } from "@/components/ChatPanel";
import { MessageSquareText } from "lucide-react";

export default function AskLiquidMind() {
  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="Ask LiquidMind"
        sub="Plain-language questions over live rake, dwell and MIS data — answered instantly, every figure traceable to source. Live: Claude on Amazon Bedrock."
        icon={<MessageSquareText size={20} />}
      />

      <div className="max-w-3xl mx-auto h-[600px] card rounded-lg overflow-hidden">
        <ChatPanel />
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto text-center text-xs text-muted pt-2">
        <p>
          Answers grounded in live plant data. In production, this layer is served
          by Claude on Amazon Bedrock with full source traceability across RFID,
          GNSS, OCR, weighbridge, FOIS and ULIP feeds. The same assistant is also
          available from any page via the chat icon in the bottom-right corner.
        </p>
      </div>
    </div>
  );
}
