import { useState } from "react";
import { Database, Eye, EyeOff, Loader2, CheckCircle2, X, Wifi } from "lucide-react";
import { motion } from "motion/react";
import type { DbConfig } from "../data/mockData";

const DB_TYPES = [
  { id: "postgresql", label: "PostgreSQL", defaultPort: "5432", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "mysql", label: "MySQL", defaultPort: "3306", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: "sqlite", label: "SQLite", defaultPort: "", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { id: "clickhouse", label: "ClickHouse", defaultPort: "8123", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
];

interface Props {
  onConnect: (config: DbConfig) => void;
  onClose: () => void;
}

export function ConnectModal({ onConnect, onClose }: Props) {
  const [dbType, setDbType] = useState("postgresql");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("5432");
  const [database, setDatabase] = useState("ecommerce_db");
  const [username, setUsername] = useState("postgres");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleTypeChange = (typeId: string) => {
    setDbType(typeId);
    const t = DB_TYPES.find((d) => d.id === typeId);
    if (t) setPort(t.defaultPort);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("http://localhost:8002/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: dbType, host, port, database, username, password }),
      });
      const data = await res.json();
      setTestResult(data.ok ? "success" : "error");
    } catch {
      setTestResult("error");
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    onConnect({ type: dbType, host, port, database, username, password });
  };

  const isSQLite = dbType === "sqlite";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Database size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-slate-900 text-base">连接数据库</h2>
            <p className="text-slate-500 text-xs">填写连接信息，自动读取 Schema</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* DB Type */}
          <div>
            <label className="text-xs text-slate-500 font-medium mb-2 block">数据库类型</label>
            <div className="grid grid-cols-2 gap-2">
              {DB_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTypeChange(t.id)}
                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                    dbType === t.id
                      ? t.color + " font-medium shadow-sm"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Host / Port */}
          {!isSQLite && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-medium mb-1.5 block">主机地址</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="localhost"
                />
              </div>
              <div className="w-24">
                <label className="text-xs text-slate-500 font-medium mb-1.5 block">端口</label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="5432"
                />
              </div>
            </div>
          )}

          {/* Database name */}
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1.5 block">
              {isSQLite ? "数据库文件路径" : "数据库名称"}
            </label>
            <input
              type="text"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder={isSQLite ? "/path/to/data.db" : "ecommerce_db"}
            />
          </div>

          {/* Username / Password */}
          {!isSQLite && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-medium mb-1.5 block">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="postgres"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 font-medium mb-1.5 block">密码</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 pr-10 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((p) => !p)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Test result */}
          {testResult === "success" && (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 text-sm border border-emerald-100">
              <CheckCircle2 size={14} />
              连接测试成功！可以连接。
            </div>
          )}
          {testResult === "error" && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2 text-sm border border-red-100">
              连接测试失败，请检查配置或确认后端服务已启动。
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {testing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Wifi size={14} />
              )}
              测试连接
            </button>
            <button
              onClick={handleConnect}
              disabled={!database.trim() || connecting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {connecting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Database size={14} />
              )}
              {connecting ? "连接中..." : "连接并读取 Schema"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
