import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Table2,
  Search,
  Key,
  Link,
  Hash,
  Type,
  ToggleLeft,
  Database,
} from "lucide-react";
import type { DbSchema, Column } from "../data/mockData";

interface Props {
  schema: DbSchema;
  onTableClick: (tableName: string) => void;
}

function typeIcon(type: string) {
  const t = type.toUpperCase();
  if (t.includes("INT") || t.includes("DECIMAL") || t.includes("FLOAT") || t.includes("NUMERIC"))
    return <Hash size={11} className="text-orange-400 shrink-0" />;
  if (t.includes("BOOL"))
    return <ToggleLeft size={11} className="text-green-400 shrink-0" />;
  if (t.includes("TIMESTAMP") || t.includes("DATE"))
    return <span className="text-blue-400 text-[10px] font-mono shrink-0">ts</span>;
  return <Type size={11} className="text-slate-400 shrink-0" />;
}

function ColumnRow({ col }: { col: Column }) {
  return (
    <div className="flex items-start gap-1.5 px-3 py-1 hover:bg-slate-50 group">
      <div className="flex items-center gap-1 mt-0.5 shrink-0">
        {col.isPrimary ? (
          <Key size={11} className="text-amber-500" />
        ) : col.isForeignKey ? (
          <Link size={11} className="text-sky-500" />
        ) : (
          typeIcon(col.type)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-700 text-xs font-mono truncate">{col.name}</span>
          <span className="text-slate-400 text-[10px] font-mono">{col.type}</span>
          {col.isPrimary && (
            <span className="text-[9px] bg-amber-50 text-amber-600 px-1 rounded border border-amber-200">PK</span>
          )}
          {col.isForeignKey && (
            <span className="text-[9px] bg-sky-50 text-sky-600 px-1 rounded border border-sky-200">FK</span>
          )}
          {col.isUnique && (
            <span className="text-[9px] bg-purple-50 text-purple-600 px-1 rounded border border-purple-200">UQ</span>
          )}
          {col.nullable === false && !col.isPrimary && (
            <span className="text-[9px] bg-red-50 text-red-500 px-1 rounded border border-red-100">NOT NULL</span>
          )}
        </div>
        {col.description && (
          <p className="text-slate-400 text-[10px] mt-0.5 leading-tight">{col.description}</p>
        )}
        {col.references && (
          <p className="text-sky-500 text-[10px] mt-0.5">→ {col.references}</p>
        )}
      </div>
    </div>
  );
}

function TableItem({
  table,
  onTableClick,
}: {
  table: DbSchema["tables"][0];
  onTableClick: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-slate-800/60 last:border-0">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors text-left group"
        onClick={() => setExpanded((p) => !p)}
      >
        {expanded ? (
          <ChevronDown size={13} className="text-slate-400 shrink-0" />
        ) : (
          <ChevronRight size={13} className="text-slate-400 shrink-0" />
        )}
        <Table2 size={13} className="text-blue-500 shrink-0" />
        <span className="text-slate-700 text-xs font-mono flex-1 truncate">{table.name}</span>
        <span className="text-slate-500 text-[10px] hidden group-hover:block whitespace-nowrap">
          {table.rowCount.toLocaleString()} 行
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTableClick(table.name);
          }}
          className="hidden group-hover:flex items-center text-[10px] text-blue-400 hover:text-blue-300 ml-1 shrink-0"
          title="查询前10条"
        >
          预览
        </button>
      </button>

      {table.description && !expanded && (
        <p className="px-8 pb-1 text-slate-600 text-[10px]">{table.description}</p>
      )}

      {expanded && (
        <div className="pb-1">
          {table.description && (
            <p className="px-8 pb-1.5 pt-0.5 text-slate-400 text-[10px] italic">{table.description}</p>
          )}
          <div className="border-t border-slate-100">
            {table.columns.map((col) => (
              <ColumnRow key={col.name} col={col} />
            ))}
          </div>
          <div className="px-3 py-1 text-slate-400 text-[10px] border-t border-slate-100">
            {table.columns.length} 列 · 约 {table.rowCount.toLocaleString()} 行
          </div>
        </div>
      )}
    </div>
  );
}

export function SchemaExplorer({ schema, onTableClick }: Props) {
  const [search, setSearch] = useState("");

  const filteredTables = schema.tables.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(s) ||
      t.columns.some(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.description?.toLowerCase().includes(s)
      )
    );
  });

  const totalRows = schema.tables.reduce((a, t) => a + t.rowCount, 0);

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      {/* DB Info Header */}
      <div className="px-3 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <Database size={14} className="text-blue-500" />
          <span className="text-slate-800 text-sm font-semibold truncate">{schema.name}</span>
          <span className="ml-auto text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
            {schema.type}
          </span>
        </div>
        <div className="flex gap-3 mt-1">
          <span className="text-slate-400 text-[10px]">{schema.host}</span>
          <span className="text-slate-400 text-[10px]">v{schema.version}</span>
        </div>
        <div className="flex gap-3 mt-1">
          <span className="text-slate-500 text-[10px]">{schema.tables.length} 张表</span>
          <span className="text-slate-500 text-[10px]">{(totalRows / 10000).toFixed(1)}w 行</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2 py-1.5">
          <Search size={12} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="搜索表或字段..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-slate-700 text-xs outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-3">
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <Key size={9} className="text-amber-500" /> PK
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <Link size={9} className="text-sky-500" /> FK
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <Hash size={9} className="text-orange-400" /> 数值
        </span>
        <span className="flex items-center gap-1 text-[10px] text-slate-400">
          <Type size={9} className="text-slate-400" /> 文本
        </span>
      </div>

      {/* Tables */}
      <div className="flex-1 overflow-y-auto">
        {filteredTables.length === 0 ? (
          <div className="px-4 py-6 text-slate-400 text-xs text-center">未找到匹配的表或字段</div>
        ) : (
          filteredTables.map((table) => (
            <TableItem key={table.name} table={table} onTableClick={onTableClick} />
          ))
        )}
      </div>
    </aside>
  );
}
