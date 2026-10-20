import { useGlobalContext } from '../context/useGlobalContext'
import type { Transaction as TransactionItem } from '../context/AppReducer'
import { formatCurrency } from '../utils/formatCurrency'

const Transaction = ({ transaction }: { transaction: TransactionItem }) => {
  const { dispatch } = useGlobalContext()
  const isIncome = transaction.amount > 0

  return (
    <li className={`transaction-row${isIncome ? ' transaction-row--income' : ''}`}>
      <span className="transaction-row__icon" aria-hidden="true">
        {isIncome ? (
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 19V5m0 0L6.5 10.5M12 5l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="4" y="6.5" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <path d="M4.5 10h15M8 15h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <span className="transaction-row__details">
        <span className="transaction-row__name">{transaction.text}</span>
        <span className="transaction-row__category">
          {transaction.category || (isIncome ? 'Income' : 'Expense')}
        </span>
      </span>
      <span className="transaction-row__amount">
        {isIncome ? '+' : '−'}{formatCurrency(Math.abs(transaction.amount))}
      </span>
      <button
        className="delete-btn"
        type="button"
        aria-label={`Delete ${transaction.text}`}
        onClick={() => dispatch({ type: 'DELETE_TRANSACTION', payload: transaction.id })}
      >
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M4 6h12M8 6V4h4v2m2 0-.7 10H6.7L6 6m2.5 3v4m3-4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </li>
  )
}

export default Transaction
