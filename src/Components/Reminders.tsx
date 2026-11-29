import { useEffect, useRef, useState, type FormEvent } from 'react'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import { formatCurrency } from '../utils/formatCurrency'
import type { Reminder, ReminderRecurrence } from '../types/reminder'

const hasConfiguredAmount = (reminder: Reminder) =>
  reminder.hasConfiguredAmount ?? !reminder.isRecurring

const reminderCategories = [
  'Bills',
  'Education',
  'Entertainment',
  'Food & Dining',
  'Healthcare',
  'Housing',
  'Shopping',
  'Transportation',
  'Utilities',
  'Other',
]

const getTodayDate = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const getReminderStatus = (reminder: Reminder, today: string): Reminder['status'] => {
  if (!reminder.isRecurring || !reminder.lastPaidDate) {
    return reminder.status
  }

  if (
    (reminder.recurrence ?? 'monthly') === 'monthly' &&
    reminder.lastPaidDate.slice(0, 7) === today.slice(0, 7)
  ) {
    return 'paid'
  }

  const dueDate = new Date(`${reminder.dueDate}T00:00:00`)
  dueDate.setDate(dueDate.getDate() - reminder.daysBefore)
  const reminderStartDate = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`

  return today >= reminderStartDate ? 'unpaid' : 'paid'
}

const isReminderDue = (reminder: Reminder, today: string) => {
  const reminderStart = new Date(`${reminder.dueDate}T00:00:00`)
  reminderStart.setDate(reminderStart.getDate() - reminder.daysBefore)
  const startDate = `${reminderStart.getFullYear()}-${String(reminderStart.getMonth() + 1).padStart(2, '0')}-${String(reminderStart.getDate()).padStart(2, '0')}`

  return getReminderStatus(reminder, today) === 'unpaid' && today >= startDate
}

type ReminderFormProps = {
  reminder?: Reminder
  onSave: (reminder: Omit<Reminder, 'id' | 'status'>) => void
  onCancel: () => void
}

const ReminderForm = ({ reminder, onSave, onCancel }: ReminderFormProps) => {
  const [title, setTitle] = useState(reminder?.title ?? '')
  const [category, setCategory] = useState(reminder?.category ?? '')
  const [amount, setAmount] = useState(
    reminder && hasConfiguredAmount(reminder) && reminder.amount !== undefined
      ? String(reminder.amount)
      : '',
  )
  const [dueDate, setDueDate] = useState(reminder?.dueDate ?? getTodayDate())
  const [daysBefore, setDaysBefore] = useState(String(reminder?.daysBefore ?? 1))
  const [isRecurring, setIsRecurring] = useState(reminder?.isRecurring ?? false)
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>(
    reminder?.recurrence ?? 'monthly',
  )
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsedAmount = Number(amount)
    const parsedDaysBefore = Number(daysBefore)
    if (
      !title.trim() || !category || !dueDate ||
      (amount !== '' && (!Number.isFinite(parsedAmount) || parsedAmount < 0)) ||
      (!isRecurring && amount === '') ||
      !Number.isInteger(parsedDaysBefore) || parsedDaysBefore < 0 || parsedDaysBefore > 365
    ) {
      setError('Enter a name, category, valid amount when required, due date, and reminder window from 0 to 365 days.')
      return
    }
    onSave({
      title: title.trim(),
      category,
      amount: amount === '' ? undefined : parsedAmount,
      dueDate,
      daysBefore: parsedDaysBefore,
      isRecurring,
      recurrence: isRecurring ? recurrence : undefined,
      recurrenceDay: isRecurring ? Number(dueDate.slice(-2)) : undefined,
      hasConfiguredAmount: amount !== '',
    })
  }

  return (
    <form className="reminder-form" onSubmit={handleSubmit} noValidate>
      <div className="form-control">
        <label htmlFor="reminder-title">Payment name</label>
        <input id="reminder-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Electricity bill" required />
      </div>
      <label className="reminder-recurring-toggle">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(event) => setIsRecurring(event.target.checked)}
        />
        <span>This payment is recurring</span>
      </label>
      {isRecurring && (
        <div className="form-control">
          <label htmlFor="reminder-recurrence">Repeat</label>
          <select
            id="reminder-recurrence"
            value={recurrence}
            onChange={(event) => setRecurrence(event.target.value as NonNullable<Reminder['recurrence']>)}
            required
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      )}
      <div className="form-control">
        <label htmlFor="reminder-category">Category</label>
        <select id="reminder-category" value={category} onChange={(event) => setCategory(event.target.value)} required>
          <option value="" disabled>Select a category</option>
          {reminderCategories.map((option) => <option key={option}>{option}</option>)}
        </select>
      </div>
      <div className="reminder-form__grid">
        <div className="form-control">
          <label htmlFor="reminder-amount">Amount</label>
          <input id="reminder-amount" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required={!isRecurring} />
          {isRecurring && <p className="form-hint">You can enter the amount when you mark this payment as paid.</p>}
        </div>
        <div className="form-control">
          <label htmlFor="reminder-due-date">Due date</label>
          <input id="reminder-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
        </div>
      </div>
      <div className="form-control">
        <label htmlFor="reminder-days-before">Remind me (days before due date)</label>
        <input id="reminder-days-before" type="number" min="0" max="365" step="1" value={daysBefore} onChange={(event) => setDaysBefore(event.target.value)} required />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="reminder-form__actions">
        <button className="btn reminder-form__cancel" type="button" onClick={onCancel}>Cancel</button>
        <button className="btn" type="submit">{reminder ? 'Save changes' : 'Add reminder'}</button>
      </div>
    </form>
  )
}

type ReminderDashboardProps = {
  reminders: Reminder[]
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'status'>) => void
  onUpdateReminder: (reminder: Reminder) => void
  onDeleteReminder: (id: string) => void
  onRequestPayment: (id: string) => void
  isAddOpen: boolean
  onAddOpenChange: (open: boolean) => void
}

const ReminderDashboard = ({
  reminders,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  onRequestPayment,
  isAddOpen,
  onAddOpenChange,
}: ReminderDashboardProps) => {
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(null)
  const editorDialogRef = useRef<HTMLDialogElement>(null)
  const today = getTodayDate()
  const sortedReminders = [...reminders].sort((left, right) => left.dueDate.localeCompare(right.dueDate))
  const isEditorOpen = isAddOpen || editingReminder !== null

  useEffect(() => {
    if (isEditorOpen && editorDialogRef.current && !editorDialogRef.current.open) {
      editorDialogRef.current.showModal()
    }
  }, [isEditorOpen])

  const closeEditor = () => {
    editorDialogRef.current?.close()
    setEditingReminder(null)
    onAddOpenChange(false)
  }

  return (
    <section className="reminders-dashboard" aria-label="Payment reminders">
      {isEditorOpen && (
        <dialog
          id="add-reminder-dialog"
          ref={editorDialogRef}
          className="transaction-dialog reminder-editor-dialog"
          aria-labelledby="reminder-editor-title"
          onClose={() => {
            setEditingReminder(null)
            onAddOpenChange(false)
          }}
          onClick={(event) => {
            const dialog = event.currentTarget
            const bounds = dialog.getBoundingClientRect()
            if (
              event.target === dialog &&
              (event.clientX < bounds.left ||
                event.clientX > bounds.right ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom)
            ) {
              closeEditor()
            }
          }}
        >
          <section className="panel reminder-editor" aria-labelledby="reminder-editor-title">
            <div className="panel__heading">
              <div>
                <h2 className="panel__title" id="reminder-editor-title">{editingReminder ? 'Edit reminder' : 'New reminder'}</h2>
                <p className="panel__subtitle">Track upcoming payments and when you want to be notified.</p>
              </div>
            </div>
            <ReminderForm
              key={editingReminder?.id ?? 'new-reminder'}
              reminder={editingReminder ?? undefined}
              onSave={(values) => {
                if (editingReminder) {
                  onUpdateReminder({ ...editingReminder, ...values })
                  closeEditor()
                } else {
                  onAddReminder(values)
                  closeEditor()
                }
              }}
              onCancel={closeEditor}
            />
          </section>
        </dialog>
      )}
      {sortedReminders.length ? (
        <div className="reminder-list">
          {sortedReminders.map((reminder) => {
            const isDue = isReminderDue(reminder, today)
            const status = getReminderStatus(reminder, today)
            return (
              <article className="panel reminder-card" key={reminder.id}>
                <div className="reminder-card__main">
                  <div className="reminder-card__heading">
                    <div>
                      <h2>{reminder.title}</h2>
                      <span className="reminder-card__category">{reminder.category}</span>
                    </div>
                    <span className={`reminder-status reminder-status--${status}`}>
                      {status}
                    </span>
                  </div>
                  <div className="reminder-card__details">
                    {hasConfiguredAmount(reminder) && reminder.amount !== undefined && (
                      <span><strong>{formatCurrency(reminder.amount)}</strong></span>
                    )}
                    <span>Due {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${reminder.dueDate}T00:00:00`))}</span>
                    <span>{isDue ? 'Reminder active' : `Reminder starts ${reminder.daysBefore} day${reminder.daysBefore === 1 ? '' : 's'} before`}</span>
                  </div>
                </div>
                <div className="reminder-card__actions">
                  {status === 'unpaid' && (
                    <button className="reminder-action" type="button" onClick={() => onRequestPayment(reminder.id)}>Mark paid</button>
                  )}
                  <button className="reminder-action" type="button" onClick={() => {
                    onAddOpenChange(false)
                    setEditingReminder(reminder)
                  }}>Edit</button>
                  <button className="reminder-action reminder-action--delete" type="button" onClick={() => setReminderToDelete(reminder)}>Delete</button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="panel reminders-empty">
          <span className="reminders-empty__icon" aria-hidden="true">✓</span>
          <h2>No payment reminders</h2>
          <p>Add bills, tuition, or other payments to keep track of their due dates.</p>
          <button className="btn" type="button" onClick={() => onAddOpenChange(true)}>Add your first reminder</button>
        </div>
      )}
      {reminderToDelete && (
        <DeleteConfirmDialog
          itemName={reminderToDelete.title}
          itemType="reminder"
          onConfirm={() => {
            onDeleteReminder(reminderToDelete.id)
            setReminderToDelete(null)
          }}
          onCancel={() => setReminderToDelete(null)}
        />
      )}
    </section>
  )
}

type ReminderPopupProps = {
  reminders: Reminder[]
  onRequestPayment: (id: string) => void
}

export const ReminderPopup = ({ reminders, onRequestPayment }: ReminderPopupProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [initialDueDates] = useState(() => new Map(
    reminders.map((reminder) => [reminder.id, reminder.dueDate]),
  ))
  const [shouldOpenOnLoad] = useState(() => {
    const today = getTodayDate()
    return reminders.some((reminder) => isReminderDue(reminder, today))
  })
  const today = getTodayDate()
  const activeReminders = reminders.filter((reminder) =>
    initialDueDates.get(reminder.id) === reminder.dueDate && isReminderDue(reminder, today),
  )

  useEffect(() => {
    if (shouldOpenOnLoad && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
  }, [shouldOpenOnLoad])

  useEffect(() => {
    if (activeReminders.length === 0 && dialogRef.current?.open) {
      dialogRef.current.close()
    }
  }, [activeReminders.length])

  return (
    <dialog
      ref={dialogRef}
      className="transaction-dialog reminder-popup"
      aria-labelledby="reminder-popup-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close()
      }}
    >
      <section className="panel reminder-popup__content">
        <div className="panel__heading">
          <div>
            <p className="eyebrow">PAYMENT REMINDERS</p>
            <h2 className="panel__title" id="reminder-popup-title">Payments to take care of</h2>
            <p className="panel__subtitle">These unpaid payments are due or coming up soon.</p>
          </div>
          <button className="transaction-dialog__close" type="button" aria-label="Close reminders" onClick={() => dialogRef.current?.close()}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ul className="reminder-popup__list">
          {activeReminders.map((reminder) => (
            <li key={reminder.id}>
              <div>
                <strong>{reminder.title}</strong>
                <span>{reminder.category} · due {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${reminder.dueDate}T00:00:00`))}</span>
              </div>
              <div className="reminder-popup__item-action">
                {hasConfiguredAmount(reminder) && reminder.amount !== undefined && (
                  <strong>{formatCurrency(reminder.amount)}</strong>
                )}
                <button className="reminder-action" type="button" onClick={() => onRequestPayment(reminder.id)}>Mark paid</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </dialog>
  )
}

type ReminderPaymentDialogProps = {
  reminder: Reminder | null
  onClose: () => void
  onConfirm: (amount: number) => void
}

export const ReminderPaymentDialog = ({
  reminder,
  onClose,
  onConfirm,
}: ReminderPaymentDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [amount, setAmount] = useState(() =>
    reminder && hasConfiguredAmount(reminder) && reminder.amount !== undefined
      ? String(reminder.amount)
      : '',
  )
  const [error, setError] = useState('')

  useEffect(() => {
    if (reminder && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    } else if (!reminder && dialogRef.current?.open) {
      dialogRef.current.close()
    }
  }, [reminder])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const paidAmount = Number(amount)
    if (amount.trim() === '' || !Number.isFinite(paidAmount) || paidAmount <= 0) {
      setError('Enter the amount you paid. It must be greater than zero.')
      return
    }
    dialogRef.current?.close()
    onConfirm(paidAmount)
  }

  return (
    <dialog
      ref={dialogRef}
      className="transaction-dialog"
      aria-labelledby="reminder-payment-title"
      onClose={() => {
        setAmount('')
        setError('')
        onClose()
      }}
    >
      <section className="panel reminder-editor">
        <div className="panel__heading">
          <div>
            <h2 className="panel__title" id="reminder-payment-title">Record payment</h2>
            <p className="panel__subtitle">{reminder?.title} · {reminder?.category}</p>
          </div>
          <button className="transaction-dialog__close" type="button" aria-label="Cancel payment" onClick={() => dialogRef.current?.close()}>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form className="reminder-form" onSubmit={handleSubmit} noValidate>
          <div className="form-control">
            <label htmlFor="reminder-paid-amount">Amount paid</label>
            <input
              id="reminder-paid-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              autoFocus
              required
            />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="reminder-form__actions">
            <button className="btn reminder-form__cancel" type="button" onClick={() => dialogRef.current?.close()}>Cancel</button>
            <button className="btn" type="submit">Paid</button>
          </div>
        </form>
      </section>
    </dialog>
  )
}

export default ReminderDashboard
