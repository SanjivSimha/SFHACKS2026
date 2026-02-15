import { useNavigate } from 'react-router-dom';
import { Eye, ArrowRight } from 'lucide-react';
import { cn, formatDate, PROGRAM_LABELS } from '../../lib/utils';
import { STATUS_LABELS, STATUS_COLORS } from '../../lib/constants';
import ScoreRing from '../shared/ScoreRing';

interface Application {
  id: string;
  applicantFirstName: string;
  applicantLastName: string;
  programType: string;
  createdAt: string;
  status: string;
  fraudDecision?: {
    riskScore?: number;
  } | null;
  screeningResults?: any[];
}

interface RecentApplicationsProps {
  applications?: Application[];
}

const mockApplications: Application[] = [
  {
    id: '1',
    applicantFirstName: 'Maria',
    applicantLastName: 'Santos',
    programType: 'SOLAR_REBATE',
    createdAt: '2026-02-13T10:30:00Z',
    status: 'SCREENING',
    fraudDecision: { riskScore: 23 },
  },
  {
    id: '2',
    applicantFirstName: 'James',
    applicantLastName: 'Wilson',
    programType: 'EV_CREDIT',
    createdAt: '2026-02-12T15:45:00Z',
    status: 'APPROVED',
    fraudDecision: { riskScore: 12 },
  },
  {
    id: '3',
    applicantFirstName: 'Chen',
    applicantLastName: 'Wei',
    programType: 'WEATHERIZATION',
    createdAt: '2026-02-12T09:20:00Z',
    status: 'PENDING',
    fraudDecision: { riskScore: 45 },
  },
  {
    id: '4',
    applicantFirstName: 'Sarah',
    applicantLastName: 'Johnson',
    programType: 'CLEAN_ENERGY_BUSINESS',
    createdAt: '2026-02-11T14:10:00Z',
    status: 'REVIEWED',
    fraudDecision: { riskScore: 67 },
  },
  {
    id: '5',
    applicantFirstName: 'Robert',
    applicantLastName: 'Kim',
    programType: 'HEAT_PUMP',
    createdAt: '2026-02-11T08:55:00Z',
    status: 'DENIED',
    fraudDecision: { riskScore: 89 },
  },
  {
    id: '6',
    applicantFirstName: 'Ana',
    applicantLastName: 'Rodriguez',
    programType: 'SOLAR_REBATE',
    createdAt: '2026-02-10T16:30:00Z',
    status: 'APPROVED',
    fraudDecision: { riskScore: 15 },
  },
  {
    id: '7',
    applicantFirstName: 'David',
    applicantLastName: 'Patel',
    programType: 'EV_CREDIT',
    createdAt: '2026-02-10T11:15:00Z',
    status: 'SCREENING',
    fraudDecision: { riskScore: 52 },
  },
  {
    id: '8',
    applicantFirstName: 'Emily',
    applicantLastName: 'Nguyen',
    programType: 'WEATHERIZATION',
    createdAt: '2026-02-09T13:40:00Z',
    status: 'APPROVED',
    fraudDecision: { riskScore: 8 },
  },
  {
    id: '9',
    applicantFirstName: 'Marcus',
    applicantLastName: 'Brown',
    programType: 'CLEAN_ENERGY_BUSINESS',
    createdAt: '2026-02-09T10:05:00Z',
    status: 'PENDING',
    fraudDecision: { riskScore: 34 },
  },
  {
    id: '10',
    applicantFirstName: 'Lisa',
    applicantLastName: 'Chang',
    programType: 'HEAT_PUMP',
    createdAt: '2026-02-08T09:00:00Z',
    status: 'REVIEWED',
    fraudDecision: { riskScore: 71 },
  },
];

export default function RecentApplications({ applications }: RecentApplicationsProps) {
  const navigate = useNavigate();
  const data = applications && applications.length > 0 ? applications.slice(0, 10) : mockApplications;

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-navy-700 px-5 py-4">
        <h3 className="font-heading text-lg font-semibold text-white">Recent Applications</h3>
        <button
          onClick={() => navigate('/applications')}
          className="flex items-center gap-1 text-xs font-medium text-accent-green transition-colors hover:text-accent-teal"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-navy-700">
              <th className="px-5 py-3 font-medium text-gray-400">Applicant</th>
              <th className="px-5 py-3 font-medium text-gray-400">Program</th>
              <th className="px-5 py-3 font-medium text-gray-400">Date</th>
              <th className="px-5 py-3 font-medium text-gray-400">Risk Score</th>
              <th className="px-5 py-3 font-medium text-gray-400">Status</th>
              <th className="px-5 py-3 font-medium text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((app) => {
              const riskScore = app.fraudDecision?.riskScore ?? 0;
              const statusLabel = STATUS_LABELS[app.status] ?? app.status;
              const statusColor = STATUS_COLORS[app.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20';

              return (
                <tr
                  key={app.id}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  className="cursor-pointer border-b border-navy-700/50 transition-colors hover:bg-navy-700/50"
                >
                  <td className="px-5 py-3 font-medium text-gray-200">
                    {app.applicantFirstName} {app.applicantLastName}
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {PROGRAM_LABELS[app.programType] ?? app.programType}
                  </td>
                  <td className="px-5 py-3 text-gray-400">
                    {formatDate(app.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <ScoreRing score={riskScore} size={36} />
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                        statusColor
                      )}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/applications/${app.id}`);
                      }}
                      className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-navy-600 hover:text-gray-300"
                      aria-label="View application"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
