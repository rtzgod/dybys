'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletConnect } from './WalletConnect';
import { ClientOnly } from './ClientOnly';
import { Music, TrendingUp, User, Upload, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/', icon: Music },
  { name: 'Marketplace', href: '/marketplace', icon: TrendingUp },
  { name: 'Upload', href: '/artist/upload', icon: Upload },
  { name: 'Dashboard', href: '/artist/dashboard', icon: Settings },
  { name: 'Portfolio', href: '/investor/portfolio', icon: User },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/logo.svg" alt="Dybys" className="h-12 w-12" />
              <span className="font-bold text-xl">dybys</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary',
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <ClientOnly fallback={<div className="w-32 h-8 bg-muted rounded animate-pulse" />}>
            <WalletConnect />
          </ClientOnly>
        </div>
      </div>
    </header>
  );
}