import { Router, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All application routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// POST / - Create a new grant application
// ---------------------------------------------------------------------------
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      programType,
      applicantFirstName,
      applicantLastName,
      applicantEmail,
      applicantPhone,
      applicantSSN,
      applicantDOB,
      applicantAddress1,
      applicantAddress2,
      applicantCity,
      applicantState,
      applicantZip,
      requestedAmount,
      projectDescription,
      propertyAddress,
    } = req.body;

    if (!programType || !applicantFirstName || !applicantLastName || !applicantEmail) {
      return res.status(400).json({
        error: 'programType, applicantFirstName, applicantLastName, and applicantEmail are required',
      });
    }

    const application = await prisma.application.create({
      data: {
        programType,
        status: 'PENDING',
        applicantFirstName,
        applicantLastName,
        applicantEmail,
        applicantPhone: applicantPhone || null,
        applicantSSN: applicantSSN || null,
        applicantDOB: applicantDOB ? new Date(applicantDOB) : null,
        applicantAddress1: applicantAddress1 || null,
        applicantAddress2: applicantAddress2 || null,
        applicantCity: applicantCity || null,
        applicantState: applicantState || null,
        applicantZip: applicantZip || null,
        requestedAmount: requestedAmount ? parseFloat(requestedAmount) : null,
        projectDescription: projectDescription || null,
        propertyAddress: propertyAddress || null,
        ipAddress: req.ip || null,
      },
    });

    return res.status(201).json(application);
  } catch (err: any) {
    console.error('Create application error:', err);
    return res.status(500).json({ error: 'Failed to create application' });
  }
});

// ---------------------------------------------------------------------------
// GET / - List all applications with filters, search, and pagination
// ---------------------------------------------------------------------------
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      status,
      riskLevel,
      programType,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build dynamic where clause
    const where: Prisma.ApplicationWhereInput = {};

    if (status && status !== 'all') {
      where.status = status as any;
    }

    if (programType && programType !== 'all') {
      where.programType = programType as any;
    }

    // Exclude archived by default unless explicitly requested
    if (!status) {
      where.status = { not: 'ARCHIVED' };
    }

    // Risk level filter goes through the fraud decision relation
    if (riskLevel && riskLevel !== 'all') {
      where.fraudDecision = {
        overallRisk: riskLevel as string,
      };
    }

    // Search by name or email
    if (search) {
      const term = search as string;
      where.OR = [
        { applicantFirstName: { contains: term, mode: 'insensitive' } },
        { applicantLastName: { contains: term, mode: 'insensitive' } },
        { applicantEmail: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          fraudDecision: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.application.count({ where }),
    ]);

    return res.json({
      data: applications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err: any) {
    console.error('List applications error:', err);
    return res.status(500).json({ error: 'Failed to list applications' });
  }
});

// ---------------------------------------------------------------------------
// GET /:id - Get a single application with screening results and fraud decision
// ---------------------------------------------------------------------------
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        screeningResults: {
          orderBy: { createdAt: 'desc' },
        },
        fraudDecision: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    return res.json(application);
  } catch (err: any) {
    console.error('Get application error:', err);
    return res.status(500).json({ error: 'Failed to get application' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /:id - Update status, notes, or override decision
// ---------------------------------------------------------------------------
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, overriddenBy, overrideReason } = req.body;

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Build update payload for the application
    const appUpdate: Prisma.ApplicationUpdateInput = {};
    if (status) {
      appUpdate.status = status;
    }
    if (notes !== undefined) {
      appUpdate.notes = notes;
    }
    if (status === 'APPROVED' || status === 'DENIED' || status === 'REVIEWED') {
      appUpdate.reviewedBy = req.userId;
      appUpdate.reviewedAt = new Date();
    }

    const application = await prisma.application.update({
      where: { id },
      data: appUpdate,
      include: { fraudDecision: true },
    });

    // If override fields are provided, update the fraud decision
    if ((overriddenBy || overrideReason) && application.fraudDecision) {
      await prisma.fraudDecision.update({
        where: { id: application.fraudDecision.id },
        data: {
          overriddenBy: overriddenBy || req.userId,
          overrideReason: overrideReason || null,
          recommendation: status === 'APPROVED' ? 'APPROVE' : status === 'DENIED' ? 'DENY' : 'REVIEW',
        },
      });
    }

    // Re-fetch with updated relations
    const updated = await prisma.application.findUnique({
      where: { id },
      include: {
        screeningResults: { orderBy: { createdAt: 'desc' } },
        fraudDecision: true,
      },
    });

    return res.json(updated);
  } catch (err: any) {
    console.error('Update application error:', err);
    return res.status(500).json({ error: 'Failed to update application' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /:id - Soft delete (set status to ARCHIVED)
// ---------------------------------------------------------------------------
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await prisma.application.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return res.json({ message: 'Application archived successfully' });
  } catch (err: any) {
    console.error('Delete application error:', err);
    return res.status(500).json({ error: 'Failed to archive application' });
  }
});

export default router;
