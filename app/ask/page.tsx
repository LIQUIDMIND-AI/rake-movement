"use client";
import { useState, useRef, useEffect } from "react";
import { PageHeader, Panel, Badge } from "@/components/ui";
import { MessageSquareText, Send } from "lucide-react";
import { answerFor, NL_SUGGESTIONS } from "@/lib/seed";
import type { NLExchange } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  text: string;
  chips?: string[];
  isLoading?: boolean;
}

export default function AskLiquidMind() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Welcome to Ask LiquidMind. Ask any question about live rake movements, dwell times, demurrage exposure, inbound ETAs, equipment utilisation, or alerts across the plant. Every answer is grounded in real-time sensor data — RFID at interchange points, GNSS on locos, weighbridges at tipplers, and customs/port tracking for inbound imports.",
      chips: undefined,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (question: string) => {
    if (!question.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInputValue("");
    setIsThinking(true);

    // Simulate thinking with brief delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Get answer
    const answer = answerFor(question);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: answer.a, chips: answer.chips },
    ]);
    setIsThinking(false);

    // Focus back to input
    inputRef.current?.focus();
  };

  return (
    <div className="p-5 space-y-4">
      <PageHeader
        title="Ask LiquidMind"
        sub="Plain-language questions over live rake, dwell and MIS data — answered instantly, every figure traceable to source. Live: Claude on Amazon Bedrock."
        icon={<MessageSquareText size={20} />}
      />

      <div className="max-w-3xl mx-auto flex flex-col h-[600px] card rounded-lg overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
                    <span className="text-brand text-sm">✨</span>
                  </div>
                  <div className="flex-1">
                    <div className="card bg-panel p-3 rounded-lg">
                      <p className="text-sm text-t1 leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                    {msg.chips && msg.chips.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.chips.map((chip, i) => (
                          <Badge key={i} tone="neutral" className="text-[11px]">
                            {chip}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 max-w-[85%]">
                  <div className="flex-1">
                    <div className="bg-accent/15 border border-accent/30 rounded-lg px-3 py-2">
                      <p className="text-sm text-t1">{msg.text}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
                  <span className="text-brand text-sm">✨</span>
                </div>
                <div className="flex items-center gap-1 pt-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-t3 animate-bounce"></span>
                  <span
                    className="inline-block w-2 h-2 rounded-full bg-t3 animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></span>
                  <span
                    className="inline-block w-2 h-2 rounded-full bg-t3 animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-panel-line bg-panel p-4 space-y-3">
          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="space-y-2">
              <div className="text-xs text-muted mb-2">Suggested questions:</div>
              <div className="flex flex-wrap gap-2">
                {NL_SUGGESTIONS.map((sugg, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(sugg)}
                    className="text-xs px-3 py-1.5 rounded-full border border-accent/40 text-accent hover:bg-accent/10 transition"
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input field */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isThinking) {
                  handleSubmit(inputValue);
                }
              }}
              placeholder="Ask about rake movements, demurrage, inbound ETAs..."
              className="flex-1 bg-surface-2 border border-panel-line rounded-lg px-3 py-2 text-sm text-t1 placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
              disabled={isThinking}
            />
            <button
              onClick={() => handleSubmit(inputValue)}
              disabled={!inputValue.trim() || isThinking}
              className="px-4 py-2 bg-brand text-t1 rounded-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto text-center text-xs text-muted pt-2">
        <p>
          Answers grounded in live plant data. In production, this layer is served
          by Claude on Amazon Bedrock with full source traceability across RFID,
          GNSS, OCR, weighbridge, FOIS and ULIP feeds.
        </p>
      </div>
    </div>
  );
}
