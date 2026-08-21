import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// Marks a route as exempt from the global JwtAuthGuard — for endpoints
// like login/register or public catalog browsing that must work with no
// token at all.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
