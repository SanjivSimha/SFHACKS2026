import {
  Search,
  Mail,
  Phone,
  Globe,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Shield,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface FraudScoreCardProps {
  data: any;
}

export default function FraudScoreCard({ data }: FraudScoreCardProps) {
  if (!data) {
    return (
      <CardShell>
        <EmptyState />
      </CardShell>
    );
  }

  const raw = data.rawResponse ?? data.result ?? data;
  const riskScore = raw?.riskScore ?? raw?.score ?? raw?.fraudScore ?? null;
  const emailData = raw?.email ?? raw?.emailAnalysis ?? {};
  const phoneData = raw?.phone ?? raw?.phoneAnalysis ?? {};
  const ipData = raw?.ip ?? raw?.ipAnalysis ?? {};
  const addressData = raw?.address ?? raw?.addressAnalysis ?? {};

  function getScoreColor(score: number): string {
    if (score <= 3) return 'text-green-400';
    if (score <= 6) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getBarColor(score: number): string {
    if (score <= 3) return 'bg-green-400';
    if (score <= 6) return 'bg-yellow-400';
    return 'bg-red-400';
  }

  return (
    <CardShell>
      {/* Risk score gauge */}
      {riskScore != null && (
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Risk Score</span>
            <span className={cn('font-heading text-xl font-bold', getScoreColor(riskScore))}>
              {riskScore}<span className="text-sm text-gray-500">/10</span>
            </span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-navy-700">
            <div
              className={cn('h-full rounded-full transition-all duration-700', getBarColor(riskScore))}
              style={{ width: `${(riskScore / 10) * 100}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-gray-600">
            <span>Low Risk</span>
            <span>High Risk</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Email section */}
        <AnalysisSection
          icon={Mail}
          title="Email Analysis"
          iconColor="text-blue-400"
          iconBg="bg-blue-400/10"
        >
          <DetailRow label="Validation" value={emailData.valid ?? emailData.validation} isGood={emailData.valid === true || emailData.validation === 'valid'} />
          <DetailRow label="Domain Age" value={emailData.domainAge ?? emailData.domain_age} />
          <DetailRow label="Velocity" value={emailData.velocity != null ? String(emailData.velocity) : undefined} />
          <DetailRow label="Popularity" value={emailData.popularity} />
          {emailData.disposable && (
            <WarningBadge text="Disposable email detected" />
          )}
        </AnalysisSection>

        {/* Phone section */}
        <AnalysisSection
          icon={Phone}
          title="Phone Analysis"
          iconColor="text-purple-400"
          iconBg="bg-purple-400/10"
        >
          <DetailRow label="Line Type" value={phoneData.lineType ?? phoneData.line_type} />
          <DetailRow label="Carrier" value={phoneData.carrier} />
          {(phoneData.prepaid === true || phoneData.isPrepaid === true) && (
            <WarningBadge text="Prepaid phone detected" />
          )}
          <DetailRow
            label="Owner Match"
            value={phoneData.ownerMatch ?? phoneData.owner_match}
            isGood={phoneData.ownerMatch === true || phoneData.owner_match === 'match'}
          />
        </AnalysisSection>

        {/* IP section */}
        <AnalysisSection
          icon={Globe}
          title="IP Analysis"
          iconColor="text-teal-400"
          iconBg="bg-teal-400/10"
        >
          <DetailRow label="Geolocation" value={ipData.geolocation ?? ipData.location ?? ipData.geo} />
          {(ipData.proxy === true || ipData.isProxy === true || ipData.vpn === true || ipData.isVPN === true) && (
            <WarningBadge text="Proxy / VPN detected" />
          )}
          <DetailRow label="Routing Type" value={ipData.routingType ?? ipData.routing_type ?? ipData.routing} />
        </AnalysisSection>

        {/* Address section */}
        <AnalysisSection
          icon={MapPin}
          title="Address Analysis"
          iconColor="text-orange-400"
          iconBg="bg-orange-400/10"
        >
          <DetailRow
            label="Deliverability"
            value={addressData.deliverability ?? addressData.deliverable}
            isGood={
              addressData.deliverability === 'deliverable' ||
              addressData.deliverable === true ||
              addressData.deliverability === 'Y'
            }
          />
        </AnalysisSection>
      </div>
    </CardShell>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="rounded-lg bg-purple-500/10 p-2">
          <Search className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-heading text-sm font-semibold text-white">Fraud Analysis</h3>
          <p className="text-xs text-gray-500">FraudFinder</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <Search className="mb-2 h-8 w-8 text-gray-600" />
      <p className="text-sm text-gray-500">Fraud analysis data not available</p>
    </div>
  );
}

function AnalysisSection({
  icon: Icon,
  title,
  iconColor,
  iconBg,
  children,
}: {
  icon: React.ElementType;
  title: string;
  iconColor: string;
  iconBg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-navy-600 bg-navy-700/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className={cn('rounded-md p-1.5', iconBg)}>
          <Icon className={cn('h-3.5 w-3.5', iconColor)} />
        </div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h4>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  isGood,
}: {
  label: string;
  value?: string | boolean | null;
  isGood?: boolean;
}) {
  if (value == null || value === undefined) return null;

  const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="flex items-center gap-1.5">
        {isGood === true && <CheckCircle className="h-3.5 w-3.5 text-green-400" />}
        {isGood === false && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
        <span className={cn(
          isGood === true ? 'text-green-400' : isGood === false ? 'text-red-400' : 'text-gray-300'
        )}>
          {displayValue}
        </span>
      </span>
    </div>
  );
}

function WarningBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-red-500/10 px-3 py-1.5">
      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-red-400" />
      <span className="text-xs font-medium text-red-400">{text}</span>
    </div>
  );
}
