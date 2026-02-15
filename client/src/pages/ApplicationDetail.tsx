import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  Loader2,
  Clock,
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Clipboard,
  ShieldAlert,
  Archive,
} from 'lucide-react';
import { cn, formatCurrency, formatDate, formatDateTime, PROGRAM_LABELS } from '../lib/utils';
import { STATUS_LABELS, STATUS_COLORS } from '../lib/constants';
import { useStore } from '../store/useStore';
import api from '../api/client';
import ScoreRing from '../components/shared/ScoreRing';
import RiskBadge from '../components/shared/RiskBadge';
import IdentityCard from '../components/screening/IdentityCard';
import FraudScoreCard from '../components/screening/FraudScoreCard';
import CreditCard from '../components/screening/CreditCard';
import CriminalCard from '../components/screening/CriminalCard';
import EvictionCard from '../components/screening/EvictionCard';
import RiskSummary from '../components/screening/RiskSummary';

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const app = useStore((s) => s.currentApplication);
  const loading = useStore((s) => s.loading);
  const fetchApplication = useStore((s) => s.fetchApplication);
  const updateApplication = useStore((s) => s.updateApplication);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (id) {
      fetchApplication(id).catch(() => {});
    }
  }, [id, fetchApplication]);

  if (loading || !app) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent-green" />
          <p className="text-sm text-gray-500">Loading application...</p>
        </div>
      </div>
    );
  }

  const riskScore = app.fraudDecision?.riskScore ?? 0;
  const riskLevel = app.fraudDecision?.riskLevel ?? 'unknown';
  const statusLabel = STATUS_LABELS[app.status] ?? app.status;
  const statusColor = STATUS_COLORS[app.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  const programLabel = PROGRAM_LABELS[app.programType] ?? app.programType;

  // Parse screening results by type
  const screenings = app.screeningResults ?? [];
  const identityResult = screenings.find((s: any) => s.type === 'IDENTITY' || s.type === 'FLEXID');
  const fraudResult = screenings.find((s: any) => s.type === 'FRAUD' || s.type === 'FRAUD_FINDER');
  const creditResult = screenings.find((s: any) => s.type === 'CREDIT' || s.type === 'CREDIT_REPORT');
  const criminalResult = screenings.find((s: any) => s.type === 'CRIMINAL');
  const evictionResult = screenings.find((s: any) => s.type === 'EVICTION');

  async function handleAction(action: string) {
    if (!id) return;
    setActionLoading(action);
    try {
      if (action === 'approve') {
        await updateApplication(id, { status: 'APPROVED' });
      } else if (action === 'deny') {
        await updateApplication(id, { status: 'DENIED' });
      } else if (action === 'review') {
        await updateApplication(id, { status: 'REVIEWED' });
      } else if (action === 'note' && noteText.trim()) {
        await updateApplication(id, { notes: noteText });
        setNoteText('');
        setShowNoteInput(false);
      } else if (action === 'archive') {
        await updateApplication(id, { status: 'ARCHIVED' });
      } else if (action === 'pdf') {
        await api.get(`/applications/${id}/report`, { responseType: 'blob' });
      }
    } catch {
      // Error is handled by store
    } finally {
      setActionLoading(null);
    }
  }

  // Build timeline events
  const timeline: Array<{ date: string; label: string; icon: React.ElementType; color: string }> = [
    { date: app.createdAt, label: 'Application submitted', icon: FileText, color: 'text-blue-400' },
  ];
  if (screenings.length > 0) {
    const earliest = screenings.reduce((min: any, s: any) =>
      s.createdAt && (!min || new Date(s.createdAt) < new Date(min)) ? s.createdAt : min,
      null
    );
    if (earliest) {
      timeline.push({ date: earliest, label: 'Screening initiated', icon: ShieldAlert, color: 'text-accent-teal' });
    }
  }
  if (app.fraudDecision) {
    timeline.push({
      date: app.fraudDecision.createdAt ?? app.updatedAt,
      label: `Risk assessment: ${app.fraudDecision.recommendation ?? riskLevel}`,
      icon: ShieldAlert,
      color: riskLevel === 'low' ? 'text-green-400' : riskLevel === 'high' || riskLevel === 'critical' ? 'text-red-400' : 'text-yellow-400',
    });
  }
  if (app.reviewedAt) {
    timeline.push({
      date: app.reviewedAt,
      label: `${app.status === 'APPROVED' ? 'Approved' : app.status === 'DENIED' ? 'Denied' : 'Reviewed'} by ${app.reviewedBy ?? 'admin'}`,
      icon: app.status === 'APPROVED' ? CheckCircle2 : app.status === 'DENIED' ? XCircle : AlertTriangle,
      color: app.status === 'APPROVED' ? 'text-green-400' : app.status === 'DENIED' ? 'text-red-400' : 'text-yellow-400',
    });
  }
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <ScoreRing score={riskScore} size={72} label="Risk" />
          <div>
            <h1 className="font-heading text-2xl font-bold text-white">
              {app.applicantFirstName} {app.applicantLastName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  statusColor
                )}
              >
                {statusLabel}
              </span>
              <span className="inline-flex items-center rounded-full border border-navy-600 bg-navy-700 px-2.5 py-0.5 text-xs font-medium text-gray-300">
                {programLabel}
              </span>
              <span className="text-xs text-gray-500">
                Submitted {formatDate(app.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {riskLevel !== 'unknown' && (
          <RiskBadge risk={riskLevel as any} size="md" />
        )}
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-navy-700 bg-navy-800 px-5 py-4">
        <button
          onClick={() => handleAction('approve')}
          disabled={actionLoading !== null}
          className={cn(
            'flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400',
            'border border-green-500/20 transition-colors hover:bg-green-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {actionLoading === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Approve
        </button>
        <button
          onClick={() => handleAction('review')}
          disabled={actionLoading !== null}
          className={cn(
            'flex items-center gap-2 rounded-lg bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-400',
            'border border-yellow-500/20 transition-colors hover:bg-yellow-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {actionLoading === 'review' ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
          Request Review
        </button>
        <button
          onClick={() => handleAction('deny')}
          disabled={actionLoading !== null}
          className={cn(
            'flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400',
            'border border-red-500/20 transition-colors hover:bg-red-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {actionLoading === 'deny' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Deny
        </button>

        <div className="mx-2 hidden h-6 w-px bg-navy-600 sm:block" />

        <button
          onClick={() => setShowNoteInput(!showNoteInput)}
          className={cn(
            'flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-700 px-4 py-2 text-sm font-medium text-gray-300',
            'transition-colors hover:bg-navy-600'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Add Note
        </button>
        <button
          onClick={() => handleAction('pdf')}
          disabled={actionLoading !== null}
          className={cn(
            'flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-700 px-4 py-2 text-sm font-medium text-gray-300',
            'transition-colors hover:bg-navy-600',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {actionLoading === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clipboard className="h-4 w-4" />}
          Generate PDF
        </button>

        {app.status !== 'ARCHIVED' && (
          <>
            <div className="mx-2 hidden h-6 w-px bg-navy-600 sm:block" />
            <button
              onClick={() => handleAction('archive')}
              disabled={actionLoading !== null}
              className={cn(
                'flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-700 px-4 py-2 text-sm font-medium text-gray-300',
                'transition-colors hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/20',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {actionLoading === 'archive' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
              Archive
            </button>
          </>
        )}
      </div>

      {/* Note input */}
      {showNoteInput && (
        <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
          <textarea
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note about this application..."
            className={cn(
              'mb-3 w-full rounded-lg border border-navy-600 bg-navy-700 px-4 py-2.5 text-sm text-gray-200',
              'placeholder:text-gray-600 focus:border-accent-green/50 focus:outline-none focus:ring-2 focus:ring-accent-green/20',
              'resize-none transition-colors'
            )}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowNoteInput(false); setNoteText(''); }}
              className="rounded-lg border border-navy-600 bg-navy-700 px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-navy-600"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAction('note')}
              disabled={!noteText.trim() || actionLoading !== null}
              className={cn(
                'rounded-lg bg-gradient-to-r from-accent-green to-accent-teal px-4 py-2 text-sm font-semibold text-navy-900',
                'transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Override section */}
      {app.fraudDecision?.overrideReason && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-400" />
            <div>
              <h3 className="font-heading text-sm font-semibold text-yellow-400">
                Decision Override
              </h3>
              <p className="mt-1 text-sm text-gray-300">
                An administrator overrode the automated decision.{' '}
                {app.fraudDecision.overrideReason && (
                  <span className="text-gray-400">Reason: {app.fraudDecision.overrideReason}</span>
                )}
              </p>
              {app.fraudDecision.overrideBy && (
                <p className="mt-1 text-xs text-gray-500">
                  By {app.fraudDecision.overrideBy} on {app.fraudDecision.overrideAt ? formatDateTime(app.fraudDecision.overrideAt) : 'N/A'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left column: Info cards */}
        <div className="space-y-6 xl:col-span-1">
          {/* Applicant info */}
          <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
            <h3 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold text-gray-400 uppercase tracking-wide">
              <User className="h-4 w-4" />
              Applicant Information
            </h3>
            <div className="space-y-3">
              <InfoRow icon={User} label="Name" value={`${app.applicantFirstName} ${app.applicantLastName}`} />
              <InfoRow icon={Mail} label="Email" value={app.applicantEmail} />
              {app.applicantPhone && <InfoRow icon={Phone} label="Phone" value={app.applicantPhone} />}
              {app.applicantDOB && <InfoRow icon={Calendar} label="DOB" value={formatDate(app.applicantDOB)} />}
              {app.applicantAddress1 && (
                <InfoRow
                  icon={MapPin}
                  label="Address"
                  value={[app.applicantAddress1, app.applicantCity, app.applicantState, app.applicantZip].filter(Boolean).join(', ')}
                />
              )}
            </div>
          </div>

          {/* Grant details */}
          <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
            <h3 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold text-gray-400 uppercase tracking-wide">
              <DollarSign className="h-4 w-4" />
              Grant Details
            </h3>
            <div className="space-y-3">
              <InfoRow icon={FileText} label="Program" value={programLabel} />
              {app.requestedAmount != null && (
                <InfoRow icon={DollarSign} label="Requested" value={formatCurrency(app.requestedAmount)} />
              )}
              {app.projectDescription && (
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500">Project Description</p>
                  <p className="text-sm text-gray-300">{app.projectDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {app.notes && (
            <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
              <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold text-gray-400 uppercase tracking-wide">
                <MessageSquare className="h-4 w-4" />
                Notes
              </h3>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{app.notes}</p>
            </div>
          )}
        </div>

        {/* Right column: Screening results */}
        <div className="space-y-6 xl:col-span-2">
          {/* Risk summary at top */}
          {app.fraudDecision && <RiskSummary decision={app.fraudDecision} />}

          {identityResult && <IdentityCard data={identityResult} />}
          {fraudResult && <FraudScoreCard data={fraudResult} />}
          {creditResult && <CreditCard data={creditResult} />}
          {criminalResult && <CriminalCard data={criminalResult} />}
          {evictionResult && <EvictionCard data={evictionResult} />}

          {screenings.length === 0 && !app.fraudDecision && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-navy-700 bg-navy-800 p-12 text-center">
              <ShieldAlert className="mb-3 h-10 w-10 text-gray-600" />
              <h3 className="font-heading text-lg font-semibold text-gray-400">
                No Screening Results Yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Screening has not been run for this application.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
        <h3 className="mb-4 flex items-center gap-2 font-heading text-sm font-semibold text-gray-400 uppercase tracking-wide">
          <Clock className="h-4 w-4" />
          Timeline
        </h3>
        <div className="relative ml-3 border-l border-navy-600 pl-6">
          {timeline.map((event, i) => {
            const Icon = event.icon;
            return (
              <div key={i} className="relative mb-6 last:mb-0">
                <div
                  className={cn(
                    'absolute -left-[calc(1.5rem+0.5rem+1px)] flex h-8 w-8 items-center justify-center rounded-full border-2 border-navy-800 bg-navy-900',
                  )}
                >
                  <Icon className={cn('h-4 w-4', event.color)} />
                </div>
                <p className="text-sm font-medium text-gray-200">{event.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{formatDateTime(event.date)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-600" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-200 break-words">{value}</p>
      </div>
    </div>
  );
}
