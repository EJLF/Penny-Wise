export interface Transaction {
  id: string | number
  text: string
  amount: number
  date?: string
}

export interface State {
  transactions: Transaction[]
}

export type Action =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string | number }

const AppReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] }
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((transaction) => transaction.id !== action.payload),
      }
    default:
      return state
  }
}

export default AppReducer
