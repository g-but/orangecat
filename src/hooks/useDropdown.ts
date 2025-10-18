import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

interface UseDropdownOptions {
  closeOnRouteChange?: boolean
  keyboardNavigation?: boolean
  itemCount?: number
}

export function useDropdown(options: UseDropdownOptions = {}) {
  const {
    closeOnRouteChange = true,
    keyboardNavigation = false,
    itemCount = 0
  } = options

  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | HTMLAnchorElement | null)[]>([])
  const pathname = usePathname()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown when route changes
  useEffect(() => {
    if (closeOnRouteChange) {
      setIsOpen(false)
      setFocusedIndex(-1)
    }
  }, [pathname, closeOnRouteChange])

  // Keyboard navigation
  useEffect(() => {
    if (!keyboardNavigation || !isOpen) {return}

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          setIsOpen(false)
          setFocusedIndex(-1)
          buttonRef.current?.focus()
          break
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => {
            const nextIndex = prev < itemCount ? prev + 1 : 0
            itemRefs.current[nextIndex]?.focus()
            return nextIndex
          })
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => {
            const nextIndex = prev > 0 ? prev - 1 : itemCount
            itemRefs.current[nextIndex]?.focus()
            return nextIndex
          })
          break
        case 'Tab':
          if (event.shiftKey && focusedIndex === 0) {
            setIsOpen(false)
            setFocusedIndex(-1)
          } else if (!event.shiftKey && focusedIndex === itemCount) {
            setIsOpen(false)
            setFocusedIndex(-1)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, focusedIndex, itemCount, keyboardNavigation])

  const toggle = useCallback(() => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setFocusedIndex(-1)
    }
  }, [isOpen])

  const close = useCallback(() => {
    setIsOpen(false)
    setFocusedIndex(-1)
  }, [])

  const handleTriggerKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (keyboardNavigation && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      setIsOpen(true)
      setFocusedIndex(0)
      setTimeout(() => {
        itemRefs.current[0]?.focus()
      }, 50)
    }
  }, [keyboardNavigation])

  return {
    isOpen,
    focusedIndex,
    dropdownRef,
    buttonRef,
    itemRefs,
    toggle,
    close,
    setFocusedIndex,
    handleTriggerKeyDown
  }
} 