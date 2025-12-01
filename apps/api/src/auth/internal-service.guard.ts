import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalServiceGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            return false;
        }

        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            return false;
        }

        // Validate against env var
        // In production, use a more robust check or rotation mechanism
        const validToken = process.env.SCRAPER_SERVICE_TOKEN || process.env.INTERNAL_SERVICE_TOKEN;

        if (!validToken) {
            // If no token configured, fail safe
            return false;
        }

        return token === validToken;
    }
}
