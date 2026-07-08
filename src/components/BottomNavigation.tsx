'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: string
}

interface BottomNavigationProps {
  role: 'instructor' | 'academy'
  items: NavItem[]
}

export default function BottomNavigation({ role, items }: BottomNavigationProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around max-w-2xl mx-auto">
        {items.map((item, index) => {
          // 중간 버튼 (3번째 항목) - 특별 처리
          const isMiddleButton = index === 2

          if (isMiddleButton) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -mt-6 flex flex-col items-center justify-center"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full text-white shadow-lg hover:bg-blue-700 transition-colors">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <span className="text-xs text-gray-700 mt-1">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
                isActive(item.href)
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
      {/* 중간 버튼으로 인한 여백 */}
      <div className="h-8"></div>
    </nav>
  )
}
