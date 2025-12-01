import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@leximetrics/db';

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string;
}

export const CurrentUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return null;
        }

        return data ? user[data] : user;
    },
);
