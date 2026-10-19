import { useEffect, useRef, useState } from 'react'

export type AppTheme = 'green' | 'blue' | 'purple' | 'orange' | 'rose'

type HeaderProps = {
  theme: AppTheme
  onThemeChange: (theme: AppTheme) => void
}

const themes: { id: AppTheme; label: string; color: string }[] = [
  { id: 'green', label: 'Green', color: '#16876c' },
  { id: 'blue', label: 'Blue', color: '#3478c8' },
  { id: 'purple', label: 'Purple', color: '#8057c7' },
  { id: 'orange', label: 'Orange', color: '#c76b25' },
  { id: 'rose', label: 'Rose', color: '#c34f70' },
]

const Header = ({ theme, onThemeChange }: HeaderProps) => {
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false)
  const themePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isThemePickerOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!themePickerRef.current?.contains(event.target as Node)) {
        setIsThemePickerOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsThemePickerOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isThemePickerOpen])

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 17.5 9.1 12l3.5 3.2L20 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15.5 7.5H20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>Ledgerly</span>
        </div>
        <div className="topbar__right" ref={themePickerRef}>
          <button
            className="account-theme-trigger"
            type="button"
            aria-expanded={isThemePickerOpen}
            aria-controls="account-theme-picker"
            onClick={() => setIsThemePickerOpen((isOpen) => !isOpen)}
          >
            <span>Personal account</span>
            <span className="avatar" aria-hidden="true">PA</span>
          </button>
          {isThemePickerOpen && (
            <div className="theme-picker" id="account-theme-picker" aria-label="Choose app color">
              <p className="theme-picker__title">Choose app color</p>
              <div className="theme-picker__options">
                {themes.map((option) => (
                  <button
                    className="theme-picker__option"
                    key={option.id}
                    type="button"
                    aria-label={`${option.label}${theme === option.id ? ', selected' : ''}`}
                    aria-pressed={theme === option.id}
                    title={option.label}
                    onClick={() => {
                      onThemeChange(option.id)
                      setIsThemePickerOpen(false)
                    }}
                  >
                    <span className="theme-picker__swatch" style={{ backgroundColor: option.color }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
