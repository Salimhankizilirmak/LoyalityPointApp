import re

file_path = "src/components/features/boss-dashboard/ui/BranchAnalytics.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Props
content = content.replace("isLoading?: boolean;\n}", "isLoading?: boolean;\n  selectedRange?: string;\n}")

# Parametreler
content = content.replace("isLoading = false,\n}: BranchAnalyticsProps) {", "isLoading = false,\n  selectedRange = '7days',\n}: BranchAnalyticsProps) {")

# Tooltip
new_tooltip = """function CustomTooltip({ 
  active, 
  payload, 
  label, 
  currencyFormatter, 
  numberFormatter 
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    // PieChart durumunda label undefined gelir, ad "name" payload icindedir.
    const isPie = payload.length === 1 && payload[0].payload && payload[0].payload.name;
    
    if (isPie) {
      const data = payload[0];
      return (
        <div className="glass-panel-elevated p-4 rounded-2xl border border-cyan-500/20 bg-[#0a0a0f]/90 backdrop-blur-md shadow-2xl text-xs space-y-2">
          <p className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Award size={12} className="text-cyan-400" /> {data.name}
          </p>
          <div className="space-y-1 font-mono">
            <p className="text-white font-bold flex justify-between gap-6">
              <span>Değer:</span>
              <span>{numberFormatter.format(data.value)}</span>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="glass-panel-elevated p-4 rounded-2xl border border-cyan-500/20 bg-[#0a0a0f]/90 backdrop-blur-md shadow-2xl text-xs space-y-2">
        <p className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={12} className="text-cyan-400" /> {label}
        </p>
        <div className="space-y-1 font-mono">
          <p className="text-cyan-400 font-bold flex justify-between gap-6">
            <span>Ciro (TL):</span>
            <span>{currencyFormatter.format(payload[0]?.value ?? 0)}</span>
          </p>
          <p className="text-teal-400 font-bold flex justify-between gap-6">
            <span>Kazanılan Puan:</span>
            <span>{numberFormatter.format(payload[1]?.value ?? 0)}</span>
          </p>
          <p className="text-rose-400 font-bold flex justify-between gap-6">
            <span>Harcanan Puan:</span>
            <span>{numberFormatter.format(payload[2]?.value ?? 0)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}"""
content = re.sub(r"function CustomTooltip\(\{.*?return null;\n\}", new_tooltip, content, flags=re.DOTALL)

# Render Chart Area
new_chart = """              <ResponsiveContainer width="100%" height="100%">
                {selectedRange === "today" ? (
                  <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <Tooltip content={<CustomTooltip currencyFormatter={currencyFormatter} numberFormatter={numberFormatter} />} />
                    <Pie
                      data={[
                        { name: "Kazandırılan Puan", value: totalPointsEarned, color: "#14b8a6" },
                        { name: "Harcanan Puan", value: totalPointsBurned, color: "#f43f5e" }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {
                        [
                          { name: "Kazandırılan Puan", value: totalPointsEarned, color: "#14b8a6" },
                          { name: "Harcanan Puan", value: totalPointsBurned, color: "#f43f5e" }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))
                      }
                    </Pie>
                  </PieChart>
                ) : chartType === "alan" ? (
                  <AreaChart data={chartData.map((d) => ({ ...d, revenue: d.revenue / 100 }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient>
                      <linearGradient id="colorPointsEarned" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} /><stop offset="95%" stopColor="#14b8a6" stopOpacity={0} /></linearGradient>
                      <linearGradient id="colorPointsBurned" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff30" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#ffffff30" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip content={<CustomTooltip currencyFormatter={currencyFormatter} numberFormatter={numberFormatter} />} />
                    <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Ciro (TL)" />
                    <Area type="monotone" dataKey="pointsEarned" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorPointsEarned)" name="Kazanılan Puan" />
                    <Area type="monotone" dataKey="pointsBurned" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorPointsBurned)" name="Harcanan Puan" />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData.map((d) => ({ ...d, revenue: d.revenue / 100 }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff30" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#ffffff30" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} dx={-10} />
                    <Tooltip content={<CustomTooltip currencyFormatter={currencyFormatter} numberFormatter={numberFormatter} />} />
                    <Bar dataKey="revenue" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Ciro (TL)" />
                    <Bar dataKey="pointsEarned" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Kazanılan Puan" />
                    <Bar dataKey="pointsBurned" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Harcanan Puan" />
                  </BarChart>
                )}
              </ResponsiveContainer>"""
content = re.sub(r"<ResponsiveContainer width=\"100%\" height=\"100%\">.*?</ResponsiveContainer>", new_chart, content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

