import { useEffect, useMemo, useRef, useState } from 'react'
import type { Transaction } from '../context/AppReducer'
import {
  getCurrentTransactionMonth,
  getTransactionMonth,
  getTransactionMonthOptions,
} from '../utils/transactionMonths'

export const useTransactionMonthFilter = (transactions: Transaction[]) => {
  const [currentMonth, setCurrentMonth] = useState(getCurrentTransactionMonth)
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonth)
  const currentMonthRef = useRef(currentMonth)

  const monthOptions = useMemo(
    () => getTransactionMonthOptions(transactions, currentMonth),
    [currentMonth, transactions],
  )
  const activeMonth =
    selectedMonth === 'all' ||
    monthOptions.some((option) => option.value === selectedMonth)
      ? selectedMonth
      : 'all'

  const filteredTransactions = useMemo(
    () =>
      activeMonth === 'all'
        ? transactions
        : transactions.filter(
            (transaction) => getTransactionMonth(transaction) === activeMonth,
          ),
    [activeMonth, transactions],
  )

  useEffect(() => {
    const syncCurrentMonth = () => {
      const latestMonth = getCurrentTransactionMonth()
      if (latestMonth === currentMonthRef.current) return

      currentMonthRef.current = latestMonth
      setCurrentMonth(latestMonth)
      setSelectedMonth(latestMonth)
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

  return {
    activeMonth,
    filteredTransactions,
    monthOptions,
    setSelectedMonth,
  }
}
