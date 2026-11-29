export type DashboardPage = 'overview' | 'dashboard' | 'liquidity' | 'reminders'

export type MobileQuickAction = {
  label: string
  dialogId: string
}

type DashboardNavigationProps = {
  activePage: DashboardPage
  quickAction: MobileQuickAction
  onPageChange: (page: DashboardPage) => void
  onQuickAction: () => void
}

const navigationItems: { page: DashboardPage; label: string }[] = [
  { page: 'overview', label: 'Overview' },
  { page: 'dashboard', label: 'Dashboard' },
  { page: 'liquidity', label: 'Liquidity' },
  { page: 'reminders', label: 'Reminders' },
]

const PageIcon = ({ page }: { page: DashboardPage }) => {
  if (page === 'overview') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m3.5 10 8.5-7 8.5 7v9.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 20.5v-7h6v7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )
  }

  if (page === 'dashboard') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 19V11m5 8V5m5 14v-6m6 6V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (page === 'liquidity') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="6" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M4 10h16m-11 5h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const AddIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

export const MobileBottomNavigation = ({
  activePage,
  quickAction,
  onPageChange,
  onQuickAction,
}: DashboardNavigationProps) => (
  <nav className="mobile-bottom-nav" aria-label="Main navigation and quick actions">
    {navigationItems.slice(0, 2).map(({ page, label }) => (
      <button
        className="mobile-bottom-nav__link"
        key={page}
        type="button"
        aria-label={label}
        title={label}
        aria-current={activePage === page ? 'page' : undefined}
        onClick={() => onPageChange(page)}
      >
        <PageIcon page={page} />
      </button>
    ))}
    <button
      className="mobile-bottom-nav__add"
      type="button"
      onClick={onQuickAction}
      aria-label={quickAction.label}
      aria-haspopup="dialog"
      aria-controls={quickAction.dialogId}
    >
      <AddIcon />
    </button>
    {navigationItems.slice(2).map(({ page, label }) => (
      <button
        className="mobile-bottom-nav__link"
        key={page}
        type="button"
        aria-label={label}
        title={label}
        aria-current={activePage === page ? 'page' : undefined}
        onClick={() => onPageChange(page)}
      >
        <PageIcon page={page} />
      </button>
    ))}
  </nav>
)

const DashboardNavigation = ({
  activePage,
  onPageChange,
}: Pick<DashboardNavigationProps, 'activePage' | 'onPageChange'>) => (
  <nav className="page-nav" aria-label="Main navigation">
    {navigationItems.map(({ page, label }) => (
      <button
        className="page-nav__link"
        key={page}
        type="button"
        aria-current={activePage === page ? 'page' : undefined}
        onClick={() => onPageChange(page)}
      >
        {label}
      </button>
    ))}
  </nav>
)

export default DashboardNavigation
