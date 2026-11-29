import { useEffect, useRef, useState, type MouseEvent } from 'react'
import AddTransaction from './Components/AddTransaction'
import type { TransactionMode } from './Components/AddTransaction'
import DashboardNavigation, {
  MobileBottomNavigation,
  type DashboardPage,
  type MobileQuickAction,
} from './Components/DashboardNavigation'
import DashboardPageContent from './Components/DashboardPageContent'
import DashboardPageHeading from './Components/DashboardPageHeading'
import Header, { type AppTheme } from './Components/Header'
import {
  ReminderPaymentDialog,
  ReminderPopup,
} from './Components/Reminders'
import { GlobalProvider } from './context/GlobalState'
import { useGlobalContext } from './context/useGlobalContext'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useTransactionMonthFilter } from './hooks/useTransactionMonthFilter'
import type { Reminder } from './types/reminder'
import { getLocalDateKey } from './utils/bankAccountBalance'
import { getNextReminderDate } from './utils/reminderDates'
import { getTransactionMonthLabel } from './utils/transactionMonths'
import './App.css'

type DashboardProps = {
  theme: AppTheme
  onThemeChange: (theme: AppTheme) => void
}

const REMINDERS_STORAGE_KEY = 'penny-wise-reminders'
const ACTIVE_PAGE_STORAGE_KEY = 'penny-wise-active-page'

const getMobileQuickAction = (page: DashboardPage): MobileQuickAction => {
  switch (page) {
    case 'liquidity':
      return { label: 'Add account', dialogId: 'add-bank-account-form' }
    case 'reminders':
      return { label: 'Add reminder', dialogId: 'add-reminder-dialog' }
    default:
      return { label: 'Add transaction', dialogId: 'add-transaction-dialog' }
  }
}

function Dashboard({ theme, onThemeChange }: DashboardProps) {
  const { transactions, dispatch } = useGlobalContext()
  const {
    activeMonth,
    filteredTransactions,
    monthOptions,
    setSelectedMonth,
  } = useTransactionMonthFilter(transactions)
  const [activePage, setActivePage] = useLocalStorage<DashboardPage>(
    ACTIVE_PAGE_STORAGE_KEY,
    'overview',
  )
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false)
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(
    REMINDERS_STORAGE_KEY,
    [],
  )
  const [paymentReminderId, setPaymentReminderId] = useState<string | null>(null)
  const [accountDialogMode, setAccountDialogMode] = useState<'add' | 'edit'>('add')
  const [transactionMode, setTransactionMode] = useState<TransactionMode>('any')
  const transactionDialogRef = useRef<HTMLDialogElement>(null)

  const selectedPaymentReminder =
    reminders.find((reminder) => reminder.id === paymentReminderId) ?? null
  const mobileQuickAction = getMobileQuickAction(activePage)
  const periodLabel =
    activeMonth === 'all'
      ? 'Across all transactions'
      : `For ${getTransactionMonthLabel(activeMonth)}`
  const emptyTransactionMessage =
    activeMonth === 'all'
      ? 'No transactions yet. Add one to get started.'
      : 'No transactions for this month.'

  useEffect(() => {
    const dialog = transactionDialogRef.current
    if (isAddTransactionOpen && dialog && !dialog.open) {
      dialog.showModal()
    }
  }, [isAddTransactionOpen])

  const openAddTransaction = (mode: TransactionMode = 'any') => {
    setTransactionMode(mode)
    setIsAddTransactionOpen(true)
  }

  const closeAddTransaction = () => {
    transactionDialogRef.current?.close()
    setIsAddTransactionOpen(false)
  }

  const openAddAccount = () => {
    setAccountDialogMode('add')
    setIsAddAccountOpen(true)
  }

  const openMobileQuickAction = () => {
    if (activePage === 'liquidity') {
      openAddAccount()
      return
    }

    if (activePage === 'reminders') {
      setIsAddReminderOpen(true)
      return
    }

    openAddTransaction()
  }

  const handleReminderPayment = (amount: number) => {
    if (!selectedPaymentReminder) return

    const paidAt = new Date()
    const paidDate = getLocalDateKey(paidAt)
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        id: crypto.randomUUID(),
        text: selectedPaymentReminder.title,
        amount: -amount,
        category: selectedPaymentReminder.category,
        date: paidAt.toISOString(),
      },
    })

    setReminders((existingReminders) =>
      existingReminders.map((reminder) => {
        if (reminder.id !== selectedPaymentReminder.id) return reminder
        if (!reminder.isRecurring) {
          return { ...reminder, amount, status: 'paid' }
        }

        return {
          ...reminder,
          amount: reminder.hasConfiguredAmount ? reminder.amount : undefined,
          lastPaidDate: paidDate,
          dueDate: getNextReminderDate(
            reminder.dueDate,
            reminder.recurrence ?? 'monthly',
            paidDate,
            reminder.recurrenceDay,
          ),
          status: 'paid',
        }
      }),
    )
    setPaymentReminderId(null)
  }

  const handleTransactionDialogClick = (
    event: MouseEvent<HTMLDialogElement>,
  ) => {
    const dialog = event.currentTarget
    const bounds = dialog.getBoundingClientRect()
    const clickedOutsideDialog =
      event.target === dialog &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)

    if (clickedOutsideDialog) closeAddTransaction()
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <Header theme={theme} onThemeChange={onThemeChange} />
      <main className="dashboard">
        <DashboardNavigation
          activePage={activePage}
          onPageChange={setActivePage}
        />
        <DashboardPageHeading
          activePage={activePage}
          activeMonth={activeMonth}
          monthOptions={monthOptions}
          onMonthChange={setSelectedMonth}
          onAddTransaction={() => openAddTransaction()}
          onAddAccount={openAddAccount}
          onAddReminder={() => setIsAddReminderOpen(true)}
        />
        <DashboardPageContent
          activePage={activePage}
          transactions={transactions}
          filteredTransactions={filteredTransactions}
          periodLabel={periodLabel}
          emptyTransactionMessage={emptyTransactionMessage}
          reminders={reminders}
          isAddAccountOpen={isAddAccountOpen}
          accountDialogMode={accountDialogMode}
          isAddReminderOpen={isAddReminderOpen}
          onAddIncome={() => openAddTransaction('income')}
          onAddExpense={() => openAddTransaction('expense')}
          onOpenAccountDialog={(mode) => {
            setAccountDialogMode(mode)
            setIsAddAccountOpen(true)
          }}
          onCloseAddAccount={() => setIsAddAccountOpen(false)}
          onAddReminder={(reminder) =>
            setReminders((existingReminders) => [
              { ...reminder, id: crypto.randomUUID(), status: 'unpaid' },
              ...existingReminders,
            ])
          }
          onUpdateReminder={(updatedReminder) =>
            setReminders((existingReminders) =>
              existingReminders.map((reminder) =>
                reminder.id === updatedReminder.id ? updatedReminder : reminder,
              ),
            )
          }
          onDeleteReminder={(reminderId) =>
            setReminders((existingReminders) =>
              existingReminders.filter(
                (reminder) => reminder.id !== reminderId,
              ),
            )
          }
          onRequestPayment={setPaymentReminderId}
          onAddReminderOpenChange={setIsAddReminderOpen}
        />
        <footer className="dashboard-footer">
          Your finances, thoughtfully organized.
        </footer>
      </main>
      <MobileBottomNavigation
        activePage={activePage}
        quickAction={mobileQuickAction}
        onPageChange={setActivePage}
        onQuickAction={openMobileQuickAction}
      />
      {isAddTransactionOpen && (
        <dialog
          id="add-transaction-dialog"
          ref={transactionDialogRef}
          className="transaction-dialog"
          onClose={() => setIsAddTransactionOpen(false)}
          onClick={handleTransactionDialogClick}
        >
          <AddTransaction
            key={transactionMode}
            onClose={closeAddTransaction}
            mode={transactionMode}
          />
        </dialog>
      )}
      <ReminderPopup
        reminders={reminders}
        onRequestPayment={setPaymentReminderId}
      />
      <ReminderPaymentDialog
        key={selectedPaymentReminder?.id ?? 'no-payment'}
        reminder={selectedPaymentReminder}
        onClose={() => setPaymentReminderId(null)}
        onConfirm={handleReminderPayment}
      />
    </div>
  )
}

function App() {
  const [theme, setTheme] = useLocalStorage<AppTheme>(
    'smart-expense-tracker-theme',
    'green',
  )

  return (
    <GlobalProvider>
      <Dashboard theme={theme} onThemeChange={setTheme} />
    </GlobalProvider>
  )
}

export default App
