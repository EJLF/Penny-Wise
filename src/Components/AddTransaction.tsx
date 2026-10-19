import { useState, type FormEvent } from 'react'
import { useGlobalContext } from '../context/useGlobalContext'

export type TransactionMode = 'any' | 'income' | 'expense'

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
    const parsedAmount = Number(amount)
    const description = formatDescription(text.trim())

    if (
      !description ||
      !amount ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount === 0 ||
      (transactionType === 'income' && parsedAmount < 0) ||
      (transactionType === 'expense' && parsedAmount > 0)
    ) {
      setError(
        transactionType === 'income'
          ? 'Enter a description and a positive amount.'
          : transactionType === 'expense'
            ? 'Enter a description and a negative amount.'
          : 'Enter a description and a non-zero amount.',
      )
      return
    }

    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        id: crypto.randomUUID(),
        text: description,
        amount: parsedAmount,
        date: new Date().toISOString(),
      },
    })
    setText('')
    setAmount('')
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
                  setError('')
                }}
              />
              Expense
            </label>
          </fieldset>
        )}
        <div className="form-control">
          <label htmlFor="transaction-description">Description</label>
          <input
            id="transaction-description"
            type="text"
            value={text}
            onChange={(event) => setText(formatDescription(event.target.value))}
            placeholder="e.g.  Weekly groceries"
            autoComplete="off"
          />
        </div>
        <div className="form-control">
          <label htmlFor="transaction-amount">Amount</label>
          <input
            id="transaction-amount"
            type="number"
            step="0.01"
            min={transactionType === 'income' ? '0.01' : undefined}
            max={transactionType === 'expense' ? '-0.01' : undefined}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={transactionType === 'income' ? 'e.g. 2500.00' : 'e.g. -45.00'}
            inputMode="decimal"
          />
          <p className="form-hint">
            {transactionType === 'income'
              ? 'Income amounts must be positive.'
              : 'Expense amounts must be negative.'}
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
