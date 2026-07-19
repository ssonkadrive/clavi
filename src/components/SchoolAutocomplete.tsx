'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface School {
  id: string
  name: string
}

interface SchoolAutocompleteProps {
  value: string
  onSelect: (school: School) => void
  placeholder?: string
  disabled?: boolean
}

export default function SchoolAutocomplete({
  value,
  onSelect,
  placeholder = '학교명을 입력하세요',
  disabled = false,
}: SchoolAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<School[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name')
        .ilike('name', `%${inputValue.trim()}%`)
        .order('name', { ascending: true })
        .limit(10)

      if (!error && data) {
        setSuggestions(data)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [inputValue, supabase])

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={inputValue}
        disabled={disabled}
        onChange={(e) => {
          setInputValue(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        placeholder={placeholder}
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {suggestions.map((school) => (
            <li key={school.id}>
              <button
                type="button"
                onClick={() => {
                  setInputValue(school.name)
                  setIsOpen(false)
                  onSelect(school)
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50"
              >
                {school.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
