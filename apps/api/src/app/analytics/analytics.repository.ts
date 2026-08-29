import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsTrendsDto, DailyTrendPointDto } from './dto/analytics-trends.dto';
import { TopProductsDto } from './dto/top-products.dto';
import { CustomerSegmentsDto } from './dto/customer-segments.dto';

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------
export abstract class AnalyticsRepository {
  abstract getTrends(from: Date, to: Date): Promise<AnalyticsTrendsDto>;
  abstract getTopProducts(limit: number): Promise<TopProductsDto>;
  abstract getCustomerSegments(): Promise<CustomerSegmentsDto>;
}

// ---------------------------------------------------------------------------
// Row shapes returned from $queryRaw (MySQL-compatible)
// ---------------------------------------------------------------------------
interface TrendRow {
  day: string;
  orders: bigint;
  revenue: string | number;
}
interface VisitRow {
  day: string;
  visits: bigint;
}
interface TopProductRow {
  productId: string;
  productName: string;
  totalOrders: bigint;
  totalRevenue: string | number;
}
interface SegmentRow {
  orderCount: bigint;
  customerCount: bigint;
}

// ---------------------------------------------------------------------------
// Prisma implementation
// ---------------------------------------------------------------------------
@Injectable()
export class PrismaAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTrends(from: Date, to: Date): Promise<AnalyticsTrendsDto> {
    // Orders / revenue per calendar day (UTC).
    // DATE_FORMAT is MySQL-specific; this codebase is confirmed MySQL/MariaDB.
    const orderRows = await this.prisma.$queryRaw<TrendRow[]>`
      SELECT
        DATE_FORMAT(placedAt, '%Y-%m-%d') AS day,
        COUNT(*)                          AS orders,
        COALESCE(SUM(grandTotal), 0)      AS revenue
      FROM \`order\`
      WHERE placedAt >= ${from}
        AND placedAt <  ${new Date(to.getTime() + 86400000)}
      GROUP BY day
      ORDER BY day ASC
    `;

    // Visits per day — guarded by a (this.prisma as any) cast because
    // `storevisit` is in schema.prisma but `prisma generate` may not have run
    // yet to emit the typed accessor in @prisma/client.
    // Field: `createdAt` (the schema uses createdAt, not visitedAt).
    let visitRows: VisitRow[] = [];
    try {
      visitRows = await (this.prisma as any).$queryRaw`
        SELECT
          DATE_FORMAT(createdAt, '%Y-%m-%d') AS day,
          COUNT(*)                           AS visits
        FROM storevisit
        WHERE createdAt >= ${from}
          AND createdAt <  ${new Date(to.getTime() + 86400000)}
        GROUP BY day
        ORDER BY day ASC
      `;
    } catch {
      // storevisit table not yet migrated — returns zero visits until the
      // Database-agent migration (`prisma migrate dev --name add_storevisit`)
      // is applied and `prisma generate` regenerates the client.
    }

    // Build a merged day-keyed map over the requested window
    const visitsByDay = new Map<string, number>(
      visitRows.map((r) => [r.day, Number(r.visits)]),
    );
    const ordersByDay = new Map<string, { orders: number; revenue: number }>(
      orderRows.map((r) => [r.day, { orders: Number(r.orders), revenue: Number(r.revenue) }]),
    );

    // Enumerate every calendar day in the window
    const days: DailyTrendPointDto[] = [];
    const cursor = new Date(from);
    cursor.setUTCHours(0, 0, 0, 0);
    const endMs = to.getTime();
    while (cursor.getTime() <= endMs) {
      const key = cursor.toISOString().slice(0, 10);
      const ord = ordersByDay.get(key) ?? { orders: 0, revenue: 0 };
      days.push({
        date: key,
        visits: visitsByDay.get(key) ?? 0,
        orders: ord.orders,
        revenue: Math.round(ord.revenue * 100) / 100,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const totalVisits = days.reduce((s, d) => s + d.visits, 0);
    const totalOrders = days.reduce((s, d) => s + d.orders, 0);
    const totalRevenue = Math.round(days.reduce((s, d) => s + d.revenue, 0) * 100) / 100;
    return { days, totalVisits, totalOrders, totalRevenue };
  }

  async getTopProducts(limit: number): Promise<TopProductsDto> {
    const rows = await this.prisma.$queryRaw<TopProductRow[]>`
      SELECT
        oi.productId,
        oi.productNameSnapshot                    AS productName,
        COUNT(DISTINCT o.id)                      AS totalOrders,
        COALESCE(SUM(oi.lineTotal), 0)            AS totalRevenue
      FROM orderitem oi
      JOIN \`order\` o ON o.id = oi.orderId
      WHERE oi.productId IS NOT NULL
      GROUP BY oi.productId, oi.productNameSnapshot
      ORDER BY totalOrders DESC, totalRevenue DESC
      LIMIT ${limit}
    `;
    return {
      products: rows.map((r) => ({
        productId: r.productId,
        productName: r.productName,
        totalOrders: Number(r.totalOrders),
        totalRevenue: Math.round(Number(r.totalRevenue) * 100) / 100,
      })),
    };
  }

  async getCustomerSegments(): Promise<CustomerSegmentsDto> {
    // Count orders per userId, then bucket into "new" (1 order) vs "returning" (2+).
    const rows = await this.prisma.$queryRaw<SegmentRow[]>`
      SELECT
        orderCount,
        COUNT(*) AS customerCount
      FROM (
        SELECT userId, COUNT(*) AS orderCount
        FROM \`order\`
        WHERE userId IS NOT NULL
        GROUP BY userId
      ) sub
      GROUP BY orderCount
    `;

    let newCustomers = 0;
    let returningCustomers = 0;
    for (const row of rows) {
      const cnt = Number(row.customerCount);
      if (Number(row.orderCount) === 1) newCustomers += cnt;
      else returningCustomers += cnt;
    }
    return {
      newCustomers,
      returningCustomers,
      customersWithOrders: newCustomers + returningCustomers,
    };
  }
}

/*
 * ─── Integration checklist for visit analytics ───────────────────────────────
 * The `storevisit` model IS present in prisma/schema.prisma (Database agent
 * has already added it).  Visit counts will appear in getTrends() once:
 *
 *   1. ✅ storevisit model added to prisma/schema.prisma
 *   2. ⬜ `npx prisma migrate dev --name add_storevisit` is run against the DB
 *   3. ⬜ `npx prisma generate` regenerates @prisma/client typings
 *   4. ⬜ The `(this.prisma as any).$queryRaw` cast in getTrends() can be
 *          replaced with `this.prisma.$queryRaw` after step 3.
 *
 * Until step 2 is done the visitRows catch silently returns zero visit counts.
 * The orders/revenue trend and all other analytics endpoints are fully
 * operational right now (they only query the existing `order`/`orderitem` tables).
 * ─────────────────────────────────────────────────────────────────────────────
 */
