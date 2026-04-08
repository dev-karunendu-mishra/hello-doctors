import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

const PROVIDER_TYPES = [
    { value: 'nurse', label: 'Nurse' },
    { value: 'attendant', label: 'Attendant' },
    { value: 'lab_tech', label: 'Lab Technician' },
    { value: 'field_exec', label: 'Field Executive' },
];

export default function RegisterProvider({ cities = [], services = [] }) {
    const [activeTab, setActiveTab] = useState('personal');

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
                <div className="rounded-md border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                    Fields marked with <span className="font-semibold text-red-600">*</span> are required.
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex border-b border-gray-200 bg-gray-50">
                        <button
                            type="button"
                            onClick={() => setActiveTab('personal')}
                            className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                                activeTab === 'personal'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Personal Details
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('professional')}
                            className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                                activeTab === 'professional'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Professional Details
                        </button>
                    </div>

                    <div className="p-4 sm:p-5">
                        {activeTab === 'personal' ? (
                            <div className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="name" value={<><span>Full Name</span> <span className="text-red-600">*</span></>} />
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

                                <div>
                                    <InputLabel htmlFor="email" value={<><span>Email</span> <span className="text-red-600">*</span></>} />
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

                                <div>
                                    <InputLabel htmlFor="phone" value={<><span>Phone Number</span> <span className="text-red-600">*</span></>} />
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

                                <div>
                                    <InputLabel htmlFor="password" value={<><span>Password</span> <span className="text-red-600">*</span></>} />
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

                                <div>
                                    <InputLabel htmlFor="password_confirmation" value={<><span>Confirm Password</span> <span className="text-red-600">*</span></>} />
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

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('professional')}
                                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                    >
                                        Continue to Professional Details
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <InputLabel htmlFor="provider_type" value={<><span>Provider Type</span> <span className="text-red-600">*</span></>} />
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

                                <div>
                                    <InputLabel htmlFor="city_id" value={<><span>City</span> <span className="text-red-600">*</span></>} />
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

                                <div>
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

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                                {services.length > 0 && (
                                    <div>
                                        <InputLabel htmlFor="service_ids" value="Services You Offer (optional)" />
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {services.map((s) => {
                                                const selected = data.service_ids.includes(s.id);
                                                return (
                                                    <button
                                                        key={s.id}
                                                        id="service_ids"
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
                                    </div>
                                )}

                                <div className="flex justify-between gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('personal')}
                                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Back to Personal Details
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                    Your provider profile will stay <strong>pending admin verification and activation</strong> before bookings can be assigned. You can still sign in and complete your profile and weekly availability meanwhile.
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
