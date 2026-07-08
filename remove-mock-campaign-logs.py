import re

file_path = "src/components/features/manager-dashboard/hooks/useManagerDashboard.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Mock campaign update logic in activityFeed array
mock_campaigns = """    // Map campaign updates
    ...campaigns.filter(c => c.updatedAt).map((c): ActivityItem => {
      const updatedTime = new Date(c.updatedAt);
      return {
        id: `camp-upd-${c.id}`,
        type: "system",
        actorName: "Sistem",
        targetName: `"${c.name}" süresi güncellendi`,
        time: updatedTime.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        rawTime: updatedTime.getTime(),
      };
    }),"""

content = content.replace(mock_campaigns, "    /* Mock campaign updates removed, backend activityLogs now holds true records */")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
