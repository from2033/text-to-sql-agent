import { useState } from "react";
import {
  Brain,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  X,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { TrainingPair } from "../data/mockData";

interface Props {
  pairs: TrainingPair[];
  onAdd: (pair: Omit<TrainingPair, "id" | "createdAt">) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function PairCard({
  pair,
  onDelete,
}: {
  pair: TrainingPair;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 leading-snug">{pair.question}</p>
          {pair.description && (
            <p className="text-xs text-slate-400 mt-0.5">{pair.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {expanded ? (
            <ChevronDown size={14} className="text-slate-400" />
          ) : (
            <ChevronRight size={14} className="text-slate-400" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
              <pre className="text-xs text-blue-700 font-mono whitespace-pre-wrap leading-5">
                {pair.sql}
              </pre>
            </div>
            <div className="px-4 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400">
              添加于 {pair.createdAt.toLocaleDateString("zh-CN")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TrainingPanel({ pairs, onAdd, onDelete, onClose }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [sql, setSql] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!question.trim() || !sql.trim()) return;
    onAdd({ question: question.trim(), sql: sql.trim(), description: description.trim() || undefined });
    setQuestion("");
    setSql("");
    setDescription("");
    setShowForm(false);
  };

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 250 }}
      className="w-80 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
          <Brain size={15} className="text-violet-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-slate-800 text-sm">示例训练</h3>
          <p className="text-slate-400 text-[11px]">{pairs.length} 个训练对</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Info banner */}
      <div className="mx-4 mt-3 mb-1 px-3 py-2.5 bg-violet-50 rounded-xl border border-violet-100">
        <div className="flex gap-2">
          <BookOpen size={13} className="text-violet-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-violet-700 leading-relaxed">
            添加「问题 → SQL」示例对，让 Agent 更准确地理解你的业务语义，越训练越精准。
          </p>
        </div>
      </div>

      {/* Add button */}
      <div className="px-4 py-2">
        <button
          onClick={() => setShowForm((p) => !p)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
            showForm
              ? "bg-slate-100 text-slate-600"
              : "bg-violet-600 text-white hover:bg-violet-700 shadow-sm"
          }`}
        >
          <Plus size={15} />
          {showForm ? "取消" : "添加训练对"}
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 flex flex-col gap-2">
              <div>
                <label className="text-[11px] text-slate-500 font-medium mb-1 block">
                  自然语言问题 *
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="例如：最近7天的日订单量"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-medium mb-1 block">
                  对应 SQL *
                </label>
                <textarea
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  placeholder={`SELECT DATE(created_at) AS date,\n  COUNT(*) AS cnt\nFROM orders\nGROUP BY 1\nORDER BY 1;`}
                  rows={6}
                  className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none bg-slate-50 text-blue-700 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-medium mb-1 block">
                  备注说明（可选）
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例如：排除取消和退款订单"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={!question.trim() || !sql.trim()}
                className="w-full py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                保存训练对
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {pairs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <Brain size={32} className="mx-auto mb-3 text-slate-200" />
            暂无训练数据
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pairs.map((pair) => (
              <PairCard
                key={pair.id}
                pair={pair}
                onDelete={() => onDelete(pair.id)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
