import { Head, Link } from '@inertiajs/react';
import { Card, Col, Row, Statistic, Typography } from 'antd';
import { EnvironmentOutlined, MedicineBoxOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import PublicLayout from '@/Layouts/PublicLayout';

const { Title, Paragraph } = Typography;

export default function About({ auth, stats }) {
    return (
        <>
            <Head title="About Us - Hello Doctors" />

            <PublicLayout auth={auth} title="About Us - Hello Doctors">
                <div className="min-h-screen bg-slate-50">
                    <section className="bg-gradient-to-br from-sky-950 via-sky-900 to-cyan-800 py-16 text-white lg:py-20">
                        <div className="mx-auto max-w-5xl px-4 text-center">
                            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-cyan-100">
                                About Hello Doctors
                            </span>
                            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                                Connecting patients with trusted care across cities and specialties.
                            </h1>
                            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-sky-100 sm:text-lg">
                                Hello Doctors helps people discover reliable healthcare professionals faster, with a focus on verified information, local availability, and a simpler patient journey.
                            </p>
                        </div>
                    </section>

                    <section className="-mt-8 px-4 pb-6">
                        <div className="mx-auto max-w-6xl">
                            <Row gutter={[16, 16]} justify="center">
                                <Col xs={24} sm={12} md={6}>
                                    <Card className="rounded-2xl shadow-sm">
                                        <Statistic title="Verified Doctors" value={stats.doctors} prefix={<UserOutlined />} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Card className="rounded-2xl shadow-sm">
                                        <Statistic title="Cities Covered" value={stats.cities} prefix={<EnvironmentOutlined />} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Card className="rounded-2xl shadow-sm">
                                        <Statistic title="Specialties" value={stats.specialties} prefix={<MedicineBoxOutlined />} />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Card className="rounded-2xl shadow-sm">
                                        <Statistic title="Years of Service" value={stats.years} prefix={<TrophyOutlined />} />
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className="py-10 lg:py-14">
                        <div className="mx-auto max-w-6xl px-4">
                            <Row gutter={[24, 24]}>
                                <Col xs={24} lg={12}>
                                    <Card className="h-full rounded-3xl shadow-sm">
                                        <Title level={2}>Our Mission</Title>
                                        <Paragraph className="text-base leading-7 text-slate-600">
                                            To make quality healthcare easier to access by helping patients connect with verified and experienced doctors across locations and specialties.
                                        </Paragraph>
                                        <Paragraph className="text-base leading-7 text-slate-600">
                                            We believe discovering the right doctor should feel clear, transparent, and dependable from the very first search.
                                        </Paragraph>
                                    </Card>
                                </Col>
                                <Col xs={24} lg={12}>
                                    <Card className="h-full rounded-3xl shadow-sm">
                                        <Title level={2}>What We Do</Title>
                                        <Paragraph className="text-base leading-7 text-slate-600">
                                            Hello Doctors provides a modern doctor discovery experience with verified profiles, city-based search, specialty filtering, and support for home care services.
                                        </Paragraph>
                                        <Paragraph className="text-base leading-7 text-slate-600">
                                            We help patients compare options confidently while giving providers a stronger digital presence.
                                        </Paragraph>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    </section>

                    <section className="bg-white py-12 lg:py-14">
                        <div className="mx-auto max-w-6xl px-4">
                            <Title level={2} className="text-center !mb-8">Why Choose Hello Doctors?</Title>
                            <Row gutter={[24, 24]}>
                                {[
                                    ['Verified Profiles', 'All listed profiles are carefully verified so patients can trust the information they see.'],
                                    ['Easy Search', 'Find doctors by name, specialty, or city using a simpler and faster discovery flow.'],
                                    ['Comprehensive Information', 'See qualifications, expertise, locations, and useful patient-facing details at a glance.'],
                                    ['Multiple Cities', 'Browse care options across a growing network of local healthcare markets.'],
                                    ['Various Specialties', 'From general medicine to focused specialty care, the platform supports diverse medical needs.'],
                                    ['Free for Patients', 'Patients can search and compare doctors without added friction or hidden steps.'],
                                ].map(([title, description]) => (
                                    <Col xs={24} md={12} lg={8} key={title}>
                                        <Card hoverable className="h-full rounded-3xl border border-slate-200 shadow-sm">
                                            <Title level={4}>{title}</Title>
                                            <Paragraph className="text-slate-600">{description}</Paragraph>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </section>

                    <section className="py-12">
                        <div className="mx-auto max-w-4xl px-4 text-center">
                            <Card className="rounded-[28px] border-0 bg-gradient-to-r from-sky-600 to-cyan-500 !text-white shadow-xl">
                                <Title level={3} className="!text-white">Ready to find your doctor?</Title>
                                <Paragraph className="mx-auto max-w-2xl !text-sky-50">
                                    Search the directory of verified healthcare professionals and discover care that fits your location and needs.
                                </Paragraph>
                                <Link href="/search" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50">
                                    Search Doctors Now
                                </Link>
                            </Card>
                        </div>
                    </section>
                </div>
            </PublicLayout>
        </>
    );
}
