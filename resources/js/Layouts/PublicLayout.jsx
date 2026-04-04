import { Head } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

export default function PublicLayout({ auth, title, children }) {
    return (
        <>
            <Head title={title || 'Hello Doctors'} />

            <div className="clinic-public min-h-screen bg-slate-50 text-slate-900 flex flex-col">
                <Header auth={auth} />

                <main className="flex-grow overflow-x-hidden">
                    {children}
                </main>

                <Footer />
            </div>
        </>
    );
}
