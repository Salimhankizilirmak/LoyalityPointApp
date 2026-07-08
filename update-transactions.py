import re

file_path = "src/components/features/manager-dashboard/sections/TransactionsSection.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports ekle
imports = """import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DayPicker, DateRange } from "react-day-picker";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import "react-day-picker/dist/style.css";"""
content = content.replace('import jsPDF from "jspdf";\nimport autoTable from "jspdf-autotable";', imports)

# 2. State Değiştir
old_state = """  const [filterType, setFilterType] = useState<FilterType>("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");"""
new_state = """  const [filterType, setFilterType] = useState<FilterType>("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);"""
content = content.replace(old_state, new_state)

# 3. filteredFeed mantığı
old_filter = """      if (filterType === "custom") {
        if (!startDate && !endDate) return true;
        let start = startDate ? new Date(startDate).getTime() : 0;
        let end = endDate ? new Date(endDate).getTime() + 86399999 : Infinity; // Include the end of the day
        return itemTime >= start && itemTime <= end;
      }
      return true;
    });
  }, [activityFeed, filterType, startDate, endDate]);"""
new_filter = """      if (filterType === "custom") {
        if (!dateRange?.from) return true;
        let start = dateRange.from.getTime();
        let end = dateRange.to ? dateRange.to.getTime() + 86399999 : start + 86399999;
        return itemTime >= start && itemTime <= end;
      }
      return true;
    });
  }, [activityFeed, filterType, dateRange]);"""
content = content.replace(old_filter, new_filter)

# 4. Render UI
old_ui = """            <button 
              onClick={() => setFilterType("custom")} 
              className={`flex items-center gap-1 ${getFilterButtonClass("custom")}`}
            >
              <CalendarRange size={12} /> Özel
            </button>

            {filterType === "custom" && (
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10 ml-2">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs text-white border-none outline-none focus:ring-0 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
                <span className="text-neutral-500 text-xs">-</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs text-white border-none outline-none focus:ring-0 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
            )}"""

new_ui = """            <div className="relative">
              <button 
                onClick={() => {
                  setFilterType("custom");
                  setIsCalendarOpen(!isCalendarOpen);
                }} 
                className={`flex items-center gap-1 ${getFilterButtonClass("custom")}`}
              >
                <CalendarRange size={12} /> 
                {filterType === "custom" && dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, "dd MMM", { locale: tr })} - ${format(dateRange.to, "dd MMM", { locale: tr })}`
                  ) : (
                    format(dateRange.from, "dd MMM", { locale: tr })
                  )
                ) : (
                  "Özel"
                )}
              </button>

              {filterType === "custom" && isCalendarOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-[#111118] border border-white/10 rounded-xl shadow-2xl p-3 min-w-[280px]">
                  <style>{`
                    .rdp { --rdp-cell-size: 36px; --rdp-accent-color: #10b981; --rdp-background-color: rgba(16,185,129,0.1); margin: 0; }
                    .rdp-day_selected { background-color: var(--rdp-accent-color) !important; color: white !important; font-weight: bold; }
                    .rdp-day_range_middle { background-color: var(--rdp-background-color) !important; color: white !important; border-radius: 0; }
                    .rdp-day_range_start { border-top-right-radius: 0; border-bottom-right-radius: 0; }
                    .rdp-day_range_end { border-top-left-radius: 0; border-bottom-left-radius: 0; }
                    .rdp-caption_label { color: white; font-weight: bold; text-transform: capitalize; }
                    .rdp-head_cell { color: #a3a3a3; font-weight: normal; font-size: 12px; text-transform: uppercase; }
                    .rdp-day { color: #e5e5e5; }
                    .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: rgba(255,255,255,0.1); }
                    .rdp-nav_button { color: #a3a3a3; }
                    .rdp-nav_button:hover { color: white; }
                  `}</style>
                  <DayPicker
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    locale={tr}
                    showOutsideDays={false}
                  />
                  <div className="mt-3 flex justify-end border-t border-white/10 pt-3">
                    <button 
                      onClick={() => setIsCalendarOpen(false)}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-bold text-white transition-colors"
                    >
                      Uygula
                    </button>
                  </div>
                </div>
              )}
            </div>"""

content = content.replace(old_ui, new_ui)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
