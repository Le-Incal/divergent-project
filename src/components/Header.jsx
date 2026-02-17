import { useApp } from '../context/AppContext'

export default function Header() {
  const { getActiveFramework } = useApp()
  const framework = getActiveFramework()

  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      <span
        className="px-4 py-2 rounded-md text-sm font-medium"
        style={{
          background: 'var(--header-bg, rgba(255, 255, 255, 0.08))',
          border: '1px solid var(--header-border, rgba(255, 255, 255, 0.1))',
          color: 'var(--header-label, var(--icy-aqua))',
        }}
      >
        {framework?.name}
      </span>
    </header>
  )
}
