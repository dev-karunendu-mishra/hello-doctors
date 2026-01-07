import { Head } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

export default function PublicLayout({ auth, title, children }) {
    return (
        <>
            <Head title={title || 'Hello Doctors'} />
            
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Header auth={auth} />
                
                <main className="flex-grow">
                    {children}
                </main>
                
                <Footer />
            </div>
        </>
    );
}
