import { Controller, Post, Body, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { VisitsService } from './visits.service';
import { RecordVisitDto } from './dto/record-visit.dto';
import { VisitResponseDto } from './dto/visit-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('visits')
@Controller('visits')
export class VisitsController {
  private readonly logger = new Logger(VisitsController.name);
  constructor(private readonly visitsService: VisitsService) {}

  /**
   * Records a storefront page visit.
   * Uses @Public() + OptionalJwtAuthGuard so that:
   *  - Unauthenticated / guest visitors are accepted without a token.
   *  - Authenticated customers have their userId attached automatically.
   *
   * The client is responsible for sending path and an opaque sessionId that
   * it persists in a first-party cookie — the server never reads cookies
   * directly so no cookie-parsing middleware is required.
   */
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Record a first-party storefront page visit' })
  @ApiCreatedResponse({ type: VisitResponseDto })
  record(
    @Body() dto: RecordVisitDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Req() req: Request,
  ): Promise<VisitResponseDto> {
    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? undefined;
    this.logger.log(`POST /visits path=${dto.path}`);
    return this.visitsService.record(dto, user?.userId, ip);
  }
}
