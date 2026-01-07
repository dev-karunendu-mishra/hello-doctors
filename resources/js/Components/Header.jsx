import { Link } from '@inertiajs/react';
import { Button, Dropdown } from 'antd';
import { 
    UserOutlined, 
    LoginOutlined, 
    MenuOutlined,
    MedicineBoxOutlined,
    HomeOutlined,
    SearchOutlined,
    PhoneOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { useState } from 'react';

export default function Header({ auth }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navigationItems = [
        { label: 'Home', href: '/', icon: <HomeOutlined /> },
        { label: 'Find Doctors', href: '/search', icon: <SearchOutlined /> },
        { label: 'About', href: '/about', icon: <InfoCircleOutlined /> },
        { label: 'Contact', href: '/contact', icon: <PhoneOutlined /> },
    ];

    const registerMenuItems = [
        {
            key: 'doctor',
            label: (
                <Link href="/register?role=doctor" className="block px-4 py-2">
                    Register as Doctor
                </Link>
            ),
        },
        {
            key: 'patient',
            label: (
                <Link href="/register?role=patient" className="block px-4 py-2">
                    Register as Patient
                </Link>
            ),
        },
    ];

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <MedicineBoxOutlined className="text-3xl text-blue-600" />
                        <span className="text-2xl font-bold text-gray-800">
                            Hello<span className="text-blue-600">Doctors</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        {navigationItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        {auth?.user ? (
                            <>
                                <Link href="/dashboard">
                                    <Button type="default" icon={<UserOutlined />}>
                                        Dashboard
                                    </Button>
                                </Link>
                                <Link href="/logout" method="post" as="button">
                                    <Button type="default">
                                        Logout
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button 
                                        type="default" 
                                        icon={<LoginOutlined />}
                                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                    >
                                        Login
                                    </Button>
                                </Link>
                                <Dropdown
                                    menu={{ items: registerMenuItems }}
                                    placement="bottomRight"
                                    trigger={['click']}
                                >
                                    <Button 
                                        type="primary" 
                                        icon={<UserOutlined />}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Register
                                    </Button>
                                </Dropdown>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-gray-600 hover:text-blue-600"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <MenuOutlined className="text-2xl" />
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t">
                        <nav className="flex flex-col space-y-2">
                            {navigationItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded transition-colors"
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                        
                        <div className="mt-4 px-4 space-y-2">
                            {auth?.user ? (
                                <>
                                    <Link href="/dashboard" className="block">
                                        <Button 
                                            type="default" 
                                            icon={<UserOutlined />}
                                            block
                                        >
                                            Dashboard
                                        </Button>
                                    </Link>
                                    <Link href="/logout" method="post" as="button" className="block w-full">
                                        <Button type="default" block>
                                            Logout
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="block">
                                        <Button 
                                            type="default" 
                                            icon={<LoginOutlined />}
                                            block
                                            className="border-blue-600 text-blue-600"
                                        >
                                            Login
                                        </Button>
                                    </Link>
                                    <Link href="/register?role=doctor" className="block">
                                        <Button type="primary" block className="bg-blue-600">
                                            Register as Doctor
                                        </Button>
                                    </Link>
                                    <Link href="/register?role=patient" className="block">
                                        <Button type="primary" block className="bg-blue-600">
                                            Register as Patient
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
