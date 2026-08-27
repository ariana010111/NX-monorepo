import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt-payload.interface';
import { JWT_SECRET } from './auth.constants';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  // Whatever this returns becomes req.user in every guarded route.
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, isActive: true, deletedAt: null },
      include: { userrole: { include: { role: { include: { rolepermission: { include: { permission: true } } } } } } },
    });
    if (!user) return false;
    const roles = user.userrole.map(({ role }) => role.name === 'SUPER_ADMIN' ? 'SUPERADMIN' : role.name);
    const permissions = user.userrole.flatMap(({ role }) => role.rolepermission.map(({ permission }) => permission.name));
    return { userId: user.id, email: user.email, roles, permissions };
  }
}
