import { useEffect, useMemo, useRef, useState } from 'react'
import Header from './Components/Header'
import Balance from './Components/Balance'
import IncomeExpenses from './Components/IncomeExpenses'
import TransactionList from './Components/TransactionList'
import AnalyticsDashboard from './Components/AnalyticsDashboard'
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

type Page = 'overview' | 'dashboard'

function Dashboard({ theme, onThemeChange }: DashboardProps) {
  const { transactions } = useGlobalContext()
  const [currentMonth, setCurrentMonth] = useState(getCurrentTransactionMonth)
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonth)
  const [activePage, setActivePage] = useState<Page>('overview')
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
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
            aria-current={activePage === 'dashboard' ? 'page' : undefined}
            onClick={() => setActivePage('dashboard')}
          >
            Dashboard
          </button>
          <button
            className="page-nav__link"
            type="button"
            aria-current={activePage === 'overview' ? 'page' : undefined}
            onClick={() => setActivePage('overview')}
          >
            Overview
          </button>
        </nav>
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">PERSONAL FINANCE</p>
            <h1 id="page-title">{activePage === 'overview' ? 'Your overview' : 'Your dashboard'}</h1>
            <p className="page-subtitle">
              {activePage === 'overview'
                ? 'Make every penny count wisely.'
                : 'See how your money moves over time.'}
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
        ) : (
          <AnalyticsDashboard transactions={transactions} />
        )}
        <footer className="dashboard-footer">Your finances, thoughtfully organized.</footer>
      </main>
      <nav className="mobile-bottom-nav" aria-label="Main navigation and quick actions">
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
          onClick={() => openAddTransaction()}
          aria-label="Add transaction"
          aria-haspopup="dialog"
          aria-controls="add-transaction-dialog"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
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
