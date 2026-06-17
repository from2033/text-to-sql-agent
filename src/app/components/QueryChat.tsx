import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Loader2,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
  Database,
  Zap,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SqlBlock } from "./SqlBlock";
import { ResultView } from "./ResultView";
import type { ChatMessage } from "../data/mockData";

const SUGGESTED = [
  "每月订单量和收入趋势",
  "销售额最高的10个产品",
  "各分类的收入占比",
  "哪些产品库存告急？",
  "客户的国家分布情况",
  "各会员等级的消费能力",
  "订单状态分布",
  "最近新增客户趋势",
];

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    pct >= 90
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : pct >= 75
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-amber-100 text-amber-700 border-amber-200";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${color}`}>
      <Shield size={10} />
      置信度 {pct}%
    </span>
  );
}

function ThinkingAnimation({ phase }: { phase: number }) {
  const steps = [
    { label: "理解语义...", icon: MessageSquare },
    { label: "生成 SQL...", icon: Zap },
    { label: "执行查询...", icon: Database },
  ];

  return (
    <div className="flex flex-col gap-2 py-2">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const done = i < phase;
        const active = i === phase;
        return (
          <div
            key={i}
            className={`flex items-center gap-2 text-sm transition-all duration-300 ${
              done
                ? "text-emerald-600"
                : active
                ? "text-blue-600"
                : "text-slate-300"
            }`}
          >
            {active ? (
              <Loader2 size={14} className="animate-spin" />
            ) : done ? (
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            ) : (
              <Icon size={14} />
            )}
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function AssistantMessage({ msg, dbType }: { msg: ChatMessage; dbType?: string }) {
  const [sqlOpen, setSqlOpen] = useState(true);

  return (
    <div className="flex gap-3 max-w-full">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0 mt-0.5 shadow">
        <Sparkles size={15} className="text-white" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Explanation */}
        <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-200 mb-3">
          <p
            className="text-slate-700 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: msg.content
                .replace(/\*\*(.+?)\*\*/g, "<strong class='text-slate-900'>$1</strong>")
                .replace(/\n/g, "<br/>"),
            }}
          />
        </div>

        {/* SQL Block */}
        {msg.sql && (
          <div className="mb-3">
            <button
              onClick={() => setSqlOpen((p) => !p)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 mb-2 transition-colors"
            >
              {sqlOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              <span className="font-mono">{sqlOpen ? "收起" : "查看"} SQL</span>
            </button>
            <AnimatePresence initial={false}>
              {sqlOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <SqlBlock sql={msg.sql} dbType={dbType} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Meta + Results */}
        {msg.queryResult && (
          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-200">
            {/* Meta row */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {msg.confidence !== undefined && (
                <ConfidenceBadge confidence={msg.confidence} />
              )}
              {msg.executionTime !== undefined && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock size={10} />
                  {msg.executionTime}ms
                </span>
              )}
              <span className="text-[11px] text-slate-400">
                {msg.queryResult.rowCount.toLocaleString()} 行返回
              </span>
            </div>

            <ResultView
              queryResult={msg.queryResult}
              chartData={msg.chartData}
              chartType={msg.chartType}
            />
          </div>
        )}

        <div className="mt-1.5 text-[10px] text-slate-400 pl-1">
          {msg.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

function UserMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex gap-3 justify-end">
      <div className="max-w-[70%]">
        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm">{msg.content}</p>
        </div>
        <div className="mt-1 text-[10px] text-slate-400 text-right pr-1">
          {msg.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-slate-600 text-xs font-semibold">U</span>
      </div>
    </div>
  );
}

function SystemMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-center">
      <div
        className="max-w-xl text-center text-sm text-slate-600 bg-slate-100 rounded-xl px-4 py-2.5 leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: msg.content
            .replace(/\*\*(.+?)\*\*/g, "<strong class='text-slate-800'>$1</strong>"),
        }}
      />
    </div>
  );
}

function ThinkingMessage() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0 mt-0.5 shadow">
        <Sparkles size={15} className="text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-200">
        <ThinkingAnimation phase={phase} />
      </div>
    </div>
  );
}

interface Props {
  messages: ChatMessage[];
  onQuery: (question: string) => void;
  isQuerying: boolean;
  connected: boolean;
  onConnect: () => void;
  onClear: () => void;
  dbType?: string;
}

export function QueryChat({ messages, onQuery, isQuerying, connected, onConnect, onClear, dbType }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isQuerying]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || isQuerying || !connected) return;
    setInput("");
    onQuery(q);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isEmpty && !connected ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg">
              <Database size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-slate-800 mb-1">连接你的数据库</h2>
              <p className="text-slate-500 text-sm max-w-sm">
                接入数据库后，用自然语言提问，Agent 自动生成 SQL、执行查询并解释结果。
              </p>
            </div>
            <button
              onClick={onConnect}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow flex items-center gap-2"
            >
              <Database size={16} />
              连接数据库
            </button>
            <div className="grid grid-cols-2 gap-2 max-w-md mt-2">
              {["PostgreSQL", "MySQL", "SQLite", "ClickHouse"].map((db) => (
                <div
                  key={db}
                  className="px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-500 text-center"
                >
                  {db}
                </div>
              ))}
            </div>
          </div>
        ) : isEmpty && connected ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow">
              <Sparkles size={24} className="text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-slate-700 mb-1">数据库已连接</h3>
              <p className="text-slate-500 text-sm">用自然语言提问，例如：</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-lg">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => { onQuery(q); }}
                  className="px-3 py-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs text-slate-600 hover:text-blue-700 text-left transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col gap-5">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {msg.type === "user" ? (
                    <UserMessage msg={msg} />
                  ) : msg.type === "assistant" ? (
                    <AssistantMessage msg={msg} dbType={dbType} />
                  ) : (
                    <SystemMessage msg={msg} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isQuerying && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <ThinkingMessage />
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Quick suggestions */}
      {connected && messages.length > 0 && (
        <div className="px-6 pb-2">
          <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {SUGGESTED.slice(0, 5).map((q) => (
              <button
                key={q}
                onClick={() => { if (!isQuerying) onQuery(q); }}
                disabled={isQuerying}
                className="shrink-0 px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-full text-xs text-slate-600 hover:text-blue-700 transition-all disabled:opacity-40 whitespace-nowrap"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-5">
        <div className="max-w-3xl mx-auto">
          <div
            className={`flex items-center gap-3 bg-white border rounded-2xl px-4 py-3 shadow-sm transition-all ${
              connected
                ? "border-slate-200 focus-within:border-blue-400 focus-within:shadow-blue-100 focus-within:shadow-md"
                : "border-slate-200 opacity-60"
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={!connected || isQuerying}
              placeholder={
                connected
                  ? "用自然语言提问，例如：每月销售额趋势如何？"
                  : "请先连接数据库..."
              }
              className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent disabled:cursor-not-allowed"
            />
            {messages.length > 0 && (
              <button
                onClick={onClear}
                title="清空对话"
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <RotateCcw size={15} />
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!input.trim() || !connected || isQuerying}
              className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isQuerying ? (
                <Loader2 size={15} className="text-white animate-spin" />
              ) : (
                <Send size={15} className="text-white" />
              )}
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            AI 生成的 SQL 仅供参考，执行前请人工审核 · Enter 发送
          </p>
        </div>
      </div>
    </div>
  );
}
