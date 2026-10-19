import type { Transaction } from '../context/AppReducer'
import { formatCurrency } from '../utils/formatCurrency'

type BalanceProps = {
  transactions: Transaction[]
  periodLabel: string
}

const Balance = ({ transactions, periodLabel }: BalanceProps) => {
  const total = transactions.reduce((balance, transaction) => balance + transaction.amount, 0)

  return (
    <article className="balance-card">
      <div className="balance-card__top">
        <p className="balance-card__label">Total balance</p>
        {/* <span className="balance-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="3.5" y="6" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M16 14h4.5M7 6V4.8a1.8 1.8 0 0 1 2.2-1.75l10.3 2.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="16.3" cy="12.5" r="1" fill="currentColor" />
          </svg>
        </span> */}
      </div>
      <p className="balance-card__amount">{formatCurrency(total)}</p>
      <div className="balance-card__bottom">
        <span className="balance-card__period">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m3 10 3.1-3.1 2.3 2.3L13 4.5M9.5 4.5H13V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Current balance
        </span>
        <span>{periodLabel}</span>
      </div>
    </article>
  )
}

export default Balance
