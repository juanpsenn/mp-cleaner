'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'

interface SidebarProps {
  currentPage?: string
}

export function Sidebar({ currentPage }: SidebarProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Records', path: '/records' },
    { label: 'Import', path: '/import' },
    { label: 'Create Record', path: '/create' },
  ]

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors lg:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 lg:relative lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold">Financial Tracker</h2>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(item => (
              <Button
                key={item.path}
                variant={currentPage === item.path ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => {
                  router.push(item.path)
                  setIsOpen(false)
                }}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                router.push('/')
                setIsOpen(false)
              }}
            >
              Home
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
