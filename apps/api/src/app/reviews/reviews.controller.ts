import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Public: anyone browsing a PDP sees approved reviews, no login needed.
  @Public()
  @Get('product/:productId')
  @ApiOkResponse({ type: ReviewResponseDto, isArray: true })
  listForProduct(@Param('productId') productId: string) {
    return this.reviewsService.listApprovedForProduct(productId);
  }

  // Requires real auth — no @Public() here. A review is tied to the
  // authenticated user's id, not a client-supplied one, so there's no way
  // to submit a review as someone else.
  @ApiBearerAuth()
  @Post()
  @ApiCreatedResponse({ type: ReviewResponseDto })
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reviewsService.create(dto, user);
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiBearerAuth()
  @Get()
  @ApiOkResponse({ type: ReviewResponseDto, isArray: true })
  listForModeration() {
    return this.reviewsService.listAllForModeration();
  }

  @Roles('SUPER_ADMIN', 'ADMIN', 'STAFF')
  @ApiBearerAuth()
  @Patch(':id/moderate')
  @ApiOkResponse({ type: ReviewResponseDto })
  moderate(@Param('id') id: string, @Body() dto: ModerateReviewDto) {
    return this.reviewsService.moderate(id, dto.status);
  }
}
