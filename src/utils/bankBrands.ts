export type BankBrand = {
  name: string
  initials: string
  color: string
}

export const bankBrands: BankBrand[] = [
  { name: 'BDO', initials: 'BDO', color: '#003b7a' },
  { name: 'BPI', initials: 'BPI', color: '#9b1c31' },
  { name: 'Metrobank', initials: 'M', color: '#003b71' },
  { name: 'UnionBank', initials: 'UB', color: '#F4610E' },
  { name: 'LandBank', initials: 'LB', color: '#00854a' },
  { name: 'PNB', initials: 'PNB', color: '#00529b' },
  { name: 'RCBC', initials: 'RCBC', color: '#7b1e3c' },
  { name: 'Security Bank', initials: 'SB', color: '#006b54' },
  { name: 'MariBank', initials: 'M', color: '#E45C00' },
  { name: 'Maya', initials: 'M', color: '#03A24E' },
  { name: 'Other', initials: 'BK', color: '#617784' },
]

export const getBankBrand = (bankName: string) => bankBrands.find(
  (brand) => brand.name.toLocaleLowerCase() === bankName.trim().toLocaleLowerCase(),
) ?? {
  name: bankName,
  initials: bankName.trim().slice(0, 2).toLocaleUpperCase() || 'BK',
  color: '#617784',
}
