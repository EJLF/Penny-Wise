import { useState } from 'react'
import type { Transaction } from '../context/AppReducer'
import { formatCurrency } from '../utils/formatCurrency'
import {
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
    const month = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1)
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
  values: number[]
  color: string
  label: string
  allowNegative?: boolean
}

const LineChart = ({ data, values, color, label, allowNegative = false }: LineChartProps) => {
  const left = 62
  const right = 580
  const top = 20
  const bottom = 194
  const min = allowNegative ? Math.min(0, ...values) : 0
  const max = Math.max(1, ...values)
  const range = max - min || 1
  const points = values.map((value, index) => ({
    x: left + (right - left) * index / Math.max(values.length - 1, 1),
    y: bottom - (value - min) / range * (bottom - top),
    value,
  }))
  const path = points.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`,
  ).join(' ')

  return (
    <svg className="analytics-chart" viewBox="0 0 600 240" role="img" aria-label={label}>
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
      {points.map((point, index) => (
        <g key={data[index].key}>
          <circle cx={point.x} cy={point.y} r="5" fill={color} stroke="#fff" strokeWidth="2" />
          <text className="analytics-chart__month-label" x={point.x} y={bottom + 23} textAnchor="middle">
            {data[index].label}
          </text>
          <title>{`${data[index].label}: ${formatCurrency(point.value)}`}</title>
        </g>
      ))}
    </svg>
  )
}

const AnalyticsDashboard = ({ transactions }: AnalyticsDashboardProps) => {
  const [expenseMonth, setExpenseMonth] = useState('all')
  const monthlyData = getMonthlyData(transactions)
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
  const hasMonthlyTransactions = monthlyData.some((month) => month.count > 0)
  const cumulativeNet = (() => {
    const firstVisibleMonth = monthlyData[0].key
    const startingTotal = datedTransactions.reduce((sum, transaction) => {
      return getTransactionMonth(transaction) < firstVisibleMonth
        ? sum + transaction.amount
        : sum
    }, 0)
    return monthlyData.reduce<{ total: number; values: number[] }>(
      (result, month) => {
        const total = result.total + month.net
        return { total, values: [...result.values, total] }
      },
      { total: startingTotal, values: [] },
    ).values
  })()

  return (
    <section className="analytics-grid" aria-label="Financial analytics">
      <article className="panel analytics-panel">
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
            <span className="analytics-panel__total">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>
        {expenseSlices.length > 0 ? (
          <div className="expense-breakdown">
            <svg className="expense-breakdown__chart" viewBox="0 0 180 180" role="img" aria-label="Expense breakdown pie chart">
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

      <article className="panel analytics-panel">
        <div className="panel__heading">
          <div>
            <h2 className="panel__title">Monthly spending trend</h2>
            <p className="panel__subtitle">Expenses over the last six months</p>
          </div>
        </div>
        {monthlyData.some((month) => month.expenses > 0) ? (
          <LineChart
            data={monthlyData}
            values={monthlyData.map((month) => month.expenses)}
            color="var(--chart-expense)"
            label="Monthly spending trend for the last six months"
          />
        ) : (
          <p className="empty-state">Add dated expenses to see your spending trend.</p>
        )}
      </article>

      <article className="panel analytics-panel">
        <div className="panel__heading">
          <div>
            <h2 className="panel__title">Income vs expenses</h2>
            <p className="panel__subtitle">Monthly totals over the last six months</p>
          </div>
          <div className="analytics-legend" aria-label="Chart legend">
            <span><i className="analytics-legend__income" />Income</span>
            <span><i className="analytics-legend__expense" />Expenses</span>
          </div>
        </div>
        {hasMonthlyTransactions ? (
          <svg className="analytics-chart" viewBox="0 0 600 240" role="img" aria-label="Monthly income compared with expenses">
            <title>Monthly income vs expenses</title>
            {(() => {
              const left = 62
              const right = 580
              const top = 20
              const bottom = 194
              const max = Math.max(1, ...monthlyData.flatMap((month) => [month.income, month.expenses]))
              const barWidth = 16
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
                        <rect
                          x={center - barWidth - 2}
                          y={bottom - incomeHeight}
                          width={barWidth}
                          height={incomeHeight}
                          rx="3"
                          fill="var(--chart-income)"
                        >
                          <title>{`${month.label} income: ${formatCurrency(month.income)}`}</title>
                        </rect>
                        <rect
                          x={center + 2}
                          y={bottom - expenseHeight}
                          width={barWidth}
                          height={expenseHeight}
                          rx="3"
                          fill="var(--chart-expense)"
                        >
                          <title>{`${month.label} expenses: ${formatCurrency(month.expenses)}`}</title>
                        </rect>
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
        ) : (
          <p className="empty-state">Add dated transactions to compare monthly income and expenses.</p>
        )}
      </article>

      <article className="panel analytics-panel">
        <div className="panel__heading">
          <div>
            <h2 className="panel__title">Savings growth</h2>
            <p className="panel__subtitle">Cumulative net from recorded transactions</p>
          </div>
        </div>
        {datedTransactions.length > 0 ? (
          <LineChart
            data={monthlyData}
            values={cumulativeNet}
            color="var(--chart-savings)"
            label="Cumulative net savings growth over the last six months"
            allowNegative
          />
        ) : (
          <p className="empty-state">Add dated transactions to see your savings growth.</p>
        )}
      </article>
    </section>
  )
}

export default AnalyticsDashboard
