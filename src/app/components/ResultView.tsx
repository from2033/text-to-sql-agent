import { useState } from "react";
import {
  BarChart2,
  Table2,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { QueryResult, ChartDataPoint } from "../data/mockData";

const CHART_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6366f1",
];

interface Props {
  queryResult: QueryResult;
  chartData?: ChartDataPoint[];
  chartType?: "bar" | "line" | "pie" | "area";
}

function ChartView({
  chartData,
  chartType,
}: {
  chartData: ChartDataPoint[];
  chartType: "bar" | "line" | "pie" | "area";
}) {
  if (chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={90}
            labelLine={false}
            label={({ name, percent }) =>
              percent > 0.04 ? `${name} ${(percent * 100).toFixed(1)}%` : ""
            }
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: number) => val.toLocaleString()}
            contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#334155" }}
          />
          <Legend
            formatter={(value) => <span className="text-slate-600 text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#334155" }}
            formatter={(val: number) => val.toLocaleString()}
          />
          <Legend formatter={(v) => <span className="text-slate-600 text-xs">{v === "value" ? "订单量" : "收入(万)"}</span>} />
          <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#colorValue)" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} />
          {chartData[0]?.value2 !== undefined && (
            <Area type="monotone" dataKey="value2" stroke="#8b5cf6" fill="url(#colorValue2)" strokeWidth={2} dot={{ r: 3, fill: "#8b5cf6" }} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#334155" }}
            formatter={(val: number) => val.toLocaleString()}
          />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // bar (default)
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="name"
          tick={{ fill: "#94a3b8", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, color: "#334155" }}
          formatter={(val: number) => val.toLocaleString()}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function TableView({ queryResult }: { queryResult: QueryResult }) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [expanded, setExpanded] = useState(false);

  const PAGE_SIZE = 8;

  const handleSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(colIdx);
      setSortDir("asc");
    }
  };

  let rows = [...queryResult.rows];
  if (sortCol !== null) {
    rows.sort((a, b) => {
      const va = a[sortCol];
      const vb = b[sortCol];
      if (va === null) return 1;
      if (vb === null) return -1;
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const displayed = expanded ? rows : rows.slice(0, PAGE_SIZE);
  const hasMore = rows.length > PAGE_SIZE;

  const exportCSV = () => {
    const header = queryResult.columns.join(",");
    const body = rows.map((r) => r.map((v) => `"${v ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query_result.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {queryResult.columns.map((col, i) => (
                <th
                  key={i}
                  className="text-left px-3 py-2 text-slate-600 font-medium text-xs whitespace-nowrap cursor-pointer hover:bg-slate-200 transition-colors select-none"
                  onClick={() => handleSort(i)}
                >
                  <div className="flex items-center gap-1">
                    <span className="font-mono">{col}</span>
                    {sortCol === i ? (
                      sortDir === "asc" ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )
                    ) : (
                      <ArrowUpDown size={11} className="text-slate-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((row, ri) => (
              <tr
                key={ri}
                className={`border-b border-slate-100 last:border-0 ${ri % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-blue-50/40 transition-colors`}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-3 py-2 text-xs text-slate-700 font-mono whitespace-nowrap ${typeof cell === "number" ? "text-right" : ""}`}
                  >
                    {cell === null ? (
                      <span className="text-slate-400 italic">NULL</span>
                    ) : typeof cell === "boolean" ? (
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                          cell ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {String(cell)}
                      </span>
                    ) : typeof cell === "number" ? (
                      cell.toLocaleString()
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          {hasMore && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {expanded ? (
                <>
                  <ChevronUp size={12} /> 收起
                </>
              ) : (
                <>
                  <ChevronDown size={12} /> 显示全部 {rows.length} 行
                </>
              )}
            </button>
          )}
          <span className="text-xs text-slate-400">
            共 {queryResult.rowCount.toLocaleString()} 行
          </span>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
        >
          <Download size={12} />
          导出 CSV
        </button>
      </div>
    </div>
  );
}

export function ResultView({ queryResult, chartData, chartType }: Props) {
  const [view, setView] = useState<"table" | "chart">("table");
  const hasChart = !!chartData && chartData.length > 0 && !!chartType;

  return (
    <div className="mt-3">
      {hasChart && (
        <div className="flex items-center gap-1 mb-3">
          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
              view === "table"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Table2 size={12} />
            表格
          </button>
          <button
            onClick={() => setView("chart")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
              view === "chart"
                ? "bg-slate-900 text-white shadow"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            <BarChart2 size={12} />
            图表
          </button>
        </div>
      )}

      {view === "table" ? (
        <TableView queryResult={queryResult} />
      ) : (
        hasChart && (
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <ChartView chartData={chartData} chartType={chartType} />
          </div>
        )
      )}
    </div>
  );
}
