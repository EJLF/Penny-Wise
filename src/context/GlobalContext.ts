import { createContext, type Dispatch } from 'react'
import type { Action, State } from './AppReducer'

interface GlobalContextValue {
  transactions: State['transactions']
  dispatch: Dispatch<Action>
}

export const GlobalContext = createContext<GlobalContextValue | null>(null)
