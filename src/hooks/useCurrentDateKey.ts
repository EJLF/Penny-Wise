import { useEffect, useState } from 'react'
import { getLocalDateKey } from '../utils/bankAccountBalance'

const getNextLocalMidnight = () => {
  const nextDay = new Date()
  nextDay.setHours(24, 0, 0, 0)
  return nextDay
}

export const useCurrentDateKey = () => {
  const [dateKey, setDateKey] = useState(() => getLocalDateKey(new Date()))

  useEffect(() => {
    let timeoutId = 0

    const refreshDate = () => {
      window.clearTimeout(timeoutId)
      setDateKey(getLocalDateKey(new Date()))
      timeoutId = window.setTimeout(
        refreshDate,
        getNextLocalMidnight().getTime() - Date.now() + 50,
      )
    }

    refreshDate()
    window.addEventListener('focus', refreshDate)
    document.addEventListener('visibilitychange', refreshDate)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('focus', refreshDate)
      document.removeEventListener('visibilitychange', refreshDate)
    }
  }, [])

  return dateKey
}
