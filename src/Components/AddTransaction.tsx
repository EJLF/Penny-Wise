import { useState, type FormEvent } from 'react'
import { useGlobalContext } from '../context/useGlobalContext'

export type TransactionMode = 'any' | 'income' | 'expense'

const categories = {
  income: ['Freelance', 'Gifts', 'Investments', 'Salary', 'Other'],
  expense: [
    'Education',
    'Entertainment',
    'Food & Dining',
    'Healthcare',
    'Housing',    
    'Shopping',
    'Transportation',
    'Utilities',
    'Other'
  ],
}

type AddTransactionProps = {
  onClose: () => void
  mode: TransactionMode
}

const AddTransaction = ({
  onClose,
  mode,
}: AddTransactionProps) => {
  const { dispatch } = useGlobalContext()
  const [text, setText] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>(
    mode === 'any' ? 'income' : mode,
  )
  const transactionType = mode === 'any' ? selectedType : mode
  const formatDescription = (value: string) => {
    const [firstCharacter = '', ...remainingCharacters] = Array.from(value)
    return firstCharacter.toUpperCase() + remainingCharacters.join('').toLowerCase()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const enteredAmount = Number(amount)
    const parsedAmount =
      transactionType === 'expense' ? -enteredAmount : enteredAmount
    const description = formatDescription(text.trim())

    if (
      !description ||
      !category ||
      !Number.isFinite(enteredAmount) ||
      enteredAmount <= 0
    ) {
      setError(
        'Enter a description, choose a category, and enter a positive amount.',
      )
      return
    }

    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        id: crypto.randomUUID(),
        text: description,
        amount: parsedAmount,
        category,
        date: new Date().toISOString(),
      },
    })
    setText('')
    setAmount('')
    setCategory('')
    setError('')
    onClose()
  }

  return (
    <section className="panel" aria-labelledby="add-transaction-title">
      <div className="panel__heading">
        <div>
          <h2 className="panel__title" id="add-transaction-title">
            {transactionType === 'income' ? 'Add income' : 'Add expense'}
          </h2>
          <p className="panel__subtitle">Keep your finances up to date</p>
        </div>
        <button className="transaction-dialog__close" type="button" onClick={onClose} aria-label="Close dialog">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <form className="transaction-form" onSubmit={handleSubmit} noValidate>
        {mode === 'any' && (
          <fieldset className="transaction-type">
            <legend>Transaction type</legend>
            <label className={selectedType === 'income' ? 'transaction-type__option is-selected' : 'transaction-type__option'}>
              <input
                type="radio"
                name="transaction-type"
                value="income"
                checked={selectedType === 'income'}
                onChange={() => {
                  setSelectedType('income')
                  setCategory('')
                  setError('')
                }}
              />
              Income
            </label>
            <label className={selectedType === 'expense' ? 'transaction-type__option is-selected' : 'transaction-type__option'}>
              <input
                type="radio"
                name="transaction-type"
                value="expense"
                checked={selectedType === 'expense'}
                onChange={() => {
                  setSelectedType('expense')
                  setCategory('')
                  setError('')
                }}
              />
              Expense
            </label>
          </fieldset>
        )}        
        <div className="form-control">
          <label htmlFor="transaction-category">Category</label>
          <select
            id="transaction-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
          >
            <option value="" disabled>Select a category</option>
            {categories[transactionType].map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="form-control">
          <label htmlFor="transaction-description">Description</label>
          <input
            id="transaction-description"
            type="text"
            value={text}
            onChange={(event) => setText(formatDescription(event.target.value))}
            placeholder={transactionType === 'income' ? 'e.g. Monthly salary' : 'e.g.  Tuition fees'}
            autoComplete="off"
          />
        </div>
        <div className="form-control">
          <label htmlFor="transaction-amount">Amount</label>
          <input
            id="transaction-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={transactionType === 'income' ? 'e.g. 1500.00' : 'e.g. 1500.00'}
            inputMode="decimal"
          />
          <p className="form-hint">
            {transactionType === 'income'
              ? 'Enter a positive amount.'
              : 'Enter a positive amount; it will be recorded as an expense.'}
          </p>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn" type="submit">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {transactionType === 'income' ? 'Add income' : 'Add expense'}
        </button>
      </form>
    </section>
  )
}

export default AddTransaction
