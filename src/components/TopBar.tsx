"use client"

import { useSession, signOut } from "@/hooks/useAuth"
import { Button } from "@/components/ui/Button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import { Settings, LogOut, Menu, X } from "lucide-react"
import AlertCenter from "@/components/alerts/AlertCenter"
import Link from "next/link"

interface TopBarProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function TopBar({ onMenuClick, showMenuButton = false }: TopBarProps) {
  const { data: session, status } = useSession()

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Menu button for mobile */}
      {showMenuButton && (
        <Button variant="ghost" size="sm" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* User actions */}
      <div className="flex items-center space-x-3">
        {status === "loading" ? (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
        ) : session ? (
          <>
            {/* Welcome message */}
            <span className="text-sm text-gray-600 hidden sm:block">
              Bienvenue, {session.user?.name || session.user?.email}
            </span>
            
            {/* Alert Center */}
            <AlertCenter />
            
            {/* User Avatar */}
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                <AvatarFallback>
                  {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Settings */}
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            
            {/* Sign out */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="p-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Se connecter
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                S'inscrire
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 