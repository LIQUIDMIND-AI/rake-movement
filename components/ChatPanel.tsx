"use client";
import { useState, useRef, useEffect } from "react";
import { Badge } from "./ui";
import { Send } from "lucide-react";
import { answerFor, NL_SUGGESTIONS } from "@/lib/seed";

interface Message {
  role: "user" | "assistant";
  text: string;
  chips?: string[];
}

const WELCOME =
  "Welcome to Ask LiquidMind. Ask any question about live rake movements, dwell times, demurrage exposure, inbound ETAs, equipment utilisation, or alerts across the plant. Every answer is grounded in real-time sensor data — RFID at interchange points, GNSS on locos, weighbridges at tipplers, and customs/port tracking for inbound imports.";

// Shared chat thread + input, used by both the full /ask page and the
// floating bottom-right widget so the two surfaces never drift apart.
export function ChatPanel({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: WELCOME }]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (question: string) => {
    if (!question.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInputValue("");
    setIsThinking(true);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const answer = answerFor(question);
    setMessages((prev) => [...prev, { role: "assistant", text: answer.a, chips: answer.chips }]);
    setIsThinking(false);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat area */}
      <div className={`flex-1 overflow-y-auto bg-surface-2 space-y-3 ${compact ? "p-3" : "p-4 space-y-4"}`}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" ? (
              <div className={`flex gap-2.5 ${compact ? "max-w-[92%]" : "max-w-[85%]"}`}>
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center">
                  <span className="text-brand text-[12px]">✨</span>
                </div>
                <div className="flex-1">
                  <div className="card bg-panel p-2.5 rounded-lg">
                    <p className={`text-t1 leading-relaxed ${compact ? "text-[12px]" : "text-sm"}`}>{msg.text}</p>
                  </div>
                  {msg.chips && msg.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {msg.chips.map((chip, i) => (
                        <Badge key={i} tone="neutral" className="text-[10.5px]">
                          {chip}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`flex gap-2.5 ${compact ? "max-w-[92%]" : "max-w-[85%]"}`}>
                <div className="flex-1">
                  <div className="bg-accent/15 border border-accent/30 rounded-lg px-2.5 py-1.5">
                    <p className={`text-t1 ${compact ? "text-[12px]" : "text-sm"}`}>{msg.text}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="flex gap-2.5">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center">
                <span className="text-brand text-[12px]">✨</span>
              </div>
              <div className="flex items-center gap-1 pt-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-t3 animate-bounce" />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-t3 animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-t3 animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className={`border-t border-panel-line bg-panel space-y-2 ${compact ? "p-2.5" : "p-4 space-y-3"}`}>
        {messages.length === 1 && (
          <div className="space-y-1.5">
            {!compact && <div className="text-xs text-muted mb-2">Suggested questions:</div>}
            <div className="flex flex-wrap gap-1.5">
              {(compact ? NL_SUGGESTIONS.slice(0, 3) : NL_SUGGESTIONS).map((sugg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmit(sugg)}
                  className={`px-2.5 py-1 rounded-full border border-accent/40 text-accent hover:bg-accent/10 transition ${compact ? "text-[10.5px]" : "text-xs"}`}
                >
                  {sugg}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isThinking) handleSubmit(inputValue);
            }}
            placeholder="Ask about rake movements, demurrage, inbound ETAs..."
            className={`flex-1 bg-surface-2 border border-panel-line rounded-lg text-t1 placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 ${compact ? "px-2.5 py-1.5 text-[12px]" : "px-3 py-2 text-sm"}`}
            disabled={isThinking}
          />
          <button
            onClick={() => handleSubmit(inputValue)}
            disabled={!inputValue.trim() || isThinking}
            className={`bg-brand text-t1 rounded-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition ${compact ? "px-3 py-1.5" : "px-4 py-2"}`}
          >
            <Send size={compact ? 14 : 16} />
          </button>
        </div>
      </div>
    </div>
  );
}
