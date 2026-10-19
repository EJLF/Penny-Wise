const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

export const formatCurrency = (amount: number) => currencyFormatter.format(amount)
