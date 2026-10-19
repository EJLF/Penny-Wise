import { useCallback, type Dispatch, type ReactNode } from 'react'
import AppReducer, { type Action, type State } from './AppReducer'
import { GlobalContext } from './GlobalContext'
import { useLocalStorage } from '../hooks/useLocalStorage'

const initialState: State = {
  transactions: [
    // { id: 1, text: 'Flower', amount: -20 },
    // { id: 2, text: 'Salary', amount: 300 },
    // { id: 3, text: 'Book', amount: -10 },
    // { id: 4, text: 'Camera', amount: 150 },
  ],
}

const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useLocalStorage<State>('smart-expense-tracker-state', initialState)
  const dispatch: Dispatch<Action> = useCallback(
    (action) => setState((currentState) => AppReducer(currentState, action)),
    [setState],
  )

  return (
    <GlobalContext.Provider value={{ transactions: state.transactions, dispatch }}>
      {children}
    </GlobalContext.Provider>
  )
}

export { GlobalProvider }
