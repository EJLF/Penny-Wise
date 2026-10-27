import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useCurrentDateKey } from '../hooks/useCurrentDateKey'
import {
  getCurrentAccountBalance,
  type InterestFrequency,
} from '../utils/bankAccountBalance'
import { bankBrands, getBankBrand } from '../utils/bankBrands'
import { formatCurrency } from '../utils/formatCurrency'

type BankAccount = {
  id: string
  bankName: string
  accountType: string
  currentBalance: number
  interestRate: number
  interestFrequency?: InterestFrequency
  createdAt?: string
}

const accountTypes = ['Checking', 'Savings', 'Time deposit', 'Cash management', 'Other']
const interestFrequencies: { value: InterestFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

type LiquidityDashboardProps = {
  isAddAccountOpen: boolean
  accountDialogMode: 'add' | 'edit'
  onOpenAccountDialog: (mode: 'add' | 'edit') => void
  onCloseAddAccount: () => void
}

const LiquidityDashboard = ({
  isAddAccountOpen,
  accountDialogMode,
  onOpenAccountDialog,
  onCloseAddAccount,
}: LiquidityDashboardProps) => {
  const [accounts, setAccounts] = useLocalStorage<BankAccount[]>(
    'penny-wise-bank-accounts',
    [],
  )
  const accountDialogRef = useRef<HTMLDialogElement>(null)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [selectedBank, setSelectedBank] = useState('BDO')
  const [customBankName, setCustomBankName] = useState('')
  const [accountType, setAccountType] = useState('Savings')
  const [currentBalance, setCurrentBalance] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [interestFrequency, setInterestFrequency] = useState<InterestFrequency>('monthly')
  const [formError, setFormError] = useState('')
  const today = useCurrentDateKey()
  const selectedBankName = selectedBank === 'Other' ? customBankName.trim() : selectedBank
  const isEditingAccount = accountDialogMode === 'edit' && editingAccountId !== null
  const amount = isEditingAccount ? currentBalance : addAmount
  const findMatchingAccount = (
    accountList: BankAccount[],
    bankName: string,
    type: string,
    excludeId?: string,
  ) => accountList.find((account) =>
    account.id !== excludeId &&
    account.bankName.trim().toLocaleLowerCase() === bankName.trim().toLocaleLowerCase() &&
    account.accountType.trim().toLocaleLowerCase() === type.trim().toLocaleLowerCase(),
  )
  const matchingAccount = isEditingAccount
    ? undefined
    : findMatchingAccount(accounts, selectedBankName, accountType)

  const resetForm = () => {
    setEditingAccountId(null)
    setSelectedBank('BDO')
    setCustomBankName('')
    setAccountType('Savings')
    setCurrentBalance('')
    setAddAmount('')
    setInterestRate('')
    setInterestFrequency('monthly')
    setFormError('')
  }

  useEffect(() => {
    if (isAddAccountOpen && accountDialogRef.current && !accountDialogRef.current.open) {
      accountDialogRef.current.showModal()
    }
  }, [isAddAccountOpen])

  useEffect(() => {
    if (!accounts.some((account) => !account.createdAt || !account.interestFrequency)) return

    setAccounts((existing) => existing.map((account) => ({
      ...account,
      createdAt: account.createdAt || today,
      interestFrequency: account.interestFrequency || 'monthly',
    })))
  }, [accounts, setAccounts, today])

  const totalLiquidCash = sum(accounts.map((account) => getCurrentAccountBalance(account, today)))
  const bankGroups = Array.from(
    accounts.reduce((groups, account) => {
      const key = account.bankName.trim().toLocaleLowerCase()
      const existing = groups.get(key) ?? {
        bankName: account.bankName,
        currentBalance: 0,
      }
      existing.currentBalance += getCurrentAccountBalance(account, today)
      groups.set(key, existing)
      return groups
    }, new Map<string, {
      bankName: string
      currentBalance: number
    }>()).values(),
  ).sort((left, right) => right.currentBalance - left.currentBalance)

  const setTermsForAccount = (bankName: string, type: string, excludeId?: string) => {
    const matching = findMatchingAccount(accounts, bankName, type, excludeId)
    setInterestRate(matching ? String(matching.interestRate) : '0')
    setInterestFrequency(matching?.interestFrequency ?? 'monthly')
  }

  const openEditAccount = (account: BankAccount) => {
    const knownBank = bankBrands.some(
      (brand) => brand.name !== 'Other' &&
        brand.name.toLocaleLowerCase() === account.bankName.trim().toLocaleLowerCase(),
    )
    setEditingAccountId(account.id)
    setSelectedBank(knownBank ? account.bankName : 'Other')
    setCustomBankName(knownBank ? '' : account.bankName)
    setAccountType(account.accountType)
    setCurrentBalance(String(getCurrentAccountBalance(account, today)))
    setInterestRate(String(account.interestRate))
    setInterestFrequency(account.interestFrequency ?? 'monthly')
    setFormError('')
    onOpenAccountDialog('edit')
  }

  const closeAccountDialog = () => {
    if (accountDialogRef.current?.open) {
      accountDialogRef.current.close()
    } else {
      onCloseAddAccount()
    }
  }

  const handleSaveAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const bankName = selectedBankName
    const current = Number(amount)
    const rate = Number(interestRate || 0)

    if (
      !bankName ||
      amount === '' ||
      !Number.isFinite(current) || current < 0 ||
      !Number.isFinite(rate) || rate < 0 || rate > 100
    ) {
      setFormError('Enter a bank and a valid non-negative balance and interest rate.')
      return
    }

    setAccounts((existing) => {
      if (isEditingAccount && editingAccountId) {
        return existing.map((account) => account.id === editingAccountId
          ? {
            ...account,
            bankName,
            accountType,
            currentBalance: current,
            interestRate: rate,
            interestFrequency,
            createdAt: today,
          }
          : account)
      }

      const matching = findMatchingAccount(existing, bankName, accountType)
      if (matching) {
        return existing.map((account) => account.id === matching.id
          ? {
            ...account,
            currentBalance: getCurrentAccountBalance(account, today) + current,
            interestRate: rate,
            interestFrequency,
            createdAt: today,
          }
          : account)
      }

      return [{
        id: crypto.randomUUID(),
        bankName,
        accountType,
        currentBalance: current,
        interestRate: rate,
        interestFrequency,
        createdAt: today,
      }, ...existing]
    })
    resetForm()
    closeAccountDialog()
  }

  return (
    <section className="liquidity-dashboard" aria-label="Bank accounts and liquidity">
      {isAddAccountOpen && (
        <dialog
          id="add-bank-account-form"
          ref={accountDialogRef}
          className="transaction-dialog liquidity-account-dialog"
          aria-labelledby="add-bank-account-title"
          onClose={() => {
            resetForm()
            onCloseAddAccount()
          }}
          onClick={(event) => {
            const dialog = event.currentTarget
            const bounds = dialog.getBoundingClientRect()
            if (
              event.clientX < bounds.left ||
              event.clientX > bounds.right ||
              event.clientY < bounds.top ||
              event.clientY > bounds.bottom
            ) {
              closeAccountDialog()
            }
          }}
        >
          <form
            className="panel liquidity-form"
            onSubmit={handleSaveAccount}
            noValidate
          >
            <div className="liquidity-section-heading liquidity-form__heading">
              <div>
                <h2 className="panel__title" id="add-bank-account-title">
                  {isEditingAccount ? 'Edit bank account' : 'Add a bank account'}
                </h2>
                <p className="panel__subtitle">Balances are saved in this browser only.</p>
              </div>
              <button
                className="transaction-dialog__close"
                type="button"
                onClick={closeAccountDialog}
                aria-label="Close dialog"
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="liquidity-form__grid">
              <div className="form-control">
                <label htmlFor="liquidity-bank">Bank</label>
                <select
                  id="liquidity-bank"
                  value={selectedBank}
                  onChange={(event) => {
                    const bank = event.target.value
                    setSelectedBank(bank)
                    const name = bank === 'Other' ? customBankName : bank
                    setTermsForAccount(name, accountType, isEditingAccount ? editingAccountId ?? undefined : undefined)
                  }}
                >
                  {bankBrands.map((brand) => (
                    <option key={brand.name} value={brand.name}>{brand.name}</option>
                  ))}
                </select>
              </div>
              {selectedBank === 'Other' && (
                <div className="form-control">
                  <label htmlFor="liquidity-custom-bank">Bank name</label>
                  <input
                    id="liquidity-custom-bank"
                    type="text"
                    value={customBankName}
                    onChange={(event) => {
                      setCustomBankName(event.target.value)
                      setTermsForAccount(
                        event.target.value,
                        accountType,
                        isEditingAccount ? editingAccountId ?? undefined : undefined,
                      )
                    }}
                    required
                  />
                </div>
              )}
              <div className="form-control">
                <label htmlFor="liquidity-account-type">Account type</label>
                <select
                  id="liquidity-account-type"
                  value={accountType}
                  onChange={(event) => {
                    setAccountType(event.target.value)
                    setTermsForAccount(
                      selectedBankName,
                      event.target.value,
                      isEditingAccount ? editingAccountId ?? undefined : undefined,
                    )
                  }}
                >
                  {accountTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label htmlFor="liquidity-current-balance">
                  {isEditingAccount
                    ? 'Current balance'
                    : matchingAccount ? 'Amount to add' : 'Starting balance'}
                </label>
                <input
                  id="liquidity-current-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => {
                    if (isEditingAccount) {
                      setCurrentBalance(event.target.value)
                    } else {
                      setAddAmount(event.target.value)
                    }
                  }}
                  required
                />
              </div>
              <div className="form-control">
                <label htmlFor="liquidity-interest-rate">Interest rate (% p.a.)</label>
                <input
                  id="liquidity-interest-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={interestRate}
                  onChange={(event) => setInterestRate(event.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="form-control">
                <label htmlFor="liquidity-interest-frequency">Interest added</label>
                <select
                  id="liquidity-interest-frequency"
                  value={interestFrequency}
                  onChange={(event) => {
                    const selected = interestFrequencies.find(
                      (frequency) => frequency.value === event.target.value,
                    )
                    if (selected) setInterestFrequency(selected.value)
                  }}
                >
                  {interestFrequencies.map((frequency) => (
                    <option key={frequency.value} value={frequency.value}>{frequency.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <div className="liquidity-form__actions">
              <button
                className="btn liquidity-form__cancel"
                type="button"
                onClick={closeAccountDialog}
              >
                Cancel
              </button>
              <button className="btn liquidity-form__submit" type="submit">
                {isEditingAccount ? 'Update account' : 'Save account'}
              </button>
            </div>
          </form>
        </dialog>
      )}

      <section className="liquidity-summary" aria-label="Liquidity summary">
        <article className="liquidity-summary__card liquidity-summary__card--primary">
          <span className="liquidity-summary__label">Total cash</span>
          <strong className="liquidity-summary__amount">{formatCurrency(totalLiquidCash)}</strong>
          <span className="liquidity-summary__note">{accounts.length} tracked account{accounts.length === 1 ? '' : 's'}</span>
        </article>
      </section>

      {/* {bankGroups.length > 0 && (
        <section className="liquidity-distribution panel" aria-labelledby="liquidity-distribution-title">
          <div className="liquidity-section-heading">
            <div>
              <h2 className="panel__title" id="liquidity-distribution-title">Cash distribution</h2>
              <p className="panel__subtitle">Current balance by bank</p>
            </div>
            <strong>{formatCurrency(totalLiquidCash)}</strong>
          </div>
          <div className="liquidity-distribution__bar" aria-label="Current balance distribution by bank">
            {bankGroups.map((bank) => (
              <span
                key={bank.bankName}
                className="liquidity-distribution__segment"
                style={{
                  width: `${totalLiquidCash > 0 ? bank.currentBalance / totalLiquidCash * 100 : 0}%`,
                  backgroundColor: getBankBrand(bank.bankName).color,
                }}
                title={`${bank.bankName}: ${formatCurrency(bank.currentBalance)}`}
              />
            ))}
          </div>
          <ul className="liquidity-distribution__list">
            {bankGroups.map((bank) => (
              <li key={bank.bankName}>
                <span className="liquidity-distribution__bank">
                  <i style={{ backgroundColor: getBankBrand(bank.bankName).color }} />
                  {bank.bankName}
                </span>
                <strong>{formatCurrency(bank.currentBalance)}</strong>
                <small>
                  {totalLiquidCash > 0
                    ? `${Math.round(bank.currentBalance / totalLiquidCash * 100)}%`
                    : '0%'}
                </small>
              </li>
            ))}
          </ul>
        </section>
      )} */}

      <section className="liquidity-accounts" aria-labelledby="liquidity-accounts-title">
        <div className="liquidity-section-heading">
          <div>
            <h2 className="panel__title" id="liquidity-accounts-title">Bank accounts</h2>
            <p className="panel__subtitle">
              {accounts.length
                ? 'Balances you have entered manually'
                : 'Add an account to start tracking your liquid cash.'}
            </p>
          </div>
        </div>
        {accounts.length > 0 ? (
          <div className="liquidity-account-grid">
            {accounts.map((account) => {
              const brand = getBankBrand(account.bankName)
              return (
                <article
                  className="liquidity-account-card"
                  key={account.id}
                  style={{ '--bank-color': brand.color } as CSSProperties}
                >
                  <div className="liquidity-account-card__top">
                    <div className="liquidity-account-card__identity">
                      <h3>{account.bankName}</h3>
                      <span>{account.accountType}</span>
                    </div>
                    <div className="liquidity-account-card__actions">
                      <button
                        className="liquidity-account-card__remove"
                        type="button"
                        aria-label={`Edit ${account.bankName} ${account.accountType} account`}
                        onClick={() => openEditAccount(account)}
                      >
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <path d="m13.5 4.5 2 2m-9.8 9.8-2.2.4.4-2.2L13.9 4.5a1.4 1.4 0 0 1 2 2L5.7 16.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        className="liquidity-account-card__remove"
                        type="button"
                        aria-label={`Remove ${account.bankName} ${account.accountType} account`}
                        onClick={() => setAccounts((existing) =>
                          existing.filter((item) => item.id !== account.id),
                        )}
                      >
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <path d="M4 6h12M8 6V4h4v2m2 0-.7 10H6.7L6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="liquidity-account-card__balances">
                    <div>
                      <span>Current balance</span>
                      <strong>{formatCurrency(getCurrentAccountBalance(account, today))}</strong>
                    </div>
                  </div>
                  <div className="liquidity-account-card__footer">
                    <span>
                      <strong>{account.interestRate}% p.a.</strong>
                      {' · '}
                      {account.interestFrequency ?? 'monthly'}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="panel liquidity-empty">
            <span className="liquidity-empty__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="6" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M4 10h16m-11 5h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </span>
            <p>No bank accounts yet</p>
            <span>Add your accounts to see available cash and coverage at a glance.</span>
            <button
              className="btn"
              type="button"
              onClick={() => onOpenAccountDialog('add')}
            >
              Add your first account
            </button>
          </div>
        )}
      </section>
      <p className="liquidity-disclaimer">
        Accounts are not connected to your bank. Balances and interest rates are entered and maintained by you.
      </p>
    </section>
  )
}

export default LiquidityDashboard
