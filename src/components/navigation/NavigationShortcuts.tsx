'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNavigation, NavSection } from '@/hooks/useNavigation'

interface NavigationShortcutsProps {
  sections: NavSection[]
}

export function NavigationShortcuts({ sections }: NavigationShortcutsProps) {
  const router = useRouter()
  const { toggleSidebar } = useNavigation(sections)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if cmd/ctrl is pressed
      const isModifierPressed = event.metaKey || event.ctrlKey

      if (!isModifierPressed) {return}

      // Prevent default browser shortcuts
      const shortcuts: Record<string, () => void> = {
        'b': () => {
          event.preventDefault()
          toggleSidebar()
        },
        '1': () => {
          event.preventDefault()
          router.push('/dashboard')
        },
        '2': () => {
          event.preventDefault()
          router.push('/dashboard/fundraising')
        },
        '3': () => {
          event.preventDefault()
          router.push('/people')
        },
        '4': () => {
          event.preventDefault()
          router.push('/organizations')
        },
        '5': () => {
          event.preventDefault()
          router.push('/projects')
        },
        ',': () => {
          event.preventDefault()
          router.push('/settings')
        },
      }

      const shortcut = shortcuts[event.key.toLowerCase()]
      if (shortcut) {
        shortcut()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router, toggleSidebar])

  return null // This component doesn't render anything
} 