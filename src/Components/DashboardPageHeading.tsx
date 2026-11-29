import type { DashboardPage } from './DashboardNavigation'

type MonthOption = {
  value: string
  label: string
}

type DashboardPageHeadingProps = {
  activePage: DashboardPage
  activeMonth: string
  monthOptions: MonthOption[]
  onMonthChange: (month: string) => void
  onAddTransaction: () => void
  onAddAccount: () => void
  onAddReminder: () => void
}

const pageCopy: Record<DashboardPage, { title: string; subtitle: string }> = {
  overview: {
    title: 'Your overview',
    subtitle: 'Make every penny count wisely.',
  },
  dashboard: {
    title: 'Your dashboard',
    subtitle: 'See how your money moves over time.',
  },
  liquidity: {
    title: 'Your liquidity',
    subtitle: 'Track available cash and bank coverage in one place.',
  },
  reminders: {
    title: 'Your reminders',
    subtitle: 'Stay on top of bills, tuition, and other upcoming payments.',
  },
}

const AddIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

const DashboardPageHeading = ({
  activePage,
  activeMonth,
  monthOptions,
  onMonthChange,
  onAddTransaction,
  onAddAccount,
  onAddReminder,
}: DashboardPageHeadingProps) => {
  const { title, subtitle } = pageCopy[activePage]

  return (
    <section className="page-heading" aria-labelledby="page-title">
      <div>
        <p className="eyebrow">PERSONAL FINANCE</p>
        <h1 id="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
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
              onChange={(event) => onMonthChange(event.target.value)}
            >
              <option value="all">All months</option>
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        )}
        {activePage === 'liquidity' && (
          <button
            className="btn liquidity-heading__add"
            type="button"
            onClick={onAddAccount}
            aria-haspopup="dialog"
            aria-controls="add-bank-account-form"
          >
            <AddIcon />
            Add account
          </button>
        )}
        {activePage === 'reminders' && (
          <button
            className="btn-add-transaction reminders-heading__add"
            type="button"
            onClick={onAddReminder}
          >
            <AddIcon />
            Add reminder
          </button>
        )}
        {(activePage === 'overview' || activePage === 'dashboard') && (
          <button
            className="btn-add-transaction"
            type="button"
            onClick={onAddTransaction}
            aria-haspopup="dialog"
            aria-controls="add-transaction-dialog"
          >
            <AddIcon />
            Add transaction
          </button>
        )}
      </div>
    </section>
  )
}

export default DashboardPageHeading
