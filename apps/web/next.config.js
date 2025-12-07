/** @type {import('next').NextConfig} */
// const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
    output: "standalone",
    transpilePackages: ['@leximetrics/db'],
    async rewrites() {
        const jarvisUrl = process.env.JARVIS_BACKEND_URL || 'https://jarvis-service-production.up.railway.app';

        console.log('Rewriting /ai to:', jarvisUrl);

        return [
            {
                source: '/ai/:path*',
                destination: `${jarvisUrl}/:path*`,
            },
        ];
    },
};

// module.exports = withSentryConfig(
//     nextConfig,
//     {
//         // For all available options, see:
//         // https://github.com/getsentry/sentry-webpack-plugin#options
// 
//         // Suppresses source map uploading logs during build
//         silent: true,
//         org: "leximetrics",
//         project: "leximetrics-web",
//     },
//     {
//         // For all available options, see:
//         // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
// 
//         // Upload a larger set of source maps for prettier stack traces (increases build time)
//         widenClientFileUpload: true,
// 
//         // Transpiles SDK to be compatible with IE11 (increases bundle size)
//         transpileClientSDK: true,
// 
//         // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
//         tunnelRoute: "/monitoring",
// 
//         // Hides source maps from generated client bundles
//         hideSourceMaps: true,
// 
//         // Automatically tree-shake Sentry logger statements to reduce bundle size
//         disableLogger: true,
//     }
// );
module.exports = nextConfig;
