import type { Transaction } from '../context/AppReducer'
import { formatCurrency } from '../utils/formatCurrency'

type IncomeExpensesProps = {
  transactions: Transaction[]
  onAddIncome: () => void
  onAddExpense: () => void
}

const IncomeExpenses = ({ transactions, onAddIncome, onAddExpense }: IncomeExpensesProps) => {
  const income = transactions
    .filter((transaction) => transaction.amount > 0)
    .reduce((total, transaction) => total + transaction.amount, 0)
  const expenses = transactions
    .filter((transaction) => transaction.amount < 0)
    .reduce((total, transaction) => total + Math.abs(transaction.amount), 0)

  return (
    <div className="summary-grid">
      <article
        className="summary-card summary-card--income"
        role="button"
        tabIndex={0}
        aria-label={`Total income ${formatCurrency(income)}. Add income transaction.`}
        onClick={onAddIncome}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onAddIncome()
          }
        }}
      >
        <div className="summary-card__top">
          <p className="summary-card__label">Total income</p>
          <span className="summary-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5m0 0L6.5 10.5M12 5l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <div>
          <p className="summary-card__amount">{formatCurrency(income)}</p>
          <p className="summary-card__caption">Money coming in</p>
        </div>
      </article>
      <article
        className="summary-card summary-card--expense"
        role="button"
        tabIndex={0}
        aria-label={`Total expenses ${formatCurrency(expenses)}. Add expense transaction.`}
        onClick={onAddExpense}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onAddExpense()
          }
        }}
      >
        <div className="summary-card__top">
          <p className="summary-card__label">Total expenses</p>
          <span className="summary-card__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m0 0 5.5-5.5M12 19l-5.5-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <div>
          <p className="summary-card__amount">{formatCurrency(expenses)}</p>
          <p className="summary-card__caption">Money going out</p>
        </div>
      </article>
    </div>
  )
}

export default IncomeExpenses
