import { Link, useForm } from '@inertiajs/react';
import {
    FacebookOutlined,
    InstagramOutlined,
    LinkedinOutlined,
    MailOutlined,
    PhoneOutlined,
    TwitterOutlined,
} from '@ant-design/icons';
import { message } from 'antd';

export default function Footer() {
    const { data, setData, post, processing, reset } = useForm({
        email: '',
    });

    const handleSubscribe = (event) => {
        event.preventDefault();

        post('/subscribe', {
            preserveScroll: true,
            onSuccess: () => {
                message.success('Successfully subscribed to updates!');
                reset('email');
            },
            onError: (errors) => {
                message.error(errors.email || 'Failed to subscribe. Please try again.');
            },
        });
    };

    return (
        <footer className="bg-slate-950 text-slate-200">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 xl:grid-cols-4">
                <div>
                    <Link href="/" className="inline-flex items-center gap-3 text-white">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 text-lg font-bold">
                            +
                        </div>
                        <div>
                            <div className="text-lg font-bold">Hello Doctors</div>
                            <div className="text-xs text-slate-400">Clinic discovery & care booking</div>
                        </div>
                    </Link>

                    <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
                        Compassionate digital healthcare for patients, families, and providers—designed to make finding care simple and trustworthy.
                    </p>

                    <div className="mt-5 space-y-2 text-sm text-slate-300">
                        <a href="mailto:support@hellodoctors.in" className="flex items-center gap-2 hover:text-cyan-300">
                            <MailOutlined /> support@hellodoctors.in
                        </a>
                        <a href="tel:+915551234567" className="flex items-center gap-2 hover:text-cyan-300">
                            <PhoneOutlined /> +91 55512 34567
                        </a>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Quick Links</h3>
                    <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                        <Link href="/">Home</Link>
                        <Link href="/about">About Us</Link>
                        <Link href="/search">Find Doctors</Link>
                        <Link href="/contact">Contact</Link>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Services</h3>
                    <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                        <Link href="/search">Doctor Consultation</Link>
                        <Link href="/register-doctor">Doctor Registration</Link>
                        <Link href="/register-provider">Home Service Providers</Link>
                        <Link href="/login">Patient Login</Link>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Newsletter</h3>
                    <p className="mt-4 text-sm leading-6 text-slate-400">
                        Get care tips, updates, and the latest doctor onboarding news.
                    </p>

                    <form onSubmit={handleSubscribe} className="mt-4 space-y-3">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                            <label htmlFor="footer-email" className="mb-1 block text-xs font-medium text-slate-400">
                                Email address
                            </label>
                            <input
                                id="footer-email"
                                type="email"
                                placeholder="you@example.com"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                required
                                disabled={processing}
                                className="w-full border-0 bg-transparent p-0 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-sky-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {processing ? 'Subscribing...' : 'Subscribe for updates'}
                        </button>
                    </form>

                    <div className="mt-5 flex gap-3 text-lg">
                        <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 hover:border-cyan-500 hover:text-cyan-300">
                            <FacebookOutlined />
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 hover:border-cyan-500 hover:text-cyan-300">
                            <TwitterOutlined />
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 hover:border-cyan-500 hover:text-cyan-300">
                            <InstagramOutlined />
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800 bg-slate-900 hover:border-cyan-500 hover:text-cyan-300">
                            <LinkedinOutlined />
                        </a>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-900">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <p>© 2026 Hello Doctors. All rights reserved.</p>
                    <p>Designed for faster access to trusted healthcare.</p>
                </div>
            </div>
        </footer>
    );
}
