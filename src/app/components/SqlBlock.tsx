import { useState } from "react";
import { Copy, Check } from "lucide-react";

type TokenType = "keyword" | "function" | "string" | "number" | "comment" | "plain";

interface Token {
  type: TokenType;
  text: string;
}

const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "FULL", "CROSS",
  "ON", "GROUP", "ORDER", "HAVING", "LIMIT", "OFFSET", "AS", "AND", "OR", "NOT",
  "IN", "BETWEEN", "LIKE", "IS", "NULL", "DISTINCT", "UNION", "ALL", "CASE", "WHEN",
  "THEN", "ELSE", "END", "WITH", "INTO", "VALUES", "SET", "BY", "ASC", "DESC",
  "OVER", "PARTITION", "INTERVAL", "RETURNING", "TRUE", "FALSE",
]);

const SQL_FUNCTIONS = new Set([
  "COUNT", "SUM", "AVG", "MAX", "MIN", "COALESCE", "DATE", "NOW", "CAST", "NULLIF",
  "RANK", "ROW_NUMBER", "LAG", "LEAD", "DATE_TRUNC", "TO_CHAR", "EXTRACT",
  "UPPER", "LOWER", "TRIM", "CONCAT", "REPLACE", "ROUND", "FLOOR", "CEIL", "ABS",
  "NULLS", "ISNULL", "NVL",
]);

function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < sql.length) {
    // Comment
    if (sql[i] === "-" && sql[i + 1] === "-") {
      const end = sql.indexOf("\n", i);
      const text = end === -1 ? sql.slice(i) : sql.slice(i, end);
      tokens.push({ type: "comment", text });
      i += text.length;
      continue;
    }

    // String literal
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < sql.length && sql[j] !== "'") {
        if (sql[j] === "\\") j++;
        j++;
      }
      j++;
      tokens.push({ type: "string", text: sql.slice(i, j) });
      i = j;
      continue;
    }

    // Number
    if (/\d/.test(sql[i])) {
      let j = i;
      while (j < sql.length && /[\d.]/.test(sql[j])) j++;
      tokens.push({ type: "number", text: sql.slice(i, j) });
      i = j;
      continue;
    }

    // Word
    if (/[a-zA-Z_]/.test(sql[i])) {
      let j = i;
      while (j < sql.length && /[a-zA-Z0-9_]/.test(sql[j])) j++;
      const word = sql.slice(i, j);
      const upper = word.toUpperCase();
      if (SQL_KEYWORDS.has(upper)) {
        tokens.push({ type: "keyword", text: word });
      } else if (SQL_FUNCTIONS.has(upper)) {
        tokens.push({ type: "function", text: word });
      } else {
        tokens.push({ type: "plain", text: word });
      }
      i = j;
      continue;
    }

    // Anything else (operators, whitespace, parens)
    tokens.push({ type: "plain", text: sql[i] });
    i++;
  }

  return tokens;
}

const TOKEN_CLASS: Record<TokenType, string> = {
  keyword: "text-blue-600 font-semibold",
  function: "text-violet-600",
  string: "text-emerald-600",
  number: "text-orange-500",
  comment: "text-slate-400 italic",
  plain: "text-slate-700",
};

interface Props {
  sql: string;
  dbType?: string;
}

export function SqlBlock({ sql, dbType = "PostgreSQL" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tokens = tokenize(sql);

  // Split into lines for line numbers
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    if (token.type === "plain" && token.text === "\n") {
      lines.push([]);
    } else if (token.text.includes("\n")) {
      // Multi-line token (e.g. comment that hits end of line)
      const parts = token.text.split("\n");
      lines[lines.length - 1].push({ type: token.type, text: parts[0] });
      for (let k = 1; k < parts.length; k++) {
        lines.push([{ type: token.type, text: parts[k] }]);
      }
    } else {
      lines[lines.length - 1].push(token);
    }
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs font-mono">Generated SQL</span>
          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {dbType}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors px-2 py-1 rounded hover:bg-slate-100"
        >
          {copied ? (
            <Check size={13} className="text-emerald-500" />
          ) : (
            <Copy size={13} />
          )}
          {copied ? "已复制" : "复制"}
        </button>
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm font-mono leading-6 min-w-0">
          {lines.map((line, lineIdx) => (
            <div key={lineIdx} className="flex">
              <span className="select-none text-slate-300 text-xs w-6 mr-4 text-right shrink-0 leading-6">
                {lineIdx + 1}
              </span>
              <span className="flex-1">
                {line.map((token, tokenIdx) => (
                  <span key={tokenIdx} className={TOKEN_CLASS[token.type]}>
                    {token.text}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
