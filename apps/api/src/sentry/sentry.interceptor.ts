import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>() as any;

        return next.handle().pipe(
            catchError((error) => {
                // Only capture if Sentry is initialized
                if (process.env.SENTRY_DSN) {
                    Sentry.withScope((scope) => {
                        scope.setTag('path', request?.url);
                        scope.setTag('method', request?.method);
                        const user = (request as any).user;
                        if (user) {
                            scope.setUser({
                                id: user.id,
                                email: user.email,
                                // tenantId might be directly on user or via decorator logic, 
                                // but usually request.user has it if JwtStrategy puts it there.
                                // We'll assume it's there or map it if needed.
                                username: user.tenantId ? `tenant:${user.tenantId}` : undefined,
                            });
                            if (user.tenantId) {
                                scope.setTag('tenantId', user.tenantId);
                            }
                        }
                        Sentry.captureException(error);
                    });
                }
                throw error;
            }),
        );
    }
}
