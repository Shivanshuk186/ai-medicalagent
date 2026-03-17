'use client';
import React from "react";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconHistory, IconUserCircle, IconCurrencyDollar, IconMoon, IconSun, IconAlertTriangle } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

function AppHeader() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    const navItems = [
        { href: '/dashboard', label: 'Home', icon: IconHome },
        { href: '/emergency', label: 'Emergency', icon: IconAlertTriangle, highlight: true },
        { href: '/pricing', label: 'Pricing', icon: IconCurrencyDollar },
        { href: '/history', label: 'History', icon: IconHistory },
        { href: '/profile', label: 'Profile', icon: IconUserCircle },
    ];

    return (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between px-4 py-0.5 md:px-10 lg:px-20 xl:px-40">
                <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <Image src={'/logobg.png'} alt='logo' width={100} height={26} />
                </Link>
                
                <div className='flex items-center gap-2 md:gap-6'>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link 
                                key={item.href}
                                href={item.href}
                                className={`hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors md:flex ${
                                    item.highlight
                                        ? isActive 
                                            ? 'bg-red-600 text-white hover:bg-red-700' 
                                            : 'text-red-500 hover:bg-red-500/10'
                                        : isActive 
                                        ? 'bg-primary/10 text-primary' 
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-lg"
                    >
                        <IconSun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <IconMoon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                    <UserButton afterSignOutUrl="/" />
                </div>
            </div>
        </header>
    )
}
export default AppHeader;

