<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- SEO Meta Tags -->
        @php
            $seoSettings = App\Models\SiteSetting::where('group', 'seo')->get()->pluck('value', 'key');
        @endphp
        
        <meta name="description" content="{{ $seoSettings['meta_description'] ?? 'Find the best doctors and healthcare professionals' }}">
        <meta name="keywords" content="{{ $seoSettings['meta_keywords'] ?? 'doctors, healthcare, medical' }}">
        <meta name="author" content="{{ $seoSettings['meta_author'] ?? config('app.name') }}">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta property="og:title" content="{{ $seoSettings['og_title'] ?? config('app.name') }}">
        <meta property="og:description" content="{{ $seoSettings['og_description'] ?? 'Find the best doctors' }}">
        @if(isset($seoSettings['og_image']) && $seoSettings['og_image'])
        <meta property="og:image" content="{{ $seoSettings['og_image'] }}">
        @endif
        
        <!-- Twitter -->
        <meta name="twitter:card" content="{{ $seoSettings['twitter_card'] ?? 'summary_large_image' }}">
        @if(isset($seoSettings['twitter_site']) && $seoSettings['twitter_site'])
        <meta name="twitter:site" content="{{ $seoSettings['twitter_site'] }}">
        @endif
        
        <!-- Canonical URL -->
        <link rel="canonical" href="{{ url()->current() }}">
        
        <!-- Google Analytics -->
        @if(isset($seoSettings['google_analytics_id']) && $seoSettings['google_analytics_id'])
        <script async src="https://www.googletagmanager.com/gtag/js?id={{ $seoSettings['google_analytics_id'] }}"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '{{ $seoSettings['google_analytics_id'] }}');
        </script>
        @endif
        
        <!-- Google Site Verification -->
        @if(isset($seoSettings['google_site_verification']) && $seoSettings['google_site_verification'])
        <meta name="google-site-verification" content="{{ $seoSettings['google_site_verification'] }}">
        @endif
        
        <!-- Facebook Pixel -->
        @if(isset($seoSettings['facebook_pixel_id']) && $seoSettings['facebook_pixel_id'])
        <script>
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '{{ $seoSettings['facebook_pixel_id'] }}');
            fbq('track', 'PageView');
        </script>
        <noscript>
            <img height="1" width="1" style="display:none"
                 src="https://www.facebook.com/tr?id={{ $seoSettings['facebook_pixel_id'] }}&ev=PageView&noscript=1"/>
        </noscript>
        @endif

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
