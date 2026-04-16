import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

export default function PublicLayout({ auth, title, children, pageClassName = 'index-page' }) {
    const { site = {} } = usePage().props;
    const siteName = site?.name || 'Hello Doctors';
    const siteFavicon = site?.favicon || null;
    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const loadScript = (src) => new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${src}"]`);

            if (existing) {
                if (existing.dataset.loaded === 'true') {
                    resolve();
                    return;
                }

                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.dataset.loaded = 'false';
            script.onload = () => {
                script.dataset.loaded = 'true';
                resolve();
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });

        const revealAnimatedContent = () => {
            document.querySelectorAll('[data-aos]').forEach((element) => {
                element.classList.add('aos-animate');
                element.style.opacity = '1';
                element.style.transform = 'none';
            });
        };

        const toggleScrollState = () => {
            document.body.classList.toggle('scrolled', window.scrollY > 20);

            const scrollTop = document.getElementById('scroll-top');
            if (scrollTop) {
                scrollTop.classList.toggle('active', window.scrollY > 100);
            }
        };

        const removePreloader = () => {
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.remove();
            }
        };

        let lightboxInstance;
        const swiperInstances = [];

        const initSwipers = () => {
            if (!window.Swiper) {
                return;
            }

            document.querySelectorAll('.init-swiper').forEach((element) => {
                if (element.dataset.swiperInitialized === 'true') {
                    return;
                }

                let config = {};
                const configElement = element.querySelector('.swiper-config');

                if (configElement?.textContent) {
                    try {
                        config = JSON.parse(configElement.textContent);
                    } catch {
                        config = {};
                    }
                }

                const paginationEl = element.querySelector('.swiper-pagination');
                if (config.pagination?.el === '.swiper-pagination' && paginationEl) {
                    config.pagination = { ...config.pagination, el: paginationEl };
                }

                const swiper = new window.Swiper(element, config);
                swiperInstances.push(swiper);
                element.dataset.swiperInitialized = 'true';
            });
        };

        Promise.allSettled([
            loadScript('/clinic-theme/vendor/bootstrap/js/bootstrap.bundle.min.js'),
            loadScript('/clinic-theme/vendor/aos/aos.js'),
            loadScript('/clinic-theme/vendor/glightbox/js/glightbox.min.js'),
            loadScript('/clinic-theme/vendor/purecounter/purecounter_vanilla.js'),
            loadScript('/clinic-theme/vendor/swiper/swiper-bundle.min.js'),
        ]).then(() => {
            revealAnimatedContent();

            if (window.AOS) {
                window.AOS.init({
                    duration: 600,
                    easing: 'ease-in-out',
                    once: true,
                    mirror: false,
                });
            }

            if (window.GLightbox) {
                lightboxInstance = window.GLightbox({ selector: '.glightbox' });
            }

            if (window.PureCounter) {
                try {
                    new window.PureCounter();
                } catch {
                    // no-op fallback
                }
            }

            initSwipers();
            toggleScrollState();
            removePreloader();
        });

        window.addEventListener('scroll', toggleScrollState);
        window.addEventListener('load', removePreloader);

        return () => {
            window.removeEventListener('scroll', toggleScrollState);
            window.removeEventListener('load', removePreloader);
            lightboxInstance?.destroy?.();
            swiperInstances.forEach((swiper) => swiper?.destroy?.(true, true));
        };
    }, []);

    return (
        <>
            <Head title={title || siteName}>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                {siteFavicon && <link rel="icon" href={siteFavicon} head-key="site-favicon" />}
                {siteFavicon && <link rel="shortcut icon" href={siteFavicon} head-key="site-shortcut-favicon" />}
                {siteFavicon && <link rel="apple-touch-icon" href={siteFavicon} head-key="site-apple-touch-icon" />}

                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap"
                    rel="stylesheet"
                />

                <link href="/clinic-theme/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet" />
                <link href="/clinic-theme/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet" />
                <link href="/clinic-theme/vendor/aos/aos.css" rel="stylesheet" />
                <link href="/clinic-theme/vendor/glightbox/css/glightbox.min.css" rel="stylesheet" />
                <link href="/clinic-theme/vendor/fontawesome-free/css/all.min.css" rel="stylesheet" />
                <link href="/clinic-theme/vendor/swiper/swiper-bundle.min.css" rel="stylesheet" />
                <link href="/clinic-theme/main.css" rel="stylesheet" />
            </Head>

            <div className={pageClassName}>
                <Header auth={auth} />

                <main className="main">
                    {children}
                </main>

                <Footer />

                <a href="#" id="scroll-top" className="scroll-top d-flex align-items-center justify-content-center">
                    <i className="bi bi-arrow-up-short" />
                </a>
                <div id="preloader" />
            </div>
        </>
    );
}
