import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const PROVIDER_TYPES = [
    { value: 'nurse', label: 'Nurse' },
    { value: 'attendant', label: 'Attendant' },
    { value: 'lab_tech', label: 'Lab Technician' },
    { value: 'field_exec', label: 'Field Executive' },
];

const STEP_FIELDS = {
    0: ['name', 'email', 'phone', 'password', 'password_confirmation'],
    1: ['provider_type', 'city_id'],
};

const STEP_ITEMS = [
    { title: 'Personal Details', description: 'Create your provider account.' },
    { title: 'Professional Details', description: 'Tell us how you support patients and submit.' },
];

export default function RegisterProvider({ cities = [], services = [] }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [clientErrors, setClientErrors] = useState({});

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

    const handleFieldChange = (field, value) => {
        setData(field, value);

        setClientErrors((currentErrors) => {
            if (!currentErrors[field]) {
                return currentErrors;
            }

            const nextErrors = { ...currentErrors };
            delete nextErrors[field];
            return nextErrors;
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

    useEffect(() => {
        const errorKeys = Object.keys(errors);

        if (errorKeys.some((key) => STEP_FIELDS[1]?.includes(key) || key === 'service_ids')) {
            setCurrentStep(1);
            return;
        }

        if (errorKeys.some((key) => STEP_FIELDS[0]?.includes(key))) {
            setCurrentStep(0);
        }
    }, [errors]);

    const getStepValidationErrors = (stepIndex) => {
        const stepErrors = {};

        if (stepIndex === 0) {
            if (!String(data.name ?? '').trim()) stepErrors.name = 'Full name is required.';
            if (!String(data.email ?? '').trim()) stepErrors.email = 'Email is required.';
            if (!String(data.phone ?? '').trim()) stepErrors.phone = 'Phone number is required.';
            if (!String(data.password ?? '').trim()) stepErrors.password = 'Password is required.';

            if (!String(data.password_confirmation ?? '').trim()) {
                stepErrors.password_confirmation = 'Please confirm your password.';
            } else if (data.password !== data.password_confirmation) {
                stepErrors.password_confirmation = 'Passwords do not match.';
            }
        }

        if (stepIndex === 1) {
            if (!String(data.provider_type ?? '').trim()) stepErrors.provider_type = 'Provider type is required.';
            if (!String(data.city_id ?? '').trim()) stepErrors.city_id = 'City is required.';
        }

        return stepErrors;
    };

    const validateStep = (stepIndex) => {
        const stepErrors = getStepValidationErrors(stepIndex);
        const stepFields = STEP_FIELDS[stepIndex] || [];

        setClientErrors((currentErrors) => {
            const nextErrors = { ...currentErrors };
            stepFields.forEach((field) => delete nextErrors[field]);
            return { ...nextErrors, ...stepErrors };
        });

        return Object.keys(stepErrors).length === 0;
    };

    const isStepComplete = (stepIndex) => {
        if (!STEP_FIELDS[stepIndex]) {
            return false;
        }

        return Object.keys(getStepValidationErrors(stepIndex)).length === 0;
    };

    const goToNextStep = () => {
        if (!validateStep(currentStep)) {
            return;
        }

        setCurrentStep((step) => Math.min(step + 1, STEP_ITEMS.length - 1));
    };

    const goToPreviousStep = () => {
        setCurrentStep((step) => Math.max(step - 1, 0));
    };

    const handleStepChange = (targetStep) => {
        if (targetStep <= currentStep) {
            setCurrentStep(targetStep);
            return;
        }

        for (let step = currentStep; step < targetStep; step += 1) {
            if (!validateStep(step)) {
                setCurrentStep(step);
                return;
            }
        }

        setCurrentStep(targetStep);
    };

    const submit = (e) => {
        e.preventDefault();

        if (currentStep < STEP_ITEMS.length - 1) {
            goToNextStep();
            return;
        }

        post(route('provider.register.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const progress = ((currentStep + 1) / STEP_ITEMS.length) * 100;

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
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 px-4 py-5 sm:px-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600">Provider onboarding</p>
                                <h3 className="mt-1 text-lg font-semibold text-gray-900">{STEP_ITEMS[currentStep].title}</h3>
                                <p className="mt-1 text-sm text-gray-500">{STEP_ITEMS[currentStep].description}</p>
                            </div>
                            <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
                                Step {currentStep + 1} of {STEP_ITEMS.length}
                            </div>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-indigo-100">
                            <div
                                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 border-b border-gray-100 bg-gray-50 px-4 py-4 sm:grid-cols-2 sm:px-6">
                        {STEP_ITEMS.map((step, index) => {
                            const isActive = currentStep === index;
                            const isComplete = index < currentStep || isStepComplete(index);

                            return (
                                <button
                                    key={step.title}
                                    type="button"
                                    onClick={() => handleStepChange(index)}
                                    className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                                        isActive
                                            ? 'border-indigo-200 bg-white shadow-sm'
                                            : 'border-transparent bg-transparent hover:border-gray-200 hover:bg-white'
                                    }`}
                                >
                                    <span
                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                            isComplete
                                                ? 'bg-indigo-600 text-white'
                                                : isActive
                                                    ? 'bg-indigo-100 text-indigo-700'
                                                    : 'bg-gray-200 text-gray-600'
                                        }`}
                                    >
                                        {isComplete ? '✓' : index + 1}
                                    </span>
                                    <span>
                                        <span className="block text-sm font-semibold text-gray-900">{step.title}</span>
                                        <span className="mt-0.5 block text-xs text-gray-500">{step.description}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-4 sm:p-6">
                        {currentStep === 0 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <InputLabel htmlFor="name" value={<><span>Full Name</span> <span className="text-red-600">*</span></>} />
                                        <TextInput
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            className="mt-1 block w-full"
                                            autoComplete="name"
                                            isFocused={currentStep === 0}
                                            onChange={(e) => handleFieldChange('name', e.target.value)}
                                            required
                                        />
                                        <InputError message={clientErrors.name || errors.name} className="mt-1" />
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
                                            onChange={(e) => handleFieldChange('email', e.target.value)}
                                            required
                                        />
                                        <InputError message={clientErrors.email || errors.email} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="phone" value={<><span>Phone Number</span> <span className="text-red-600">*</span></>} />
                                        <TextInput
                                            id="phone"
                                            type="tel"
                                            name="phone"
                                            value={data.phone}
                                            className="mt-1 block w-full"
                                            onChange={(e) => handleFieldChange('phone', e.target.value)}
                                            required
                                        />
                                        <InputError message={clientErrors.phone || errors.phone} className="mt-1" />
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
                                            onChange={(e) => handleFieldChange('password', e.target.value)}
                                            required
                                        />
                                        <InputError message={clientErrors.password || errors.password} className="mt-1" />
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
                                            onChange={(e) => handleFieldChange('password_confirmation', e.target.value)}
                                            required
                                        />
                                        <InputError message={clientErrors.password_confirmation || errors.password_confirmation} className="mt-1" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <InputLabel htmlFor="provider_type" value={<><span>Provider Type</span> <span className="text-red-600">*</span></>} />
                                        <select
                                            id="provider_type"
                                            name="provider_type"
                                            value={data.provider_type}
                                            onChange={(e) => handleFieldChange('provider_type', e.target.value)}
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">-- Select Type --</option>
                                            {PROVIDER_TYPES.map((t) => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                        <InputError message={clientErrors.provider_type || errors.provider_type} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="city_id" value={<><span>City</span> <span className="text-red-600">*</span></>} />
                                        <select
                                            id="city_id"
                                            name="city_id"
                                            value={data.city_id}
                                            onChange={(e) => handleFieldChange('city_id', e.target.value)}
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">-- Select City --</option>
                                            {cities.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <InputError message={clientErrors.city_id || errors.city_id} className="mt-1" />
                                    </div>
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
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                Your provider profile will stay <strong>pending admin verification and activation</strong> before bookings can be assigned. You can still sign in and complete your profile and weekly availability meanwhile.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={route('login')} className="text-sm text-gray-600 hover:text-gray-900">
                        Already registered?
                    </Link>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        {currentStep > 0 && (
                            <button
                                type="button"
                                onClick={goToPreviousStep}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Back
                            </button>
                        )}

                        {currentStep < STEP_ITEMS.length - 1 ? (
                            <button
                                type="button"
                                onClick={goToNextStep}
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                Continue
                            </button>
                        ) : (
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Registering...' : 'Register as Provider'}
                            </PrimaryButton>
                        )}
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}
