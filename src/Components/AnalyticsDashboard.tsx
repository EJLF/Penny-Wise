import { useState, type KeyboardEvent } from 'react'
import type { Transaction } from '../context/AppReducer'
import { formatCurrency } from '../utils/formatCurrency'
import {
  getCurrentTransactionMonth,
  getTransactionMonth,
  getTransactionMonthLabel,
} from '../utils/transactionMonths'

type AnalyticsDashboardProps = {
  transactions: Transaction[]
}

type MonthlyData = {
  key: string
  label: string
  income: number
  expenses: number
  net: number
  count: number
}

type ExpenseSlice = {
  category: string
  amount: number
}

const analyticsTabs = [
  { id: 'expenses', label: 'Expenses' },
  { id: 'trend', label: 'Spending trend' },
  { id: 'comparison', label: 'Income vs. expenses' },
  { id: 'savings', label: 'Savings' },
] as const

type AnalyticsTab = typeof analyticsTabs[number]['id']

const expenseChartColors = [
  '#d4a017', // Gold
  '#0891b2', // Deep Cyan
  '#65a30d', // Olive Lime
  '#eab308', // Crimson
  '#7c6f64', // Taupe
  '#475569', // Slate
]

const getMonthlyData = (transactions: Transaction[]): MonthlyData[] => {
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - 4 + index, 1)
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
    return {
      key,
      label: new Intl.DateTimeFormat(undefined, { month: 'short' }).format(month),
      income: 0,
      expenses: 0,
      net: 0,
      count: 0,
    }
  })
  const dataByMonth = new Map(months.map((month) => [month.key, month]))

  transactions.forEach((transaction) => {
    const month = dataByMonth.get(getTransactionMonth(transaction))
    if (!month) return

    month.count += 1
    if (transaction.amount > 0) {
      month.income += transaction.amount
    } else {
      month.expenses += Math.abs(transaction.amount)
    }
    month.net += transaction.amount
  })

  return months
}

const getExpenseSlices = (transactions: Transaction[]): ExpenseSlice[] => {
  const groupedExpenses = new Map<string, ExpenseSlice>()

  transactions.forEach((transaction) => {
    if (transaction.amount >= 0) return

    const category = transaction.category?.trim() || 'Uncategorized'
    const key = category.toLocaleLowerCase()
    const slice = groupedExpenses.get(key) ?? { category, amount: 0 }
    slice.amount += Math.abs(transaction.amount)
    groupedExpenses.set(key, slice)
  })

  const sortedSlices = Array.from(groupedExpenses.values())
    .sort((left, right) => right.amount - left.amount)
  if (sortedSlices.length <= 6) return sortedSlices

  const visibleSlices = sortedSlices.slice(0, 5)
  visibleSlices.push({
    category: 'Other',
    amount: sortedSlices.slice(5).reduce((total, slice) => total + slice.amount, 0),
  })
  return visibleSlices
}

const compactCurrency = (amount: number) => new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(amount)

type LineChartProps = {
  data: MonthlyData[]
  values: Array<number | null>
  color: string
  label: string
  allowNegative?: boolean
}

const LineChart = ({ data, values, color, label, allowNegative = false }: LineChartProps) => {
  const left = 42
  const right = 350
  const top = 20
  const bottom = 194
  const plottedValues = values.filter((value): value is number => value !== null)
  const min = allowNegative ? Math.min(0, ...plottedValues) : 0
  const max = Math.max(1, ...plottedValues)
  const range = max - min || 1
  const points = values.flatMap((value, index) => value === null ? [] : [{
    x: left + (right - left) * index / Math.max(data.length - 1, 1),
    y: bottom - (value - min) / range * (bottom - top),
    value,
    monthIndex: index,
  }])
  const path = points.reduce((commands, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }

    const previous = points[index - 1]
    const beforePrevious = points[index - 2] ?? previous
    const next = points[index + 1] ?? point
    const control1X = previous.x + (point.x - beforePrevious.x) / 6
    const control1Y = previous.y + (point.y - beforePrevious.y) / 6
    const control2X = point.x - (next.x - previous.x) / 6
    const control2Y = point.y - (next.y - previous.y) / 6

    return `${commands} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${point.x} ${point.y}`
  }, '')

  return (
    <div className="analytics-chart-scroll">
      <svg className="analytics-chart" viewBox="0 0 360 240" role="img" aria-label={label}>
        <title>{label}</title>
        {Array.from({ length: 5 }, (_, index) => {
          const value = min + range * (4 - index) / 4
          const y = top + (bottom - top) * index / 4
          return (
            <g key={index}>
              <line className="analytics-chart__grid" x1={left} x2={right} y1={y} y2={y} />
              <text className="analytics-chart__axis-label" x={left - 10} y={y + 4} textAnchor="end">
                {compactCurrency(value)}
              </text>
            </g>
          )
        })}
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={data[point.monthIndex].key}>
            <circle cx={point.x} cy={point.y} r="5" fill={color} stroke="#fff" strokeWidth="2" />
            <title>{`${data[point.monthIndex].label}: ${formatCurrency(point.value)}`}</title>
          </g>
        ))}
        {data.map((month, index) => (
          <text
            className="analytics-chart__month-label"
            key={month.key}
            x={left + (right - left) * index / Math.max(data.length - 1, 1)}
            y={bottom + 23}
            textAnchor="middle"
          >
            {month.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

const AnalyticsDashboard = ({ transactions }: AnalyticsDashboardProps) => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('expenses')
  const [expenseMonth, setExpenseMonth] = useState('all')
  const currentMonth = getCurrentTransactionMonth()
  const monthlyData = getMonthlyData(transactions)
  const currentMonths = monthlyData.filter((month) => month.key <= currentMonth)
  const expenseMonthOptions = Array.from(new Set(
    transactions
      .filter((transaction) => transaction.amount < 0)
      .map(getTransactionMonth)
      .filter((month) => month !== 'undated'),
  ))
    .sort((left, right) => right.localeCompare(left))
  const activeExpenseMonth = expenseMonth === 'all' ||
    expenseMonthOptions.includes(expenseMonth)
    ? expenseMonth
    : 'all'
  const expenseTransactions = activeExpenseMonth === 'all'
    ? transactions
    : transactions.filter(
      (transaction) => getTransactionMonth(transaction) === activeExpenseMonth,
    )
  const expenseSlices = getExpenseSlices(expenseTransactions)
  const totalExpenses = expenseSlices.reduce((total, slice) => total + slice.amount, 0)
  const datedTransactions = transactions.filter(
    (transaction) => getTransactionMonth(transaction) !== 'undated',
  )
  const hasMonthlyTransactions = currentMonths.some((month) => month.count > 0)
  const cumulativeNet = (() => {
    const firstVisibleMonth = monthlyData[0].key
    const startingTotal = datedTransactions.reduce((sum, transaction) => {
      return getTransactionMonth(transaction) < firstVisibleMonth
        ? sum + transaction.amount
        : sum
    }, 0)
    return monthlyData.reduce<{ total: number; values: Array<number | null> }>(
      (result, month) => {
        if (month.key > currentMonth) {
          return { total: result.total, values: [...result.values, null] }
        }

        const total = result.total + month.net
        return { total, values: [...result.values, total] }
      },
      { total: startingTotal, values: [] },
    ).values
  })()
  const sixMonthExpenses = currentMonths.reduce((total, month) => total + month.expenses, 0)
  const sixMonthNet = currentMonths.reduce((total, month) => total + month.net, 0)

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = analyticsTabs.findIndex((tab) => tab.id === activeTab)
    let nextIndex: number

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % analyticsTabs.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + analyticsTabs.length) % analyticsTabs.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = analyticsTabs.length - 1
    } else {
      return
    }

    event.preventDefault()
    setActiveTab(analyticsTabs[nextIndex].id)
    event.currentTarget
      .querySelector<HTMLButtonElement>(`[data-analytics-tab="${analyticsTabs[nextIndex].id}"]`)
      ?.focus()
  }

  return (
    <section
      className="analytics-dashboard"
      aria-label="Financial analytics"
      data-active-tab={activeTab}
    >
      <div className="analytics-tabs" role="tablist" aria-label="Analytics charts" onKeyDown={handleTabKeyDown}>
        {analyticsTabs.map((tab) => (
          <button
            className="analytics-tabs__button"
            key={tab.id}
            id={`analytics-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`analytics-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            data-analytics-tab={tab.id}
            aria-label={tab.label}
            title={tab.label}
            onClick={() => setActiveTab(tab.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {tab.id === 'expenses' && (
                <>
                  <path d="M12 3v9h9A9 9 0 1 1 12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M15 3.5A9 9 0 0 1 20.5 9H15V3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </>
              )}
              {tab.id === 'trend' && (
                <path d="m3.5 17 5-5 3.5 3 8.5-9M15.5 6H20v4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              )}
              {tab.id === 'comparison' && (
                <path d="M5 20V11m7 9V4m7 16v-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              )}
              {tab.id === 'savings' && (
                <>
                  <path d="M4 15.5c0-3.6 3.3-6.5 8-6.5s8 2.9 8 6.5-3.3 5.5-8 5.5-8-1.9-8-5.5Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M8 9V5l4 2 4-2v4m-4 4v5m-2.5-2.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
            </svg>
            <span className="visually-hidden">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="analytics-grid">
      <article
        className="panel analytics-panel"
        id="analytics-panel-expenses"
        role="tabpanel"
        aria-labelledby="analytics-tab-expenses"
        data-analytics-panel="expenses"
      >
        <div className="panel__heading">
          <div>
            <h2 className="panel__title">Expense breakdown</h2>
            <p className="panel__subtitle">
              {activeExpenseMonth === 'all'
                ? 'Spending by category'
                : `Spending by category in ${getTransactionMonthLabel(activeExpenseMonth)}`}
            </p>
          </div>
          <div className="expense-breakdown__actions">
            <label className="visually-hidden" htmlFor="expense-breakdown-month">
              Filter expense breakdown by month
            </label>
            <select
              id="expense-breakdown-month"
              className="month-filter expense-breakdown__filter"
              value={activeExpenseMonth}
              onChange={(event) => setExpenseMonth(event.target.value)}
            >
              <option value="all">All months</option>
              {expenseMonthOptions.map((month) => (
                <option key={month} value={month}>{getTransactionMonthLabel(month)}</option>
              ))}
            </select>
          </div>
        </div>
        {expenseSlices.length > 0 ? (
          <div className="expense-breakdown">
            <svg
              className="expense-breakdown__chart"
              viewBox="0 0 180 180"
              role="img"
              aria-label={`Expense breakdown pie chart. Total expense: ${formatCurrency(totalExpenses)}`}
            >
              <title>Expense breakdown by category</title>
              <g transform="rotate(-90 90 90)">
                {expenseSlices.map((slice, index) => {
                  const circumference = 2 * Math.PI * 64
                  const segmentLength = totalExpenses > 0
                    ? slice.amount / totalExpenses * circumference
                    : 0
                  const offset = expenseSlices
                    .slice(0, index)
                    .reduce((sum, previousSlice) => sum + previousSlice.amount, 0)
                  return (
                    <circle
                      key={slice.category}
                      cx="90"
                      cy="90"
                      r="64"
                      fill="none"
                      stroke={index === 0
                        ? 'var(--accent)'
                        : expenseChartColors[index % expenseChartColors.length]}
                      strokeWidth="28"
                      strokeDasharray={`${segmentLength} ${circumference}`}
                      strokeDashoffset={-offset / totalExpenses * circumference}
                    >
                      <title>{`${slice.category}: ${formatCurrency(slice.amount)}`}</title>
                    </circle>
                  )
                })}
              </g>
              <text className="expense-breakdown__center-label" x="90" y="86" textAnchor="middle">
                Total expense
              </text>
              <text className="expense-breakdown__center-total" x="90" y="103" textAnchor="middle">
                {formatCurrency(totalExpenses)}
              </text>
            </svg>
            <ul className="expense-breakdown__legend">
              {expenseSlices.map((slice, index) => (
                <li className="expense-breakdown__item" key={slice.category}>
                  <span className="expense-breakdown__name">
                    <span
                      className="expense-breakdown__swatch"
                      style={{
                        backgroundColor: index === 0
                          ? 'var(--accent)'
                          : expenseChartColors[index % expenseChartColors.length],
                      }}
                      aria-hidden="true"
                    />
                    <span>{slice.category}</span>
                  </span>
                  <span className="expense-breakdown__value">
                    {formatCurrency(slice.amount)}
                    <small>{Math.round(slice.amount / totalExpenses * 100)}%</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="empty-state">Add an expense to see your spending breakdown.</p>
        )}
      </article>

      <article
        className="panel analytics-panel"
        id="analytics-panel-trend"
        role="tabpanel"
        aria-labelledby="analytics-tab-trend"
        data-analytics-panel="trend"
      >
        <div className="panel__heading">
          <div>
            <h2 className="panel__title">Monthly spending trend</h2>
            <p className="panel__subtitle">Expenses over the last six months</p>
          </div>
        </div>
        {currentMonths.some((month) => month.expenses > 0) ? (
          <>
            <LineChart
              data={monthlyData}
              values={monthlyData.map((month) =>
                month.key > currentMonth ? null : month.expenses,
              )}
              color="var(--accent)"
              label="Monthly spending trend for the last six months"
            />
            <div className="analytics-chart-summary">
              <span>Spent in the last six months</span>
              <strong>{formatCurrency(sixMonthExpenses)}</strong>
            </div>
            <div className="analytics-monthly-details" aria-label="Monthly expenses">
              {currentMonths.map((month) => (
                <div className="analytics-monthly-details__row" key={month.key}>
                  <span className="analytics-monthly-details__month">{month.label}</span>
                  <strong>{formatCurrency(month.expenses)}</strong>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="empty-state">Add dated expenses to see your spending trend.</p>
        )}
      </article>

      <article
        className="panel analytics-panel"
        id="analytics-panel-comparison"
        role="tabpanel"
        aria-labelledby="analytics-tab-comparison"
        data-analytics-panel="comparison"
      >
        <div className="panel__heading">
          <div>
            <h2 className="panel__title">Income vs expenses</h2>
            <p className="panel__subtitle">Monthly totals over the last six months</p>
          </div>
        </div>
        {hasMonthlyTransactions ? (
          <>
            <div className="analytics-chart-scroll">
              <svg className="analytics-chart" viewBox="0 0 360 240" role="img" aria-label="Monthly income compared with expenses">
              <title>Monthly income vs expenses</title>
              {(() => {
                const left = 42
                const right = 350
                const top = 20
                const bottom = 194
                const max = Math.max(1, ...monthlyData.flatMap((month) => [month.income, month.expenses]))
                const barWidth = 12
                return (
                  <>
                    {Array.from({ length: 5 }, (_, index) => {
                      const value = max * (4 - index) / 4
                      const y = top + (bottom - top) * index / 4
                      return (
                        <g key={index}>
                          <line className="analytics-chart__grid" x1={left} x2={right} y1={y} y2={y} />
                          <text className="analytics-chart__axis-label" x={left - 10} y={y + 4} textAnchor="end">
                            {compactCurrency(value)}
                          </text>
                        </g>
                      )
                    })}
                    {monthlyData.map((month, index) => {
                      const center = left + (right - left) * (index + 0.5) / monthlyData.length
                      const incomeHeight = month.income / max * (bottom - top)
                      const expenseHeight = month.expenses / max * (bottom - top)
                      return (
                        <g key={month.key}>
                          {month.key <= currentMonth && (
                            <rect
                            x={center - barWidth - 4}
                            y={bottom - incomeHeight}
                            width={barWidth}
                            height={incomeHeight}
                            rx={barWidth / 2}
                            fill="var(--chart-income)"
                          >
                            <title>{`${month.label} income: ${formatCurrency(month.income)}`}</title>
                            </rect>
                          )}
                          {month.key <= currentMonth && (
                            <rect
                            x={center + 4}
                            y={bottom - expenseHeight}
                            width={barWidth}
                            height={expenseHeight}
                            rx={barWidth / 2}
                            fill="var(--chart-expense)"
                          >
                            <title>{`${month.label} expenses: ${formatCurrency(month.expenses)}`}</title>
                            </rect>
                          )}
                          <text className="analytics-chart__month-label" x={center} y={bottom + 23} textAnchor="middle">
                            {month.label}
                          </text>
                        </g>
                      )
                    })}
                  </>
                )
              })()}
              </svg>
            </div>
            <div className="analytics-legend" aria-label="Chart legend">
              <span><i className="analytics-legend__income" />Income</span>
              <span><i className="analytics-legend__expense" />Expenses</span>
            </div>
            <div className="analytics-monthly-details" aria-label="Monthly income and expenses">
              {currentMonths.map((month) => (
                <div className="analytics-monthly-details__row" key={month.key}>
                  <span className="analytics-monthly-details__month">{month.label}</span>
                  <span className="analytics-monthly-details__values">
                    <strong>
                      <i className="analytics-legend__income" aria-hidden="true" />
                      {formatCurrency(month.income)}
                    </strong>
                    <strong>
                      <i className="analytics-legend__expense" aria-hidden="true" />
                      {formatCurrency(month.expenses)}
                    </strong>
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="empty-state">Add dated transactions to compare monthly income and expenses.</p>
        )}
      </article>

      <article
        className="panel analytics-panel"
        id="analytics-panel-savings"
        role="tabpanel"
        aria-labelledby="analytics-tab-savings"
        data-analytics-panel="savings"
      >
        <div className="panel__heading">
          <div>
            <h2 className="panel__title">Savings growth</h2>
            <p className="panel__subtitle">Cumulative net from recorded transactions</p>
          </div>
        </div>
        {datedTransactions.length > 0 ? (
          <>
            <LineChart
              data={monthlyData}
              values={cumulativeNet}
              color="var(--accent)"
              label="Cumulative net savings growth over the last six months"
              allowNegative
            />
            <div className="analytics-chart-summary">
              <span>Net change in the last six months</span>
              <strong>{sixMonthNet >= 0 ? '+' : '−'}{formatCurrency(Math.abs(sixMonthNet))}</strong>
            </div>
            <div className="analytics-monthly-details" aria-label="Monthly cumulative savings">
              {currentMonths.map((month) => {
                const index = monthlyData.findIndex((item) => item.key === month.key)
                return (
                <div className="analytics-monthly-details__row" key={month.key}>
                  <span className="analytics-monthly-details__month">{month.label}</span>
                  <strong>
                    {(cumulativeNet[index] ?? 0) >= 0 ? '+' : '−'}
                    {formatCurrency(Math.abs(cumulativeNet[index] ?? 0))}
                  </strong>
                </div>
                )
              })}
            </div>
          </>
        ) : (
          <p className="empty-state">Add dated transactions to see your savings growth.</p>
        )}
      </article>
      </div>
    </section>
  )
}

export default AnalyticsDashboard
