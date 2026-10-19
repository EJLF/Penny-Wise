import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

const readStoredValue = <T,>(key: string, initialValue: T): T => {
  if (typeof window === 'undefined') {
    return initialValue
  }

  try {
    const storedValue = window.localStorage.getItem(key)
    return storedValue === null ? initialValue : (JSON.parse(storedValue) as T)
  } catch (error) {
    console.error(`Unable to read "${key}" from localStorage.`, error)
    return initialValue
  }
}

export const useLocalStorage = <T,>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => readStoredValue(key, initialValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Unable to save "${key}" to localStorage.`, error)
    }
  }, [key, value])

  return [value, setValue]
}
