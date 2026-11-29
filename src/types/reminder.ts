export type ReminderRecurrence = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type Reminder = {
  id: string
  title: string
  category: string
  amount?: number
  dueDate: string
  daysBefore: number
  status: 'paid' | 'unpaid'
  isRecurring?: boolean
  lastPaidDate?: string
  recurrence?: ReminderRecurrence
  recurrenceDay?: number
  hasConfiguredAmount?: boolean
}
