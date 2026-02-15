import { Router, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All analytics routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// GET /overview
// Returns high-level dashboard stats.
// ---------------------------------------------------------------------------
router.get('/overview', async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalApps,
      approvedCount,
      deniedCount,
      flaggedCount,
      fraudDecisions,
    ] = await Promise.all([
      prisma.application.count({
        where: { status: { not: 'ARCHIVED' } },
      }),
      prisma.application.count({ where: { status: 'APPROVED' } }),
      prisma.application.count({ where: { status: 'DENIED' } }),
      prisma.application.count({ where: { status: 'REVIEWED' } }),
      prisma.fraudDecision.findMany({
        select: { overallScore: true },
      }),
    ]);

    const scores = fraudDecisions.map((fd) => fd.overallScore);
    const avgRiskScore =
      scores.length > 0
        ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10
        : 0;

    const fraudDetectionRate =
      totalApps > 0
        ? Math.round(((deniedCount + flaggedCount) / totalApps) * 1000) / 10
        : 0;

    return res.json({
      totalApplications: totalApps,
      approved: approvedCount,
      flagged: flaggedCount,
      denied: deniedCount,
      fraudDetectionRate,
      averageRiskScore: avgRiskScore,
    });
  } catch (err: any) {
    console.error('Analytics overview error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// ---------------------------------------------------------------------------
// GET /by-program
// Breakdown of applications by program type.
// ---------------------------------------------------------------------------
router.get('/by-program', async (_req: AuthRequest, res: Response) => {
  try {
    const byProgram = await prisma.application.groupBy({
      by: ['programType'],
      _count: { id: true },
      where: { status: { not: 'ARCHIVED' } },
    });

    // For each program, get status breakdown
    const programs = await Promise.all(
      byProgram.map(async (group) => {
        const statuses = await prisma.application.groupBy({
          by: ['status'],
          _count: { id: true },
          where: {
            programType: group.programType,
            status: { not: 'ARCHIVED' },
          },
        });

        const statusBreakdown: Record<string, number> = {};
        for (const s of statuses) {
          statusBreakdown[s.status] = s._count.id;
        }

        // Average risk score for this program
        const decisions = await prisma.fraudDecision.findMany({
          where: {
            application: {
              programType: group.programType,
              status: { not: 'ARCHIVED' },
            },
          },
          select: { overallScore: true },
        });

        const scores = decisions.map((d) => d.overallScore);
        const avgScore =
          scores.length > 0
            ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10
            : 0;

        return {
          programType: group.programType,
          total: group._count.id,
          statusBreakdown,
          averageRiskScore: avgScore,
        };
      }),
    );

    return res.json(programs);
  } catch (err: any) {
    console.error('Analytics by-program error:', err);
    return res.status(500).json({ error: 'Failed to fetch program analytics' });
  }
});

// ---------------------------------------------------------------------------
// GET /risk-distribution
// Histogram of risk scores in buckets: 0-25, 26-50, 51-75, 76-100.
// ---------------------------------------------------------------------------
router.get('/risk-distribution', async (_req: AuthRequest, res: Response) => {
  try {
    const decisions = await prisma.fraudDecision.findMany({
      select: { overallScore: true },
    });

    const buckets = {
      '0-25': 0,
      '26-50': 0,
      '51-75': 0,
      '76-100': 0,
    };

    for (const d of decisions) {
      const score = d.overallScore;
      if (score <= 25) {
        buckets['0-25']++;
      } else if (score <= 50) {
        buckets['26-50']++;
      } else if (score <= 75) {
        buckets['51-75']++;
      } else {
        buckets['76-100']++;
      }
    }

    return res.json({
      distribution: [
        { range: '0-25', label: 'Low Risk', count: buckets['0-25'] },
        { range: '26-50', label: 'Medium Risk', count: buckets['26-50'] },
        { range: '51-75', label: 'High Risk', count: buckets['51-75'] },
        { range: '76-100', label: 'Critical Risk', count: buckets['76-100'] },
      ],
      total: decisions.length,
    });
  } catch (err: any) {
    console.error('Analytics risk-distribution error:', err);
    return res.status(500).json({ error: 'Failed to fetch risk distribution' });
  }
});

// ---------------------------------------------------------------------------
// GET /recent-flags
// Recent fraud signals extracted from ScreeningResults that have flags.
// ---------------------------------------------------------------------------
router.get('/recent-flags', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit as string, 10) || 20);

    const flaggedResults = await prisma.screeningResult.findMany({
      where: {
        NOT: { flags: { equals: Prisma.JsonNull } },
        status: 'COMPLETED',
      },
      include: {
        application: {
          select: {
            id: true,
            applicantFirstName: true,
            applicantLastName: true,
            applicantEmail: true,
            programType: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Flatten the flags into individual signal entries
    const recentFlags = flaggedResults
      .map((sr: any) => {
        const flags = sr.flags as any;
        // flags might be an array of signals or an object with summary data
        const flagList = Array.isArray(flags) ? flags : [];
        return flagList.map((flag: any) => ({
          screeningResultId: sr.id,
          applicationId: sr.applicationId,
          applicantName: `${sr.application.applicantFirstName} ${sr.application.applicantLastName}`,
          applicantEmail: sr.application.applicantEmail,
          programType: sr.application.programType,
          applicationStatus: sr.application.status,
          type: sr.type,
          flag,
          detectedAt: sr.createdAt,
        }));
      })
      .flat()
      .slice(0, limit);

    return res.json(recentFlags);
  } catch (err: any) {
    console.error('Analytics recent-flags error:', err);
    return res.status(500).json({ error: 'Failed to fetch recent flags' });
  }
});

// ---------------------------------------------------------------------------
// GET /trends
// Applications per day for the last 30 days.
// ---------------------------------------------------------------------------
router.get('/trends', async (_req: AuthRequest, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const applications = await prisma.application.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { not: 'ARCHIVED' },
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Bucket by date string
    const dailyMap: Record<string, { total: number; approved: number; denied: number; flagged: number }> = {};

    // Pre-fill all 30 days so the chart has no gaps
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = { total: 0, approved: 0, denied: 0, flagged: 0 };
    }

    for (const app of applications) {
      const key = app.createdAt.toISOString().split('T')[0];
      if (!dailyMap[key]) {
        dailyMap[key] = { total: 0, approved: 0, denied: 0, flagged: 0 };
      }
      dailyMap[key].total++;
      if (app.status === 'APPROVED') dailyMap[key].approved++;
      if (app.status === 'DENIED') dailyMap[key].denied++;
      if (app.status === 'REVIEWED') dailyMap[key].flagged++;
    }

    const trends = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date,
        ...counts,
      }));

    return res.json(trends);
  } catch (err: any) {
    console.error('Analytics trends error:', err);
    return res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

export default router;
