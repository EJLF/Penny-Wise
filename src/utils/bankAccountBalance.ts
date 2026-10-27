export type InterestFrequency = 'daily' | 'monthly' | 'yearly'

export type InterestBearingAccount = {
  currentBalance: number
  interestRate?: number
  interestFrequency?: InterestFrequency
  createdAt?: string
}

const periodsPerYear: Record<InterestFrequency, number> = {
  daily: 365,
  monthly: 12,
  yearly: 1,
}

const parseDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return null
  return { year, month, day }
}

const getCompletedPeriods = (
  createdAt: string,
  asOf: string,
  frequency: InterestFrequency,
) => {
  const start = parseDate(createdAt)
  const end = parseDate(asOf)
  if (!start || !end) return 0

  if (frequency === 'daily') {
    const startTime = Date.UTC(start.year, start.month - 1, start.day)
    const endTime = Date.UTC(end.year, end.month - 1, end.day)
    return Math.max(0, Math.floor((endTime - startTime) / 86_400_000))
  }

  if (frequency === 'monthly') {
    const months = (end.year - start.year) * 12 + end.month - start.month
    return Math.max(0, months - (end.day < start.day ? 1 : 0))
  }

  const years = end.year - start.year
  const anniversaryHasPassed = end.month > start.month ||
    (end.month === start.month && end.day >= start.day)
  return Math.max(0, years - (anniversaryHasPassed ? 0 : 1))
}

export const getCurrentAccountBalance = (
  account: InterestBearingAccount,
  asOf: string,
) => {
  const { currentBalance, interestRate = 0, interestFrequency, createdAt } = account
  if (!createdAt || !interestFrequency || interestRate <= 0 || currentBalance <= 0) {
    return currentBalance
  }

  const periods = getCompletedPeriods(createdAt, asOf, interestFrequency)
  if (periods === 0) return currentBalance

  const periodsPerYearCount = periodsPerYear[interestFrequency]
  const compoundFactor = 1 + interestRate / 100 / periodsPerYearCount
  return Math.round(
    currentBalance * compoundFactor ** periods * 100,
  ) / 100
}

export const getLocalDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
