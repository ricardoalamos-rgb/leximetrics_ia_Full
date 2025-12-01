import * as Sentry from '@sentry/node';

const SENTRY_DSN = process.env.SENTRY_DSN;

export function initSentry() {
    if (!SENTRY_DSN) {
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: 0.2, // ajusta según tráfico
    });
}
