import re

file_path = "src/components/features/manager-dashboard/hooks/useManagerDashboard.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add getStoreSettingsAction import
if "getStoreSettingsAction" not in content:
    content = content.replace("getRecentActivities\n} from", "getRecentActivities,\n  getStoreSettingsAction\n} from")

# 2. Add storeSettings state
if "const [storeSettings, setStoreSettings]" not in content:
    content = content.replace("const [activityLogsDb, setActivityLogsDb] = useState<any[]>(() => initialData?.activities || []);", 
                              "const [activityLogsDb, setActivityLogsDb] = useState<any[]>(() => initialData?.activities || []);\n  const [storeSettings, setStoreSettings] = useState({ pointsEquivalent: 1, tlEquivalent: 1, earnRatio: 10 });")

# 3. Add to Promise.all
old_promise = """      const [profile, txs, custs, emps, invitesList, campaignsRes, activities] = await Promise.all([
        getManagerProfile(),
        getBranchTransactions(),
        getCustomers(debouncedCustomerSearch),
        getOrgMembers(),
        getInvitationsAction(),
        getCampaignsAction(),
        getRecentActivities()
      ]);"""

new_promise = """      const [profile, txs, custs, emps, invitesList, campaignsRes, activities, settings] = await Promise.all([
        getManagerProfile(),
        getBranchTransactions(),
        getCustomers(debouncedCustomerSearch),
        getOrgMembers(),
        getInvitationsAction(),
        getCampaignsAction(),
        getRecentActivities(),
        getStoreSettingsAction()
      ]);"""
content = content.replace(old_promise, new_promise)

# 4. Set store settings
if "setStoreSettings(settings);" not in content:
    content = content.replace("setActivityLogsDb(activities);", "setActivityLogsDb(activities);\n      if (settings && !('error' in settings)) setStoreSettings(settings as any);")

# 5. Return store settings
old_return = """    activityFeed,
  };"""
new_return = """    activityFeed,
    storeSettings,
  };"""
content = content.replace(old_return, new_return)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
