/**
 * SidebarLayout — secondary split-pane helper.
 * Used on Order Entry page (Menu | Cart) in Sprint 3.
 * Built in Sprint 2; placed here ready for use.
 *
 * NOT the navigation sidebar — that is src/components/layout/Sidebar.tsx.
 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface SidebarLayoutProps {
  /** Left/right secondary panel content */
  sidebar: ReactNode
  /** Main workspace content */
  children: ReactNode
  /** Width of the secondary panel (default: 360px) */
  sidebarWidth?: string | number
  /** Panel position (default: right) */
  sidebarPosition?: 'left' | 'right'
  className?: string
  sidebarClassName?: string
  contentClassName?: string
}

export function SidebarLayout({
  sidebar,
  children,
  sidebarWidth = '360px',
  sidebarPosition = 'right',
  className,
  sidebarClassName,
  contentClassName,
}: SidebarLayoutProps) {
  const w = typeof sidebarWidth === 'number' ? `${sidebarWidth}px` : sidebarWidth

  return (
    <div
      className={cn(
        'flex h-full overflow-hidden',
        sidebarPosition === 'right' ? 'flex-row' : 'flex-row-reverse',
        'max-lg:flex-col',
        className,
      )}
    >
      <div className={cn('flex-1 min-w-0 overflow-auto', contentClassName)}>
        {children}
      </div>
      <div
        className={cn(
          'shrink-0 overflow-auto border-l border-border',
          'max-lg:border-l-0 max-lg:border-t max-lg:w-full',
          sidebarClassName,
        )}
        style={{ width: w }}
      >
        {sidebar}
      </div>
    </div>
  )
}

export default SidebarLayout
