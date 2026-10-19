import type { Transaction } from '../context/AppReducer'

export type TransactionMonth = string | 'undated'

export const getCurrentTransactionMonth = (): TransactionMonth => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const getTransactionMonth = (transaction: Pick<Transaction, 'date'>): TransactionMonth => {
  if (!transaction.date) {
    return 'undated'
  }

  const date = new Date(transaction.date)
  if (!Number.isFinite(date.getTime())) {
    return 'undated'
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export const getTransactionMonthLabel = (month: TransactionMonth): string => {
  if (month === 'undated') {
    return 'Date not recorded'
  }

  const [year, monthNumber] = month.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
    new Date(year, monthNumber - 1, 1),
  )
}

export const getTransactionMonthOptions = (
  transactions: Transaction[],
  currentMonth = getCurrentTransactionMonth(),
) => {
  const months = new Set(transactions.map(getTransactionMonth))
  months.add(currentMonth)

  return Array.from(months)
    .sort((left, right) => {
      if (left === 'undated') return 1
      if (right === 'undated') return -1
      return right.localeCompare(left)
    })
    .map((month) => ({ value: month, label: getTransactionMonthLabel(month) }))
}
