import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="auth-top-row">
                <div>
                    <h2 className="auth-form-title">Login</h2>
                    <p className="auth-form-subtitle">Access your dashboard and continue your care journey.</p>
                </div>
                <Link href={route('register')} className="auth-link auth-top-link">
                    Need an account? Register
                </Link>
            </div>

            {status && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{status}</div>}

            <form onSubmit={submit} className="auth-grid">
                <div className="auth-field">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="auth-input"
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="auth-field">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="auth-input"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <label className="auth-inline">
                    <Checkbox
                        name="remember"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                    />
                    Remember me on this device
                </label>

                <div className="auth-actions">
                    <div className="flex items-center gap-4">
                        {canResetPassword && (
                            <Link href={route('password.request')} className="auth-link">
                                Forgot password?
                            </Link>
                        )}
                    </div>

                    <button type="submit" className="auth-submit" disabled={processing}>
                        {processing ? 'Signing in...' : 'Log In'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
