import re

with open('src/app/(manager)/manager-dashboard/client-page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Rename ManagerDashboardClient to OverviewClient
content = content.replace('ManagerDashboardClientProps', 'OverviewClientProps')
content = content.replace('ManagerDashboardClient', 'OverviewClient')

# We don't need TABS anymore
content = re.sub(r'const TABS = \[.*?\];\n\n', '', content, flags=re.DOTALL)

# In the render, remove the wrapper bg-[#0f172a] text-white as it's already in layout-client.tsx
# Wait, let's just replace the whole return block for cleaner code.
old_return = '''  return (
    <div className={`min-h-screen w-full transition-colors duration-500 font-sans ${dashboard.isDarkMode ? "bg-[#0f172a] text-white" : "bg-slate-50 text-slate-900"}`}>
      <ManagerDashboardModals 
        showInvite={showInvite} setShowInvite={setShowInvite}
        branchInfo={dashboard.branchInfo} refreshData={dashboard.refreshData}
        showSignOutOverlay={showSignOutOverlay} signOut={signOut}
        showAddCustomer={showAddCustomer} setShowAddCustomer={setShowAddCustomer}
        handleAddCustomer={dashboard.handleAddCustomer}
        editingTransaction={editingTransaction} setEditingTransaction={setEditingTransaction}
        handleEditPointsSave={dashboard.handleEditPointsSave} isDarkMode={dashboard.isDarkMode}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={dashboard.activeTab} initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
          >
            {dashboard.activeTab === 0 && (
              <TransactionsSection 
                transactions={dashboard.transactions} cashiers={dashboard.cashiers}
                isDarkMode={dashboard.isDarkMode}
                onEditTransaction={setEditingTransaction}
              />
            )}
            {dashboard.activeTab === 1 && (
              <CustomersSection 
                customers={dashboard.customers}
                transactions={dashboard.transactions}
                isDarkMode={dashboard.isDarkMode}
                searchQuery={dashboard.customerSearch}
                onSearchChange={dashboard.setCustomerSearch}
              />
            )}
            {dashboard.activeTab === 2 && (
              <StaffSection 
                cashiers={dashboard.cashiers} isDarkMode={dashboard.isDarkMode}
                handleUpdateCashier={dashboard.handleUpdateCashier} handleRemoveCashier={dashboard.handleRemoveCashier}
                handleToggleStatus={dashboard.handleToggleStatus}
                setShowInvite={setShowInvite} loadingId={dashboard.loadingId}
                invitations={dashboard.invitations}
              />
            )}
            {dashboard.activeTab === 3 && (
              <CampaignSection isDarkMode={dashboard.isDarkMode} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );'''

new_return = '''  return (
    <>
      <ManagerDashboardModals 
        showInvite={showInvite} setShowInvite={setShowInvite}
        branchInfo={dashboard.branchInfo} refreshData={dashboard.refreshData}
        showSignOutOverlay={showSignOutOverlay} signOut={signOut}
        showAddCustomer={showAddCustomer} setShowAddCustomer={setShowAddCustomer}
        handleAddCustomer={dashboard.handleAddCustomer}
        editingTransaction={editingTransaction} setEditingTransaction={setEditingTransaction}
        handleEditPointsSave={dashboard.handleEditPointsSave} isDarkMode={dashboard.isDarkMode}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            transition={{ duration: 0.2 }}
          >
            <TransactionsSection 
              transactions={dashboard.transactions} cashiers={dashboard.cashiers}
              isDarkMode={dashboard.isDarkMode}
              onEditTransaction={setEditingTransaction}
            />
          </motion.div>
        </AnimatePresence>
      </main>
    </>
  );'''

content = content.replace(old_return, new_return)

with open('src/app/(manager)/manager-dashboard/client-page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

