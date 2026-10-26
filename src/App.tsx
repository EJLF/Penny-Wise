import { useEffect, useMemo, useRef, useState } from 'react'
import Header from './Components/Header'
import Balance from './Components/Balance'
import IncomeExpenses from './Components/IncomeExpenses'
import TransactionList from './Components/TransactionList'
import AnalyticsDashboard from './Components/AnalyticsDashboard'
import LiquidityDashboard from './Components/LiquidityDashboard'
import ReminderDashboard, { ReminderPaymentDialog, ReminderPopup } from './Components/Reminders'
import type { Reminder } from './Components/Reminders'
import AddTransaction from './Components/AddTransaction'
import type { TransactionMode } from './Components/AddTransaction'
import type { AppTheme } from './Components/Header'
import { GlobalProvider } from './context/GlobalState'
import { useGlobalContext } from './context/useGlobalContext'
import { useLocalStorage } from './hooks/useLocalStorage'
import {
  getCurrentTransactionMonth,
  getTransactionMonth,
  getTransactionMonthLabel,
  getTransactionMonthOptions,
} from './utils/transactionMonths'
import './App.css'

type DashboardProps = {
  theme: AppTheme
  onThemeChange: (theme: AppTheme) => void
}

type Page = 'overview' | 'dashboard' | 'liquidity' | 'reminders'

const getLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const getNextReminderDate = (
  dueDate: string,
  recurrence: NonNullable<Reminder['recurrence']>,
  today: string,
  recurrenceDay?: number,
) => {
  const [year, month, day] = dueDate.split('-').map(Number)
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number)
  const baseDate = new Date(year, month - 1, day)
  const nowDate = new Date(todayYear, todayMonth - 1, todayDay)
  const baseDay = recurrenceDay ?? baseDate.getDate()
  let occurrences = 1
  let nextDate: Date

  if (recurrence === 'daily' || recurrence === 'weekly') {
    const daysBetween = Math.floor(
      (Date.UTC(todayYear, todayMonth - 1, todayDay) - Date.UTC(year, month - 1, day)) /
      86_400_000,
    )
    const daysPerOccurrence = recurrence === 'daily' ? 1 : 7
    occurrences = Math.max(1, Math.floor(daysBetween / daysPerOccurrence) + 1)
    nextDate = new Date(year, month - 1, day + occurrences * daysPerOccurrence)
  } else if (recurrence === 'monthly') {
    const monthsBetween = (todayYear - year) * 12 + todayMonth - month
    occurrences = Math.max(1, monthsBetween + 1)
    const targetMonth = month - 1 + occurrences
    const targetYear = year + Math.floor(targetMonth / 12)
    const normalizedMonth = targetMonth % 12
    nextDate = new Date(targetYear, normalizedMonth, Math.min(baseDay, new Date(targetYear, normalizedMonth + 1, 0).getDate()))
    if (nextDate <= nowDate) {
      const followingMonth = normalizedMonth + 1
      const followingYear = targetYear + Math.floor(followingMonth / 12)
      const normalizedFollowingMonth = followingMonth % 12
      nextDate = new Date(followingYear, normalizedFollowingMonth, Math.min(baseDay, new Date(followingYear, normalizedFollowingMonth + 1, 0).getDate()))
    }
  } else {
    occurrences = Math.max(1, todayYear - year + 1)
    let targetYear = year + occurrences
    nextDate = new Date(targetYear, month - 1, Math.min(baseDay, new Date(targetYear, month, 0).getDate()))
    if (nextDate <= nowDate) {
      targetYear += 1
      nextDate = new Date(targetYear, month - 1, Math.min(baseDay, new Date(targetYear, month, 0).getDate()))
    }
  }

  return getLocalDateKey(nextDate)
}

function Dashboard({ theme, onThemeChange }: DashboardProps) {
  const { transactions, dispatch } = useGlobalContext()
  const [currentMonth, setCurrentMonth] = useState(getCurrentTransactionMonth)
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonth)
  const [activePage, setActivePage] = useState<Page>('overview')
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false)
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('penny-wise-reminders', [])
  const [paymentReminderId, setPaymentReminderId] = useState<string | null>(null)
  const [accountDialogMode, setAccountDialogMode] = useState<'add' | 'edit'>('add')
  const [transactionMode, setTransactionMode] = useState<TransactionMode>('any')
  const transactionDialogRef = useRef<HTMLDialogElement>(null)
  const currentMonthRef = useRef(currentMonth)
  const monthOptions = useMemo(
    () => getTransactionMonthOptions(transactions, currentMonth),
    [currentMonth, transactions],
  )
  const activeMonth = selectedMonth === 'all' ||
    monthOptions.some((option) => option.value === selectedMonth)
    ? selectedMonth
    : 'all'
  const filteredTransactions = useMemo(
    () => activeMonth === 'all'
      ? transactions
      : transactions.filter((transaction) => getTransactionMonth(transaction) === activeMonth),
    [activeMonth, transactions],
  )
  const paymentReminder = reminders.find((reminder) => reminder.id === paymentReminderId) ?? null

  const recordReminderPayment = (amount: number) => {
    if (!paymentReminder) return
    const paidAt = new Date()
    const paidDate = getLocalDateKey(paidAt)
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        id: crypto.randomUUID(),
        text: paymentReminder.title,
        amount: -amount,
        category: paymentReminder.category,
        date: paidAt.toISOString(),
      },
    })
    setReminders((existing) => existing.map((reminder) => {
      if (reminder.id !== paymentReminder.id) return reminder
      if (reminder.isRecurring) {
        return {
          ...reminder,
          amount: (reminder.hasConfiguredAmount ?? !reminder.isRecurring)
            ? reminder.amount
            : undefined,
          dueDate: getNextReminderDate(
            reminder.dueDate,
            reminder.recurrence ?? 'monthly',
            paidDate,
            reminder.recurrenceDay,
          ),
          status: 'unpaid',
        }
      }
      return { ...reminder, amount, status: 'paid' }
    }))
    setPaymentReminderId(null)
  }

  useEffect(() => {
    if (isAddTransactionOpen && transactionDialogRef.current && !transactionDialogRef.current.open) {
      transactionDialogRef.current.showModal()
    }
  }, [isAddTransactionOpen])

  useEffect(() => {
    const syncCurrentMonth = () => {
      const month = getCurrentTransactionMonth()
      if (month !== currentMonthRef.current) {
        currentMonthRef.current = month
        setCurrentMonth(month)
        setSelectedMonth(month)
      }
    }

    syncCurrentMonth()
    window.addEventListener('focus', syncCurrentMonth)
    window.addEventListener('pageshow', syncCurrentMonth)
    document.addEventListener('visibilitychange', syncCurrentMonth)
    return () => {
      window.removeEventListener('focus', syncCurrentMonth)
      window.removeEventListener('pageshow', syncCurrentMonth)
      document.removeEventListener('visibilitychange', syncCurrentMonth)
    }
  }, [])

  const closeAddTransaction = () => {
    transactionDialogRef.current?.close()
    setIsAddTransactionOpen(false)
  }

  const openAddTransaction = (mode: TransactionMode = 'any') => {
    setTransactionMode(mode)
    setIsAddTransactionOpen(true)
  }

  const openMobileQuickAction = () => {
    if (activePage === 'liquidity') {
      setAccountDialogMode('add')
      setIsAddAccountOpen(true)
      return
    }
    if (activePage === 'reminders') {
      setIsAddReminderOpen(true)
      return
    }
    openAddTransaction()
  }

  const mobileQuickAction = activePage === 'liquidity'
    ? { label: 'Add account', dialogId: 'add-bank-account-form' }
    : activePage === 'reminders'
      ? { label: 'Add reminder', dialogId: 'add-reminder-dialog' }
      : { label: 'Add transaction', dialogId: 'add-transaction-dialog' }

  const periodLabel = activeMonth === 'all'
    ? 'Across all transactions'
    : `For ${getTransactionMonthLabel(activeMonth)}`

  return (
    <div className="app-shell" data-theme={theme}>
      <Header theme={theme} onThemeChange={onThemeChange} />
      <main className="dashboard">
        <nav className="page-nav" aria-label="Main navigation">
          <button
            className="page-nav__link"
            type="button"
            aria-current={activePage === 'overview' ? 'page' : undefined}
            onClick={() => setActivePage('overview')}
          >
            Overview
          </button>
          <button
            className="page-nav__link"
            type="button"
            aria-current={activePage === 'dashboard' ? 'page' : undefined}
            onClick={() => setActivePage('dashboard')}
          >
            Dashboard
          </button>
          <button
            className="page-nav__link"
            type="button"
            aria-current={activePage === 'liquidity' ? 'page' : undefined}
            onClick={() => setActivePage('liquidity')}
          >
            Liquidity
          </button>
          <button
            className="page-nav__link"
            type="button"
            aria-current={activePage === 'reminders' ? 'page' : undefined}
            onClick={() => setActivePage('reminders')}
          >
            Reminders
          </button>
        </nav>
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">PERSONAL FINANCE</p>
            <h1 id="page-title">
              {activePage === 'overview'
                ? 'Your overview'
                : activePage === 'dashboard'
                  ? 'Your dashboard'
                  : activePage === 'liquidity'
                    ? 'Your liquidity'
                    : 'Your reminders'}
            </h1>
            <p className="page-subtitle">
              {activePage === 'overview'
                ? 'Make every penny count wisely.'
                : activePage === 'dashboard'
                  ? 'See how your money moves over time.'
                  : activePage === 'liquidity'
                    ? 'Track available cash and bank coverage in one place.'
                    : 'Stay on top of bills, tuition, and other upcoming payments.'}
            </p>
          </div>
          <div className="page-heading__actions">
            {activePage === 'overview' && (
              <>
                <label className="visually-hidden" htmlFor="transaction-month-filter">
                  Filter transactions by month
                </label>
                <select
                  id="transaction-month-filter"
                  className="month-filter"
                  value={activeMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                >
                  <option value="all">All months</option>
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </>
            )}
            {activePage === 'liquidity' && (
              <button
                className="btn liquidity-heading__add"
                type="button"
                onClick={() => {
                  setAccountDialogMode('add')
                  setIsAddAccountOpen(true)
                }}
                aria-haspopup="dialog"
                aria-controls="add-bank-account-form"
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Add account
              </button>
            )}
            {activePage === 'reminders' && (
              <button className="btn-add-transaction reminders-heading__add" type="button" onClick={() => setIsAddReminderOpen(true)}>
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Add reminder
              </button>
            )}
            {activePage !== 'liquidity' && activePage !== 'reminders' && (
              <button
                className="btn-add-transaction"
                type="button"
                onClick={() => openAddTransaction()}
                aria-haspopup="dialog"
                aria-controls="add-transaction-dialog"
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Add transaction
              </button>
            )}
          </div>
        </section>

        {activePage === 'overview' ? (
          <>
            <section className="overview-grid" aria-label="Account overview">
              <Balance transactions={filteredTransactions} periodLabel={periodLabel} />
              <IncomeExpenses
                transactions={filteredTransactions}
                onAddIncome={() => openAddTransaction('income')}
                onAddExpense={() => openAddTransaction('expense')}
              />
            </section>

            <section className="content-grid" aria-label="Manage transactions">
              <TransactionList
                transactions={filteredTransactions}
                emptyMessage={activeMonth === 'all'
                  ? 'No transactions yet. Add one to get started.'
                  : 'No transactions for this month.'}
              />
            </section>
          </>
        ) : activePage === 'dashboard' ? (
          <AnalyticsDashboard transactions={transactions} />
        ) : activePage === 'liquidity' ? (
          <LiquidityDashboard
            isAddAccountOpen={isAddAccountOpen}
            accountDialogMode={accountDialogMode}
            onOpenAccountDialog={(mode) => {
              setAccountDialogMode(mode)
              setIsAddAccountOpen(true)
            }}
            onCloseAddAccount={() => setIsAddAccountOpen(false)}
          />
        ) : (
          <ReminderDashboard
            reminders={reminders}
            onAddReminder={(reminder) => setReminders((existing) => [{
              ...reminder,
              id: crypto.randomUUID(),
              status: 'unpaid',
            }, ...existing])}
            onUpdateReminder={(updated) => setReminders((existing) =>
              existing.map((reminder) => reminder.id === updated.id ? updated : reminder),
            )}
            onDeleteReminder={(id) => setReminders((existing) =>
              existing.filter((reminder) => reminder.id !== id),
            )}
            onRequestPayment={setPaymentReminderId}
            isAddOpen={isAddReminderOpen}
            onAddOpenChange={setIsAddReminderOpen}
          />
        )}
        <footer className="dashboard-footer">Your finances, thoughtfully organized.</footer>
      </main>
      <nav className="mobile-bottom-nav" aria-label="Main navigation and quick actions">
        <button
          className="mobile-bottom-nav__link"
          type="button"
          aria-label="Overview"
          title="Overview"
          aria-current={activePage === 'overview' ? 'page' : undefined}
          onClick={() => setActivePage('overview')}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m3.5 10 8.5-7 8.5 7v9.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 20.5v-7h6v7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          className="mobile-bottom-nav__link"
          type="button"
          aria-label="Dashboard"
          title="Dashboard"
          aria-current={activePage === 'dashboard' ? 'page' : undefined}
          onClick={() => setActivePage('dashboard')}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 19V11m5 8V5m5 14v-6m6 6V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <button
          className="mobile-bottom-nav__add"
          type="button"
          onClick={openMobileQuickAction}
          aria-label={mobileQuickAction.label}
          aria-haspopup="dialog"
          aria-controls={mobileQuickAction.dialogId}
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>             
        <button
          className="mobile-bottom-nav__link"
          type="button"
          aria-label="Liquidity"
          title="Liquidity"
          aria-current={activePage === 'liquidity' ? 'page' : undefined}
          onClick={() => setActivePage('liquidity')}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3.5" y="6" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M4 10h16m-11 5h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
        <button
          className="mobile-bottom-nav__link"
          type="button"
          aria-label="Reminders"
          title="Reminders"
          aria-current={activePage === 'reminders' ? 'page' : undefined}
          onClick={() => setActivePage('reminders')}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>   
      </nav>
      {isAddTransactionOpen && (
        <dialog
          id="add-transaction-dialog"
          ref={transactionDialogRef}
          className="transaction-dialog"
          onClose={() => setIsAddTransactionOpen(false)}
          onClick={(event) => {
            const dialog = event.currentTarget
            const bounds = dialog.getBoundingClientRect()
            if (
              event.target === dialog &&
              (event.clientX < bounds.left ||
                event.clientX > bounds.right ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom)
            ) {
              closeAddTransaction()
            }
          }}
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
        key={paymentReminder?.id ?? 'no-payment'}
        reminder={paymentReminder}
        onClose={() => setPaymentReminderId(null)}
        onConfirm={recordReminderPayment}
      />
    </div>
  )
}

function App() {
  const [theme, setTheme] = useLocalStorage<AppTheme>('smart-expense-tracker-theme', 'green')

  return (
    <GlobalProvider>
      <Dashboard theme={theme} onThemeChange={setTheme} />
    </GlobalProvider>
  )
}

export default App
