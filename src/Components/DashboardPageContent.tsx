import type { Transaction } from '../context/AppReducer'
import AnalyticsDashboard from './AnalyticsDashboard'
import Balance from './Balance'
import IncomeExpenses from './IncomeExpenses'
import LiquidityDashboard from './LiquidityDashboard'
import ReminderDashboard from './Reminders'
import TransactionList from './TransactionList'
import type { DashboardPage } from './DashboardNavigation'
import type { Reminder } from '../types/reminder'

type DashboardPageContentProps = {
  activePage: DashboardPage
  transactions: Transaction[]
  filteredTransactions: Transaction[]
  periodLabel: string
  emptyTransactionMessage: string
  reminders: Reminder[]
  isAddAccountOpen: boolean
  accountDialogMode: 'add' | 'edit'
  isAddReminderOpen: boolean
  onAddIncome: () => void
  onAddExpense: () => void
  onOpenAccountDialog: (mode: 'add' | 'edit') => void
  onCloseAddAccount: () => void
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'status'>) => void
  onUpdateReminder: (reminder: Reminder) => void
  onDeleteReminder: (id: string) => void
  onRequestPayment: (id: string) => void
  onAddReminderOpenChange: (open: boolean) => void
}

const DashboardPageContent = ({
  activePage,
  transactions,
  filteredTransactions,
  periodLabel,
  emptyTransactionMessage,
  reminders,
  isAddAccountOpen,
  accountDialogMode,
  isAddReminderOpen,
  onAddIncome,
  onAddExpense,
  onOpenAccountDialog,
  onCloseAddAccount,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  onRequestPayment,
  onAddReminderOpenChange,
}: DashboardPageContentProps) => {
  switch (activePage) {
    case 'overview':
      return (
        <>
          <section className="overview-grid" aria-label="Account overview">
            <Balance
              transactions={filteredTransactions}
              periodLabel={periodLabel}
            />
            <IncomeExpenses
              transactions={filteredTransactions}
              onAddIncome={onAddIncome}
              onAddExpense={onAddExpense}
            />
          </section>
          <section className="content-grid" aria-label="Manage transactions">
            <TransactionList
              transactions={filteredTransactions}
              emptyMessage={emptyTransactionMessage}
            />
          </section>
        </>
      )

    case 'dashboard':
      return <AnalyticsDashboard transactions={transactions} />

    case 'liquidity':
      return (
        <LiquidityDashboard
          isAddAccountOpen={isAddAccountOpen}
          accountDialogMode={accountDialogMode}
          onOpenAccountDialog={onOpenAccountDialog}
          onCloseAddAccount={onCloseAddAccount}
        />
      )

    case 'reminders':
      return (
        <ReminderDashboard
          reminders={reminders}
          onAddReminder={onAddReminder}
          onUpdateReminder={onUpdateReminder}
          onDeleteReminder={onDeleteReminder}
          onRequestPayment={onRequestPayment}
          isAddOpen={isAddReminderOpen}
          onAddOpenChange={onAddReminderOpenChange}
        />
      )
  }
}

export default DashboardPageContent
