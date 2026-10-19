import type { Transaction as TransactionItem } from '../context/AppReducer'
import { getTransactionMonth, getTransactionMonthLabel } from '../utils/transactionMonths'
import Transaction from './Transaction'

type TransactionGroup = {
  key: string
  label: string
  transactions: TransactionItem[]
}

type TransactionListProps = {
  transactions: TransactionItem[]
  emptyMessage: string
}

const TransactionList = ({ transactions, emptyMessage }: TransactionListProps) => {
  const grouped = new Map<string, TransactionGroup>()

  transactions.forEach((transaction) => {
    const key = getTransactionMonth(transaction)
    const group = grouped.get(key) ?? {
      key,
      label: getTransactionMonthLabel(key),
      transactions: [],
    }
    group.transactions.push(transaction)
    grouped.set(key, group)
  })

  const groups = Array.from(grouped.values()).sort((left, right) => {
    if (left.key === 'undated') return 1
    if (right.key === 'undated') return -1
    return right.key.localeCompare(left.key)
  })

  return (
    <section className="panel" aria-labelledby="history-title">
      <div className="panel__heading">
        <div>
          <h2 className="panel__title" id="history-title">Recent transactions</h2>
          <p className="panel__subtitle">Your latest money movements</p>
        </div>
        <span className="panel__count">{transactions.length} total</span>
      </div>
      {transactions.length > 0 ? (
        <div className="transaction-groups">
          {groups.map((group) => (
            <section className="transaction-group" key={group.key} aria-label={group.label}>
              <h3 className="transaction-group__title">{group.label}</h3>
              <ul className="transaction-list">
                {group.transactions.map((transaction) => (
                  <Transaction key={transaction.id} transaction={transaction} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="empty-state">{emptyMessage}</p>
      )}
    </section>
  )
}

export default TransactionList
