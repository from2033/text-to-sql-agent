import { useState, useCallback, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { AnimatePresence } from "motion/react";
import {
  Database,
  Brain,
  Unplug,
  Zap,
  Github,
} from "lucide-react";
import { SchemaExplorer } from "./components/SchemaExplorer";
import { QueryChat } from "./components/QueryChat";
import { TrainingPanel } from "./components/TrainingPanel";
import { ConnectModal } from "./components/ConnectModal";
import type {
  DbSchema,
  ChatMessage,
  TrainingPair,
  DbConfig,
} from "./data/mockData";

const API = "http://localhost:8002";

export default function App() {
  const [connected, setConnected] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [schema, setSchema] = useState<DbSchema | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [trainingPairs, setTrainingPairs] = useState<TrainingPair[]>([]);
  const [showTraining, setShowTraining] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [connectedDb, setConnectedDb] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");

  // Load persisted training pairs on mount
  useEffect(() => {
    fetch(`${API}/api/training`)
      .then((r) => r.json())
      .then((data: TrainingPair[]) =>
        setTrainingPairs(
          data.map((p) => ({ ...p, createdAt: new Date(p.createdAt) }))
        )
      )
      .catch(() => {});
  }, []);

  const handleConnect = useCallback(async (config: DbConfig) => {
    try {
      const res = await fetch(`${API}/api/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(`连接失败：${err.detail ?? res.statusText}`);
        return;
      }
      const data = await res.json();
      const dbSchema: DbSchema = {
        ...data.schema,
        tables: data.schema.tables.map((t: any) => ({
          ...t,
          columns: t.columns ?? [],
        })),
      };
      setSessionId(data.sessionId);
      setConnected(true);
      setSchema(dbSchema);
      setConnectedDb(config.database || dbSchema.name);
      setShowConnect(false);
      setMessages([
        {
          id: "welcome",
          type: "system",
          content: `已成功连接到 **${dbSchema.name}** (${dbSchema.type} ${dbSchema.version})，读取了 ${dbSchema.tables.length} 张表的 Schema，已构建 Vector Memory。现在可以用自然语言提问了！`,
          timestamp: new Date(),
        },
      ]);
      toast.success(`已连接到 ${dbSchema.name}，Schema 加载完成`);
    } catch (e) {
      toast.error(`网络错误：${String(e)}`);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    if (sessionId) {
      await fetch(`${API}/api/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    }
    setConnected(false);
    setSchema(null);
    setMessages([]);
    setConnectedDb("");
    setSessionId("");
    setShowTraining(false);
    toast.info("已断开数据库连接");
  }, [sessionId]);

  const handleQuery = useCallback(
    async (question: string) => {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        type: "user",
        content: question,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsQuerying(true);

      try {
        const res = await fetch(`${API}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, sessionId }),
        });
        const data = await res.json();

        const aiMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          type: "assistant",
          content: data.explanation ?? "查询完成",
          sql: data.sql,
          queryResult: data.isError
            ? undefined
            : {
                columns: data.columns,
                rows: data.rows,
                rowCount: data.rowCount,
              },
          chartData: data.chartData ?? undefined,
          chartType: data.chartType ?? undefined,
          confidence: data.confidence,
          executionTime: data.executionTime,
          timestamp: new Date(),
          isError: data.isError,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch (e) {
        const errMsg: ChatMessage = {
          id: `e-${Date.now()}`,
          type: "assistant",
          content: `请求失败：${String(e)}`,
          timestamp: new Date(),
          isError: true,
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsQuerying(false);
      }
    },
    [sessionId]
  );

  const handleTableClick = useCallback(
    (tableName: string) => {
      handleQuery(`展示 ${tableName} 表的前10条数据`);
    },
    [handleQuery]
  );

  const handleAddTraining = useCallback(
    async (pair: Omit<TrainingPair, "id" | "createdAt">) => {
      try {
        const res = await fetch(`${API}/api/training`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pair),
        });
        const data = await res.json();
        const newPair: TrainingPair = { ...data, createdAt: new Date(data.createdAt) };
        setTrainingPairs((prev) => [newPair, ...prev]);
        toast.success("训练对已添加，下次查询将参考此示例");
      } catch (e) {
        toast.error(`添加失败：${String(e)}`);
      }
    },
    []
  );

  const handleDeleteTraining = useCallback(async (id: string) => {
    try {
      await fetch(`${API}/api/training/${id}`, { method: "DELETE" });
      setTrainingPairs((prev) => prev.filter((p) => p.id !== id));
      toast.info("训练对已删除");
    } catch (e) {
      toast.error(`删除失败：${String(e)}`);
    }
  }, []);

  const handleClearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontSize: "13px" },
        }}
      />

      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-200 shrink-0 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow">
            <Zap size={14} className="text-white" />
          </div>
          <span className="text-slate-900 font-semibold text-sm tracking-tight">
            SQL Agent
          </span>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
            Text-to-SQL
          </span>
        </div>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* DB Status */}
        {connected ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-slate-600 font-mono">{connectedDb}</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {schema?.type}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-sm text-slate-400">未连接</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Training toggle */}
          {connected && (
            <button
              onClick={() => setShowTraining((p) => !p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                showTraining
                  ? "bg-violet-100 text-violet-700 border border-violet-200"
                  : "text-slate-500 hover:bg-slate-100 border border-transparent"
              }`}
            >
              <Brain size={13} />
              示例训练
              <span className="bg-violet-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {trainingPairs.length}
              </span>
            </button>
          )}

          {/* Connect / Disconnect */}
          {connected ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
            >
              <Unplug size={13} />
              断开
            </button>
          ) : (
            <button
              onClick={() => setShowConnect(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Database size={13} />
              连接数据库
            </button>
          )}

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Github size={15} />
          </a>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Schema Explorer */}
        <AnimatePresence>
          {connected && schema && (
            <SchemaExplorer schema={schema} onTableClick={handleTableClick} />
          )}
        </AnimatePresence>

        {/* Chat */}
        <QueryChat
          messages={messages}
          onQuery={handleQuery}
          isQuerying={isQuerying}
          connected={connected}
          onConnect={() => setShowConnect(true)}
          onClear={handleClearChat}
          dbType={schema?.type}
        />

        {/* Training Panel */}
        <AnimatePresence>
          {showTraining && (
            <TrainingPanel
              pairs={trainingPairs}
              onAdd={handleAddTraining}
              onDelete={handleDeleteTraining}
              onClose={() => setShowTraining(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Connect Modal */}
      <AnimatePresence>
        {showConnect && (
          <ConnectModal
            onConnect={handleConnect}
            onClose={() => setShowConnect(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
