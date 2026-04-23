import { useEffect, useRef } from 'react';

/**
 * Custom hook to load and use Google reCAPTCHA v3
 * @param {string} siteKey - reCAPTCHA site key from config
 * @returns {object} Object with executeRecaptcha function and isLoaded state
 */
export function useGoogleReCAPTCHA(siteKey) {
    const reCaptchaLoaded = useRef(false);
    const reCaptchaRef = useRef(null);

    useEffect(() => {
        if (!siteKey || reCaptchaLoaded.current) {
            return;
        }

        // Load reCAPTCHA script
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js';
        script.async = true;
        script.defer = true;

        script.onload = () => {
            reCaptchaLoaded.current = true;
            reCaptchaRef.current = window.grecaptcha;
        };

        script.onerror = () => {
            console.error('Failed to load reCAPTCHA script');
        };

        document.head.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [siteKey]);

    const executeRecaptcha = async (action = '') => {
        if (!reCaptchaRef.current) {
            console.error('reCAPTCHA not loaded');
            return null;
        }

        try {
            const token = await reCaptchaRef.current.execute(siteKey, { action });
            return token;
        } catch (error) {
            console.error('reCAPTCHA execution failed:', error);
            return null;
        }
    };

    return {
        executeRecaptcha,
        isLoaded: reCaptchaLoaded.current,
    };
}
