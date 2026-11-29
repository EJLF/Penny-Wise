import type { ReminderRecurrence } from '../types/reminder'
import { getLocalDateKey } from './bankAccountBalance'

const MILLISECONDS_PER_DAY = 86_400_000

const getDaysInMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate()

const getDateAtMonthDay = (year: number, monthIndex: number, day: number) =>
  new Date(year, monthIndex, Math.min(day, getDaysInMonth(year, monthIndex)))

export const getNextReminderDate = (
  dueDate: string,
  recurrence: ReminderRecurrence,
  today: string,
  recurrenceDay?: number,
) => {
  const [dueYear, dueMonth, dueDay] = dueDate.split('-').map(Number)
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number)
  const dueMonthIndex = dueMonth - 1
  const todayMonthIndex = todayMonth - 1
  const dueDateValue = new Date(dueYear, dueMonthIndex, dueDay)
  const todayDateValue = new Date(todayYear, todayMonthIndex, todayDay)
  const targetDay = recurrenceDay ?? dueDateValue.getDate()
  let nextDate: Date

  if (recurrence === 'daily' || recurrence === 'weekly') {
    const elapsedDays = Math.floor(
      (Date.UTC(todayYear, todayMonthIndex, todayDay) -
        Date.UTC(dueYear, dueMonthIndex, dueDay)) /
        MILLISECONDS_PER_DAY,
    )
    const daysPerOccurrence = recurrence === 'daily' ? 1 : 7
    const occurrences = Math.max(
      1,
      Math.floor(elapsedDays / daysPerOccurrence) + 1,
    )

    nextDate = new Date(
      dueYear,
      dueMonthIndex,
      dueDay + occurrences * daysPerOccurrence,
    )
  } else if (recurrence === 'monthly') {
    const monthsElapsed =
      (todayYear - dueYear) * 12 + todayMonth - dueMonth
    const occurrences = Math.max(1, monthsElapsed + 1)
    const nextMonthIndex = dueMonthIndex + occurrences
    const nextYear = dueYear + Math.floor(nextMonthIndex / 12)
    const normalizedMonthIndex = nextMonthIndex % 12

    nextDate = getDateAtMonthDay(nextYear, normalizedMonthIndex, targetDay)
    if (nextDate <= todayDateValue) {
      nextDate = getDateAtMonthDay(
        nextYear + Math.floor((normalizedMonthIndex + 1) / 12),
        (normalizedMonthIndex + 1) % 12,
        targetDay,
      )
    }
  } else {
    const occurrences = Math.max(1, todayYear - dueYear + 1)
    let nextYear = dueYear + occurrences
    nextDate = getDateAtMonthDay(nextYear, dueMonthIndex, targetDay)

    if (nextDate <= todayDateValue) {
      nextYear += 1
      nextDate = getDateAtMonthDay(nextYear, dueMonthIndex, targetDay)
    }
  }

  return getLocalDateKey(nextDate)
}
