import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding GrantShield database...');

  // Create admin user
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@grantshield.gov' },
    update: {},
    create: {
      email: 'admin@grantshield.gov',
      passwordHash,
      name: 'Sarah Chen',
      role: 'ADMIN',
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@grantshield.gov' },
    update: {},
    create: {
      email: 'reviewer@grantshield.gov',
      passwordHash,
      name: 'James Miller',
      role: 'REVIEWER',
    },
  });
  console.log(`Reviewer user created: ${reviewer.email}`);

  // Seed applications with varying risk levels
  const applications = [
    // 5 APPROVED (low risk)
    {
      programType: 'SOLAR_REBATE' as const,
      status: 'APPROVED' as const,
      applicantFirstName: 'Miranda',
      applicantLastName: 'Juniper',
      applicantEmail: 'miranda.juniper@gmail.com',
      applicantPhone: '4786251234',
      applicantDOB: new Date('1955-11-13'),
      applicantAddress1: '1678 NE 41ST',
      applicantCity: 'ATLANTA',
      applicantState: 'GA',
      applicantZip: '30302',
      requestedAmount: 12000,
      projectDescription: 'Installation of 20-panel solar array on residential rooftop',
      reviewedBy: admin.id,
      reviewedAt: new Date('2026-02-10'),
    },
    {
      programType: 'EV_CREDIT' as const,
      status: 'APPROVED' as const,
      applicantFirstName: 'Peggy',
      applicantLastName: 'Graves',
      applicantEmail: 'peggy.graves@outlook.com',
      applicantPhone: '8644613780',
      applicantDOB: new Date('1958-09-09'),
      applicantAddress1: '248 HOOD RD',
      applicantCity: 'CHESNEE',
      applicantState: 'SC',
      applicantZip: '29323',
      requestedAmount: 7500,
      projectDescription: 'Purchase of Tesla Model 3 for daily commute',
      reviewedBy: admin.id,
      reviewedAt: new Date('2026-02-09'),
    },
    {
      programType: 'WEATHERIZATION' as const,
      status: 'APPROVED' as const,
      applicantFirstName: 'Crystal',
      applicantLastName: 'Goodley',
      applicantEmail: 'crystal.goodley@yahoo.com',
      applicantPhone: '2524735295',
      applicantDOB: new Date('1949-03-23'),
      applicantAddress1: '338 POND RD #716',
      applicantCity: 'WANCHESE',
      applicantState: 'NC',
      applicantZip: '27981',
      requestedAmount: 8500,
      projectDescription: 'Full home insulation upgrade and window replacement',
      reviewedBy: reviewer.id,
      reviewedAt: new Date('2026-02-08'),
    },
    {
      programType: 'HEAT_PUMP' as const,
      status: 'APPROVED' as const,
      applicantFirstName: 'Hasan',
      applicantLastName: 'Gidi',
      applicantEmail: 'hasan.gidi@gmail.com',
      applicantPhone: '6105880643',
      applicantDOB: new Date('1963-10-02'),
      applicantAddress1: '4357A MARTINS CREEK BELVIDER',
      applicantCity: 'BANGOR',
      applicantState: 'PA',
      applicantZip: '18013',
      requestedAmount: 6000,
      projectDescription: 'Heat pump installation for residential heating/cooling',
      reviewedBy: admin.id,
      reviewedAt: new Date('2026-02-07'),
    },
    {
      programType: 'CLEAN_ENERGY_BUSINESS' as const,
      status: 'APPROVED' as const,
      applicantFirstName: 'John',
      applicantLastName: 'Cope',
      applicantEmail: 'john.cope@copebusiness.com',
      applicantPhone: '5105811251',
      applicantDOB: new Date('1973-08-01'),
      applicantAddress1: '511 SYCAMORE AVE',
      applicantCity: 'HAYWARD',
      applicantState: 'CA',
      applicantZip: '94544',
      requestedAmount: 35000,
      projectDescription: 'Solar panel installation for small business warehouse',
      reviewedBy: admin.id,
      reviewedAt: new Date('2026-02-06'),
    },
    // 5 FLAGGED FOR REVIEW (medium risk) — FlexID sandbox personas reused with different programs
    {
      programType: 'EV_CREDIT' as const,
      status: 'REVIEWED' as const,
      applicantFirstName: 'MIRANDA',
      applicantLastName: 'JJUNIPER',
      applicantEmail: 'miranda.juniper.review@gmail.com',
      applicantPhone: '4786251234',
      applicantDOB: new Date('1955-11-13'),
      applicantSSN: '540325127',
      applicantAddress1: '1678 NE 41ST',
      applicantCity: 'ATLANTA',
      applicantState: 'GA',
      applicantZip: '30302',
      requestedAmount: 7500,
      projectDescription: 'Purchase of Chevrolet Bolt EV for daily commute',
    },
    {
      programType: 'HEAT_PUMP' as const,
      status: 'REVIEWED' as const,
      applicantFirstName: 'PEGGY',
      applicantLastName: 'GRAVES',
      applicantEmail: 'peggy.graves.review@outlook.com',
      applicantPhone: '8644613780',
      applicantDOB: new Date('1958-09-09'),
      applicantAddress1: '248 HOOD RD',
      applicantCity: 'CHESNEE',
      applicantState: 'SC',
      applicantZip: '29323',
      requestedAmount: 6500,
      projectDescription: 'Air-source heat pump replacement for aging HVAC',
    },
    {
      programType: 'SOLAR_REBATE' as const,
      status: 'REVIEWED' as const,
      applicantFirstName: 'CRYSTAL',
      applicantLastName: 'GOODLEY',
      applicantEmail: 'crystal.goodley.review@yahoo.com',
      applicantPhone: '2524735295',
      applicantDOB: new Date('1949-03-23'),
      applicantAddress1: '338 POND RD #716',
      applicantCity: 'WANCHESE',
      applicantState: 'NC',
      applicantZip: '27981',
      requestedAmount: 14000,
      projectDescription: 'Rooftop solar array for coastal residence',
    },
    {
      programType: 'CLEAN_ENERGY_BUSINESS' as const,
      status: 'REVIEWED' as const,
      applicantFirstName: 'HASAN',
      applicantLastName: 'GIDI',
      applicantEmail: 'hasan.gidi.review@gmail.com',
      applicantPhone: '6105880643',
      applicantDOB: new Date('1963-10-02'),
      applicantAddress1: '4357A MARTINS CREEK BELVIDER',
      applicantCity: 'BANGOR',
      applicantState: 'PA',
      applicantZip: '18013',
      requestedAmount: 42000,
      projectDescription: 'Commercial solar installation for retail storefront',
    },
    {
      programType: 'WEATHERIZATION' as const,
      status: 'REVIEWED' as const,
      applicantFirstName: 'JOHN',
      applicantLastName: 'COPE',
      applicantEmail: 'john.cope.review@copebusiness.com',
      applicantPhone: '5105811251',
      applicantSSN: '574709961',
      applicantDOB: new Date('1973-08-01'),
      applicantAddress1: '511 SYCAMORE AVE',
      applicantCity: 'HAYWARD',
      applicantState: 'CA',
      applicantZip: '94544',
      requestedAmount: 9500,
      projectDescription: 'Home insulation and window sealing for older property',
    },
    // 3 DENIED (high risk) — FraudFinder (AtData) sandbox test persona
    {
      programType: 'SOLAR_REBATE' as const,
      status: 'DENIED' as const,
      applicantFirstName: 'John',
      applicantLastName: 'Doe',
      applicantEmail: 'test@example.com',
      applicantPhone: '5551234567',
      applicantDOB: new Date('1988-01-01'),
      applicantAddress1: '123 Main Street',
      applicantCity: 'Anytown',
      applicantState: 'CA',
      applicantZip: '90210',
      requestedAmount: 25000,
      projectDescription: 'Solar installation',
      ipAddress: '1.2.3.4',
      reviewedBy: admin.id,
      reviewedAt: new Date('2026-02-12'),
    },
    {
      programType: 'CLEAN_ENERGY_BUSINESS' as const,
      status: 'DENIED' as const,
      applicantFirstName: 'John',
      applicantLastName: 'Doe',
      applicantEmail: 'test@example.com',
      applicantPhone: '5551234567',
      applicantDOB: new Date('1988-01-01'),
      applicantAddress1: '123 Main Street',
      applicantCity: 'Anytown',
      applicantState: 'CA',
      applicantZip: '90210',
      requestedAmount: 50000,
      projectDescription: 'Business energy upgrade',
      ipAddress: '1.2.3.4',
      reviewedBy: admin.id,
      reviewedAt: new Date('2026-02-11'),
    },
    {
      programType: 'EV_CREDIT' as const,
      status: 'DENIED' as const,
      applicantFirstName: 'John',
      applicantLastName: 'Doe',
      applicantEmail: 'test@example.com',
      applicantPhone: '5551234567',
      applicantDOB: new Date('1988-01-01'),
      applicantAddress1: '123 Main Street',
      applicantCity: 'Anytown',
      applicantState: 'CA',
      applicantZip: '90210',
      requestedAmount: 7500,
      projectDescription: 'EV purchase',
      reviewedBy: reviewer.id,
      reviewedAt: new Date('2026-02-11'),
    },
  ];

  for (const appData of applications) {
    const app = await prisma.application.create({ data: appData });

    // Create mock screening results for non-pending applications
    if (appData.status !== 'PENDING') {
      const isApproved = appData.status === 'APPROVED';
      const isDenied = appData.status === 'DENIED';

      // Identity screening (FlexID)
      const cviScore = isApproved ? 45 : isDenied ? 12 : 32;
      await prisma.screeningResult.create({
        data: {
          applicationId: app.id,
          type: 'IDENTITY',
          status: 'COMPLETED',
          score: cviScore,
          riskLevel: cviScore >= 40 ? 'low' : cviScore >= 30 ? 'medium' : 'high',
          rawResponse: {
            cviScore,
            verifiedElementSummary: isApproved
              ? { name: true, address: true, ssn: true, dob: true, phone: true, email: true }
              : isDenied
                ? { name: false, address: false, ssn: false, dob: true, phone: false, email: false }
                : { name: true, address: true, ssn: false, dob: true, phone: true, email: false },
            riskIndicators: isDenied
              ? [
                  { code: 'RI01', description: 'SSN issued prior to date of birth', riskLevel: 'high' },
                  { code: 'RI02', description: 'Address is a commercial mail receiving agency', riskLevel: 'medium' },
                ]
              : appData.status === 'REVIEWED'
                ? [{ code: 'RI03', description: 'Phone number is a mobile device', riskLevel: 'low' }]
                : [],
          },
          flags: isDenied
            ? ['SSN mismatch', 'Address verification failed']
            : appData.status === 'REVIEWED'
              ? ['Partial identity match']
              : undefined,
        },
      });

      // Fraud screening (FraudFinder / AtData)
      const fraudScore = isApproved ? 1 : isDenied ? 9 : 4;
      await prisma.screeningResult.create({
        data: {
          applicationId: app.id,
          type: 'FRAUD',
          status: 'COMPLETED',
          score: fraudScore,
          riskLevel: fraudScore <= 2 ? 'low' : fraudScore <= 5 ? 'medium' : 'high',
          rawResponse: {
            riskScore: fraudScore,
            riskLevel: fraudScore <= 2 ? 'low' : fraudScore <= 5 ? 'medium' : 'high',
            emailValidation: {
              valid: !isDenied,
              domainAge: isApproved ? 3650 : isDenied ? 15 : 180,
              velocity: isApproved ? 2 : isDenied ? 45 : 12,
              popularity: isApproved ? 85 : isDenied ? 5 : 40,
            },
            phoneVerification: {
              lineType: isApproved ? 'mobile' : isDenied ? 'voip' : 'mobile',
              carrier: isApproved ? 'AT&T' : isDenied ? 'Unknown' : 'T-Mobile',
              prepaid: isDenied,
              ownerMatch: isApproved,
              ownerName: isApproved ? `${appData.applicantFirstName} ${appData.applicantLastName}` : undefined,
            },
            ipAnalysis: {
              country: 'US',
              region: appData.applicantState,
              city: appData.applicantCity,
              proxy: isDenied,
              vpn: isDenied,
              routingType: isDenied ? 'tor' : 'residential',
            },
            addressDeliverability: {
              deliverable: isApproved,
              type: isApproved ? 'residential' : isDenied ? 'unknown' : 'residential',
            },
          },
          flags: isDenied
            ? ['VPN/proxy detected', 'Prepaid phone', 'Email domain age < 30 days', 'Phone owner mismatch']
            : appData.status === 'REVIEWED'
              ? ['Moderate email velocity', 'New email domain']
              : undefined,
        },
      });

      // Fraud decision
      const overallScore = isApproved ? 10 : isDenied ? 82 : 42;
      await prisma.fraudDecision.create({
        data: {
          applicationId: app.id,
          overallScore,
          overallRisk: overallScore <= 25 ? 'low' : overallScore <= 55 ? 'medium' : overallScore <= 75 ? 'high' : 'critical',
          recommendation: overallScore <= 25 ? 'APPROVE' : overallScore <= 55 ? 'REVIEW' : 'DENY',
          factors: [
            {
              category: 'Identity Verification',
              description: cviScore >= 40 ? 'Strong identity match' : cviScore >= 30 ? 'Partial identity match' : 'Weak identity verification',
              impact: cviScore >= 40 ? 0 : cviScore >= 30 ? 10 : 30,
              severity: cviScore >= 40 ? 'low' : cviScore >= 30 ? 'medium' : 'high',
            },
            {
              category: 'Fraud Signals',
              description: fraudScore <= 2 ? 'Low fraud risk indicators' : fraudScore <= 5 ? 'Moderate fraud signals detected' : 'High fraud risk detected',
              impact: fraudScore <= 2 ? 0 : fraudScore <= 5 ? 15 : 30,
              severity: fraudScore <= 2 ? 'low' : fraudScore <= 5 ? 'medium' : 'high',
            },
          ],
          signals: isDenied
            ? [
                { type: 'vpn_detected', description: 'Application submitted from VPN/proxy', source: 'FraudFinder', severity: 'critical' },
                { type: 'prepaid_phone', description: 'Phone number is prepaid/disposable', source: 'FraudFinder', severity: 'warning' },
                { type: 'identity_mismatch', description: 'Identity verification score below threshold', source: 'FlexID', severity: 'danger' },
              ]
            : appData.status === 'REVIEWED'
              ? [
                  { type: 'email_velocity', description: 'Higher than average email usage velocity', source: 'FraudFinder', severity: 'warning' },
                ]
              : [],
        },
      });
    }

    console.log(`Created application: ${appData.applicantFirstName} ${appData.applicantLastName} [${appData.status}]`);
  }

  console.log('\nSeed complete! Login with: admin@grantshield.gov / demo1234');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
