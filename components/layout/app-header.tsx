'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Wallet, Users, LogOut, LayoutDashboard } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  userName: string
  title: string
  actions?: React.ReactNode
}

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members', label: 'Members', icon: Users },
]

export function AppHeader({ userName, title, actions }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleSignOut() {
    await authClient.signOut()
    toast.success('Signed out')
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-5xl mx-auto px-4">
        {/* Top row */}
        <div className="flex items-center justify-between h-14 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-base hidden sm:block">Member Finance</span>
            <span className="font-bold text-foreground text-base sm:hidden">{title}</span>
          </div>

          <div className="flex items-center gap-2">
            {actions}
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>{userName}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="h-9 w-9"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Nav row */}
        <nav className="flex gap-1 -mb-px" aria-label="Main navigation">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
