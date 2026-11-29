const philippinePesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
})

export const formatCurrency = (amount: number): string =>
  philippinePesoFormatter.format(amount)
