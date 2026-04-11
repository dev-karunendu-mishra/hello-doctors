import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset, transform } = useForm({
        first_name: '',
        last_name: '',
        name: '',
        email: '',
        phone: '',
        agree_terms: false,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        const fullName = `${data.first_name} ${data.last_name}`.trim();
        transform((formData) => ({
            ...formData,
            name: fullName,
        }));

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <div className="auth-top-row">
                <div>
                    <h2 className="auth-form-title">Register</h2>
                    <p className="auth-form-subtitle">Create your account to book doctors and manage appointments online.</p>
                </div>
                <Link href={route('login')} className="auth-link auth-top-link">
                    Already have an account? Login
                </Link>
            </div>

            <form onSubmit={submit} className="auth-grid">
                <div className="auth-section-title">Your Basic Information</div>

                <div className="auth-grid auth-grid-two auth-grid-compact">
                    <div className="auth-field">
                        <label htmlFor="first_name">First Name</label>
                        <input
                            id="first_name"
                            name="first_name"
                            value={data.first_name}
                            className="auth-input"
                            autoComplete="given-name"
                            autoFocus
                            onChange={(e) => setData('first_name', e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="last_name">Last Name</label>
                        <input
                            id="last_name"
                            name="last_name"
                            value={data.last_name}
                            className="auth-input"
                            autoComplete="family-name"
                            onChange={(e) => setData('last_name', e.target.value)}
                            required
                        />
                    </div>
                </div>
                <InputError message={errors.name} className="-mt-2" />

                <div className="auth-grid auth-grid-two auth-grid-compact">
                    <div className="auth-field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="auth-input"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="phone">Phone Number</label>
                        <input
                            id="phone"
                            type="text"
                            name="phone"
                            value={data.phone}
                            className="auth-input"
                            autoComplete="tel"
                            onChange={(e) => setData('phone', e.target.value)}
                        />
                    </div>
                </div>

                <div className="auth-section-title">Choose Your Password</div>

                <div className="auth-grid auth-grid-two auth-grid-compact">
                    <div className="auth-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="auth-input"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password_confirmation">Confirm Password</label>
                        <input
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="auth-input"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>
                </div>

                <div className="auth-password-hints">
                    <span>At least 8 characters</span>
                    <span>Include one uppercase letter</span>
                    <span>Include one number</span>
                </div>

                <label className="auth-inline">
                    <input
                        type="checkbox"
                        checked={data.agree_terms}
                        required
                        onChange={(e) => setData('agree_terms', e.target.checked)}
                    />
                    I confirm that I have read and agree to the E-Sign disclosure.
                </label>

                <div className="auth-actions">
                    <span className="auth-muted-note">You can update additional profile details after registration.</span>

                    <button type="submit" className="auth-submit" disabled={processing}>
                        {processing ? 'Creating account...' : 'Register'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
