import { useState, useMemo } from 'react'

export const SORT_OPTIONS = [
  { value: 'alpha-asc',  label: 'A → Z',       icon: '↑' },
  { value: 'alpha-desc', label: 'Z → A',       icon: '↓' },
  { value: 'modified',   label: 'Last Modified', icon: '🕐' },
  { value: 'manual',     label: 'Manual Order',  icon: '⋮⋮' },
]

function sortApps(apps, mode) {
  const list = [...apps]
  switch (mode) {
    case 'alpha-asc':
      return list.sort((a, b) => a.name.localeCompare(b.name))
    case 'alpha-desc':
      return list.sort((a, b) => b.name.localeCompare(a.name))
    case 'modified':
      return list.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
    case 'manual':
      return list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.name.localeCompare(b.name))
    default:
      return list
  }
}

/**
 * useSortedApps
 * Provides sorted apps + a sort mode selector.
 * Persists the user's choice in localStorage so it survives refreshes.
 */
export function useSortedApps(apps) {
  const stored = typeof window !== 'undefined'
    ? (localStorage.getItem('devportal-sort') || 'alpha-asc')
    : 'alpha-asc'

  const [sortMode, setSortMode] = useState(stored)

  function setSort(mode) {
    setSortMode(mode)
    localStorage.setItem('devportal-sort', mode)
  }

  const sorted = useMemo(() => sortApps(apps, sortMode), [apps, sortMode])

  return { sorted, sortMode, setSort }
}
