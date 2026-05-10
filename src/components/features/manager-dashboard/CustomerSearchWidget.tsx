"use client";

import { useState } from "react";
import { Search, UserCheck } from "lucide-react";
import { Customer } from "./types";

interface CustomerSearchWidgetProps {
  onSearch: (q: string) => Customer[];
  isDarkMode: boolean;
}

export function CustomerSearchWidget({ onSearch, isDarkMode }: CustomerSearchWidgetProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setResults(onSearch(q));
  };

  return (
    <div className={`rounded-2xl p-5 border transition-all ${
      isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100 shadow-sm"
    }`}>
      <h2 className={`font-bold text-sm mb-4 ${isDarkMode ? "text-white" : "text-slate-800"}`}>Müşteri Sorgula</h2>
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Ad veya telefon..."
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none border transition-all ${
            isDarkMode ? "bg-slate-900 border-slate-700 text-white focus:border-blue-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400"
          }`}
        />
      </div>

      <div className="space-y-2">
        {results.map(c => (
          <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-100"
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-100 text-blue-600"
            }`}>
              {c.firstName[0]}{c.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold truncate ${isDarkMode ? "text-white" : "text-slate-700"}`}>
                {c.firstName} {c.lastName}
              </p>
              <p className="text-slate-500 text-[10px]">{c.phone}</p>
            </div>
            <UserCheck size={14} className="text-emerald-500" />
          </div>
        ))}
        {query.length > 0 && results.length === 0 && (
          <p className="text-center py-2 text-slate-500 text-[10px]">Sonuç bulunamadı.</p>
        )}
      </div>
    </div>
  );
}
