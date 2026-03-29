import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

const PROVIDER_TYPES = [
    { value: 'nurse', label: 'Nurse' },
    { value: 'attendant', label: 'Attendant' },
    { value: 'lab_tech', label: 'Lab Technician' },
    { value: 'field_exec', label: 'Field Executive' },
];

export default function RegisterProvider({ cities = [], services = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        provider_type: '',
        city_id: '',
        license_number: '',
        experience_years: '',
        service_radius_km: '',
        service_ids: [],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('provider.register.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const toggleService = (id) => {
        const current = data.service_ids;
        if (current.includes(id)) {
            setData('service_ids', current.filter((s) => s !== id));
        } else {
            setData('service_ids', [...current, id]);
        }
    };

    return (
        <GuestLayout>
            <Head title="Register as Provider" />

            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Register as a Home Service Provider</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href={route('login')} className="text-indigo-600 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                {/* Personal Details */}
                <fieldset className="rounded-lg border border-gray-200 p-4">
                    <legend className="px-2 text-sm font-semibold text-gray-600">Personal Details</legend>

                    <div>
                        <InputLabel htmlFor="name" value="Full Name" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full"
                            autoComplete="name"
                            isFocused
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            autoComplete="email"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError message={errors.email} className="mt-1" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="phone" value="Phone Number" />
                        <TextInput
                            id="phone"
                            type="tel"
                            name="phone"
                            value={data.phone}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('phone', e.target.value)}
                            required
                        />
                        <InputError message={errors.phone} className="mt-1" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="Password" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        <InputError message={errors.password_confirmation} className="mt-1" />
                    </div>
                </fieldset>

                {/* Professional Details */}
                <fieldset className="rounded-lg border border-gray-200 p-4">
                    <legend className="px-2 text-sm font-semibold text-gray-600">Professional Details</legend>

                    <div>
                        <InputLabel htmlFor="provider_type" value="Provider Type" />
                        <select
                            id="provider_type"
                            name="provider_type"
                            value={data.provider_type}
                            onChange={(e) => setData('provider_type', e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">-- Select Type --</option>
                            {PROVIDER_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        <InputError message={errors.provider_type} className="mt-1" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="city_id" value="City" />
                        <select
                            id="city_id"
                            name="city_id"
                            value={data.city_id}
                            onChange={(e) => setData('city_id', e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">-- Select City --</option>
                            {cities.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <InputError message={errors.city_id} className="mt-1" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="license_number" value="License / Certificate Number (optional)" />
                        <TextInput
                            id="license_number"
                            name="license_number"
                            value={data.license_number}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('license_number', e.target.value)}
                        />
                        <InputError message={errors.license_number} className="mt-1" />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="experience_years" value="Experience (years)" />
                            <TextInput
                                id="experience_years"
                                type="number"
                                name="experience_years"
                                min="0"
                                max="50"
                                value={data.experience_years}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('experience_years', e.target.value)}
                            />
                            <InputError message={errors.experience_years} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="service_radius_km" value="Service Radius (km)" />
                            <TextInput
                                id="service_radius_km"
                                type="number"
                                name="service_radius_km"
                                min="0"
                                step="0.5"
                                value={data.service_radius_km}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('service_radius_km', e.target.value)}
                            />
                            <InputError message={errors.service_radius_km} className="mt-1" />
                        </div>
                    </div>
                </fieldset>

                {/* Services */}
                {services.length > 0 && (
                    <fieldset className="rounded-lg border border-gray-200 p-4">
                        <legend className="px-2 text-sm font-semibold text-gray-600">Services You Offer (optional)</legend>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {services.map((s) => {
                                const selected = data.service_ids.includes(s.id);
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => toggleService(s.id)}
                                        className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                                            selected
                                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                                : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-400'
                                        }`}
                                    >
                                        {s.name}
                                    </button>
                                );
                            })}
                        </div>
                        <InputError message={errors.service_ids} className="mt-1" />
                    </fieldset>
                )}

                <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                    Your account will be active immediately but must be <strong>verified by an admin</strong> before you can receive bookings.
                </div>

                <div className="flex items-center justify-end gap-4">
                    <Link href={route('login')} className="text-sm text-gray-600 hover:text-gray-900">
                        Already registered?
                    </Link>
                    <PrimaryButton disabled={processing}>
                        {processing ? 'Registering...' : 'Register as Provider'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
