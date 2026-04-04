import { Link } from '@inertiajs/react';
import {
    CloseOutlined,
    LoginOutlined,
    MailOutlined,
    MenuOutlined,
    PhoneOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

export default function Header({ auth }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

    const navigationItems = [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
        { label: 'Find Doctors', href: '/search' },
        { label: 'Contact', href: '/contact' },
    ];

    const getNavClassName = (href) => {
        const isActive = href === '/' ? currentPath === '/' : currentPath.startsWith(href);

        return `rounded-full px-4 py-2 text-sm font-semibold transition ${
            isActive
                ? 'bg-sky-50 text-sky-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-sky-700'
        }`;
    };

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="bg-sky-950 text-sky-50">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        <a href="mailto:support@hellodoctors.in" className="inline-flex items-center gap-2 hover:text-cyan-200">
                            <MailOutlined />
                            <span>support@hellodoctors.in</span>
                        </a>
                        <a href="tel:+915551234567" className="inline-flex items-center gap-2 hover:text-cyan-200">
                            <PhoneOutlined />
                            <span>+91 55512 34567</span>
                        </a>
                    </div>

                    <div className="hidden sm:block text-sky-100">
                        Trusted care, verified doctors, faster booking.
                    </div>
                </div>
            </div>

            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
                <Link href="/" className="flex items-center gap-3 text-slate-900">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-sky-200">
                        +
                    </div>
                    <div>
                        <div className="text-xl font-extrabold leading-none">Hello Doctors</div>
                        <div className="text-xs text-slate-500">Compassionate Care Network</div>
                    </div>
                </Link>

                <nav className="hidden xl:flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
                    {navigationItems.map((item) => (
                        <Link key={item.href} href={item.href} className={getNavClassName(item.href)}>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden xl:flex items-center gap-3">
                    {auth?.user ? (
                        <>
                            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
                                <UserOutlined />
                                Dashboard
                            </Link>
                            <Link href="/logout" method="post" as="button" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                                Logout
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
                                <LoginOutlined />
                                Login
                            </Link>
                            <Link href="/register-doctor" className="rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-100 transition hover:-translate-y-0.5 hover:from-sky-700 hover:to-cyan-600">
                                Join as Doctor
                            </Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 xl:hidden"
                    onClick={() => setMobileMenuOpen((value) => !value)}
                    aria-label="Toggle navigation"
                >
                    {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="border-t border-slate-200 bg-white xl:hidden">
                    <div className="mx-auto max-w-7xl px-4 py-4">
                        <nav className="flex flex-col gap-2">
                            {navigationItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={getNavClassName(item.href)}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="mt-4 flex flex-col gap-2">
                            {auth?.user ? (
                                <>
                                    <Link href="/dashboard" className="rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700">
                                        Dashboard
                                    </Link>
                                    <Link href="/logout" method="post" as="button" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                                        Logout
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="rounded-full border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700">
                                        Login
                                    </Link>
                                    <Link href="/register-doctor" className="rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2 text-center text-sm font-semibold text-white">
                                        Join as Doctor
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
