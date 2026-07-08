import re

file_path = "src/components/features/manager-dashboard/sections/TransactionsSection.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_ui = """            {filterType === "custom" && (
              <div className="flex items-center gap-3 bg-neutral-900 p-1.5 rounded-lg border border-neutral-800 ml-2 shadow-inner">
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-xs text-neutral-200 border-none outline-none focus:ring-0 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                  />
                </div>
                <div className="w-px h-4 bg-neutral-700"></div>
                <div className="flex items-center gap-2">
                  <input 
                    type="date" 
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-xs text-neutral-200 border-none outline-none focus:ring-0 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
                  />
                </div>
              </div>
            )}"""

new_ui = """            {filterType === "custom" && (
              <div className="flex items-center gap-2 ml-2">
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#13131a] border border-white/10 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0"
                  />
                  <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                </div>
                <span className="text-neutral-500 font-bold">-</span>
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#13131a] border border-white/10 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:top-0 [&::-webkit-calendar-picker-indicator]:left-0"
                  />
                  <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                </div>
              </div>
            )}"""

content = content.replace(old_ui, new_ui)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
