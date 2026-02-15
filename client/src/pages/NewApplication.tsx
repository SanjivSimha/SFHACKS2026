import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Car,
  Home,
  Building2,
  Thermometer,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  Upload,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { PROGRAMS } from '../lib/constants';
import api from '../api/client';

const ICON_MAP: Record<string, React.ElementType> = {
  Sun,
  Car,
  Home,
  Building2,
  Thermometer,
};

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
];

const STEPS = [
  { number: 1, label: 'Program' },
  { number: 2, label: 'Applicant' },
  { number: 3, label: 'Grant Details' },
  { number: 4, label: 'Review' },
];

interface FormData {
  programType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  ssn: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  requestedAmount: string;
  propertyAddress: string;
  projectDescription: string;
  consent: boolean;
}

// Pre-populated with FlexID + FraudFinder sandbox test persona
const initialForm: FormData = {
  programType: 'SOLAR_REBATE',
  firstName: 'MIRANDA',
  lastName: 'JJUNIPER',
  email: 'test@example.com',
  phone: '4786251234',
  dob: '1955-11-13',
  ssn: '540-32-5127',
  address: '1678 NE 41ST',
  city: 'ATLANTA',
  state: 'GA',
  zip: '30302',
  requestedAmount: '15000',
  propertyAddress: '',
  projectDescription: 'Residential solar panel system with battery backup for energy independence',
  consent: false,
};

interface ScreeningStep {
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

export default function NewApplication() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [screeningSteps, setScreeningSteps] = useState<ScreeningStep[]>([]);
  const [showScreening, setShowScreening] = useState(false);

  const selectedProgram = PROGRAMS.find((p) => p.type === form.programType);

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function formatSSN(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }

  function maskSSN(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return formatSSN(value);
    const last4 = digits.slice(-4);
    const masked = '\u2022'.repeat(digits.length - 4);
    if (digits.length <= 3) return masked;
    if (digits.length <= 5) return `${masked.slice(0, 3)}-${masked.slice(3)}`;
    return `${'***'}-${'**'}-${last4}`;
  }

  function validateStep1(): boolean {
    if (!form.programType) {
      setErrors({ programType: 'Please select a program' });
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.dob) errs.dob = 'Date of birth is required';
    if (!form.ssn.trim() || form.ssn.replace(/\D/g, '').length < 9) errs.ssn = 'Valid SSN is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state) errs.state = 'State is required';
    if (!form.zip.trim() || !/^\d{5}(-\d{4})?$/.test(form.zip)) errs.zip = 'Valid ZIP code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep3(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.requestedAmount || Number(form.requestedAmount) <= 0) {
      errs.requestedAmount = 'A valid amount is required';
    } else if (selectedProgram && Number(form.requestedAmount) > selectedProgram.maxAmount) {
      errs.requestedAmount = `Amount cannot exceed ${formatCurrency(selectedProgram.maxAmount)}`;
    }
    if (!form.projectDescription.trim()) errs.projectDescription = 'Project description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    let valid = false;
    if (step === 1) valid = validateStep1();
    else if (step === 2) valid = validateStep2();
    else if (step === 3) valid = validateStep3();
    if (valid) {
      setStep((s) => Math.min(s + 1, 4));
      setErrors({});
    }
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
    setErrors({});
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.consent) {
      setErrors({ consent: 'You must agree to the terms' });
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setShowScreening(true);
    setScreeningSteps([
      { label: 'Identity Verification', status: 'pending' },
      { label: 'Fraud Analysis', status: 'pending' },
      { label: 'Risk Assessment', status: 'pending' },
    ]);

    try {
      // Step 1: Create application
      const payload = {
        programType: form.programType,
        applicantFirstName: form.firstName,
        applicantLastName: form.lastName,
        applicantEmail: form.email,
        applicantPhone: form.phone,
        applicantDOB: form.dob,
        applicantSSN: form.ssn.replace(/\D/g, ''),
        applicantAddress1: form.address,
        applicantCity: form.city,
        applicantState: form.state,
        applicantZip: form.zip,
        requestedAmount: Number(form.requestedAmount),
        propertyAddress: form.propertyAddress || undefined,
        projectDescription: form.projectDescription,
      };

      const { data: createData } = await api.post('/applications', payload);
      const appId = createData.id;

      // Step 2: Run screening with progress simulation
      setScreeningSteps((prev) =>
        prev.map((s, i) => (i === 0 ? { ...s, status: 'running' } : s))
      );

      // Fire off screening
      const screeningPromise = api.post(`/screening/${appId}/run`);

      // Simulate progress through the steps while waiting
      await new Promise((r) => setTimeout(r, 1200));
      setScreeningSteps((prev) =>
        prev.map((s, i) => {
          if (i === 0) return { ...s, status: 'done' };
          if (i === 1) return { ...s, status: 'running' };
          return s;
        })
      );

      await new Promise((r) => setTimeout(r, 1500));
      setScreeningSteps((prev) =>
        prev.map((s, i) => {
          if (i <= 1) return { ...s, status: 'done' };
          if (i === 2) return { ...s, status: 'running' };
          return s;
        })
      );

      // Wait for the actual screening to finish
      await screeningPromise;

      await new Promise((r) => setTimeout(r, 800));
      setScreeningSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));

      // Brief pause to show all green, then redirect
      await new Promise((r) => setTimeout(r, 600));
      navigate(`/applications/${appId}`);
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message ?? 'Failed to submit application. Please try again.'
      );
      setScreeningSteps((prev) =>
        prev.map((s) => (s.status === 'running' ? { ...s, status: 'error' } : s))
      );
      setSubmitting(false);
    }
  }

  // -- Input helper class --
  const inputClasses = cn(
    'w-full rounded-lg border border-navy-600 bg-navy-700 px-4 py-2.5 text-sm text-gray-200',
    'placeholder:text-gray-600 focus:border-accent-green/50 focus:outline-none focus:ring-2 focus:ring-accent-green/20',
    'transition-colors'
  );

  const labelClasses = 'mb-1.5 block text-sm font-medium text-gray-300';

  function renderError(field: keyof FormData) {
    if (!errors[field]) return null;
    return <p className="mt-1 text-xs text-red-400">{errors[field]}</p>;
  }

  // ------ STEP RENDERERS ------

  function renderStep1() {
    return (
      <div>
        <h2 className="mb-1 font-heading text-xl font-semibold text-white">Select a Program</h2>
        <p className="mb-6 text-sm text-gray-500">Choose the grant or rebate program to apply for.</p>

        {errors.programType && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errors.programType}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((program) => {
            const Icon = ICON_MAP[program.icon] ?? Sun;
            const selected = form.programType === program.type;

            return (
              <button
                key={program.type}
                type="button"
                onClick={() => updateField('programType', program.type)}
                className={cn(
                  'group relative flex flex-col items-start rounded-xl border p-5 text-left transition-all',
                  selected
                    ? 'border-accent-green bg-accent-green/5 shadow-lg shadow-accent-green/10'
                    : 'border-navy-700 bg-navy-800 hover:border-navy-600 hover:bg-navy-700/50'
                )}
              >
                {selected && (
                  <div className="absolute right-3 top-3">
                    <CheckCircle className="h-5 w-5 text-accent-green" />
                  </div>
                )}
                <div
                  className={cn(
                    'mb-3 rounded-lg p-2.5',
                    selected ? 'bg-accent-green/10' : 'bg-navy-700'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-6 w-6',
                      selected ? 'text-accent-green' : 'text-gray-400 group-hover:text-gray-300'
                    )}
                  />
                </div>
                <h3
                  className={cn(
                    'mb-1 font-heading text-sm font-semibold',
                    selected ? 'text-accent-green' : 'text-white'
                  )}
                >
                  {program.name}
                </h3>
                <p className="mb-3 text-xs text-gray-500">{program.description}</p>
                <span className="mt-auto font-heading text-lg font-bold text-white">
                  Up to {formatCurrency(program.maxAmount)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div>
        <h2 className="mb-1 font-heading text-xl font-semibold text-white">Applicant Information</h2>
        <p className="mb-6 text-sm text-gray-500">Enter the applicant's personal details.</p>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* First name */}
          <div>
            <label className={labelClasses}>First Name</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              placeholder="John"
              className={cn(inputClasses, errors.firstName && 'border-red-500/50')}
            />
            {renderError('firstName')}
          </div>

          {/* Last name */}
          <div>
            <label className={labelClasses}>Last Name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              placeholder="Doe"
              className={cn(inputClasses, errors.lastName && 'border-red-500/50')}
            />
            {renderError('lastName')}
          </div>

          {/* Email */}
          <div>
            <label className={labelClasses}>Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="john.doe@example.com"
              className={cn(inputClasses, errors.email && 'border-red-500/50')}
            />
            {renderError('email')}
          </div>

          {/* Phone */}
          <div>
            <label className={labelClasses}>Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className={cn(inputClasses, errors.phone && 'border-red-500/50')}
            />
            {renderError('phone')}
          </div>

          {/* DOB */}
          <div>
            <label className={labelClasses}>Date of Birth</label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => updateField('dob', e.target.value)}
              className={cn(inputClasses, errors.dob && 'border-red-500/50', '[color-scheme:dark]')}
            />
            {renderError('dob')}
          </div>

          {/* SSN */}
          <div>
            <label className={labelClasses}>Social Security Number</label>
            <SSNInput
              value={form.ssn}
              onChange={(val) => updateField('ssn', val)}
              hasError={!!errors.ssn}
              inputClasses={inputClasses}
            />
            {renderError('ssn')}
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className={labelClasses}>Street Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="123 Main St, Apt 4B"
              className={cn(inputClasses, errors.address && 'border-red-500/50')}
            />
            {renderError('address')}
          </div>

          {/* City */}
          <div>
            <label className={labelClasses}>City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="San Francisco"
              className={cn(inputClasses, errors.city && 'border-red-500/50')}
            />
            {renderError('city')}
          </div>

          {/* State */}
          <div>
            <label className={labelClasses}>State</label>
            <select
              value={form.state}
              onChange={(e) => updateField('state', e.target.value)}
              className={cn(inputClasses, errors.state && 'border-red-500/50', !form.state && 'text-gray-600')}
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {renderError('state')}
          </div>

          {/* ZIP */}
          <div>
            <label className={labelClasses}>ZIP Code</label>
            <input
              type="text"
              value={form.zip}
              onChange={(e) => updateField('zip', e.target.value)}
              placeholder="94102"
              maxLength={10}
              className={cn(inputClasses, errors.zip && 'border-red-500/50')}
            />
            {renderError('zip')}
          </div>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div>
        <h2 className="mb-1 font-heading text-xl font-semibold text-white">Grant Details</h2>
        <p className="mb-6 text-sm text-gray-500">Provide details about the grant request.</p>

        <div className="space-y-5">
          {/* Requested amount */}
          <div>
            <label className={labelClasses}>
              Requested Amount
              {selectedProgram && (
                <span className="ml-2 font-normal text-gray-500">
                  (Max: {formatCurrency(selectedProgram.maxAmount)})
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
              <input
                type="number"
                min="0"
                max={selectedProgram?.maxAmount}
                step="0.01"
                value={form.requestedAmount}
                onChange={(e) => updateField('requestedAmount', e.target.value)}
                placeholder="0.00"
                className={cn(inputClasses, 'pl-8', errors.requestedAmount && 'border-red-500/50')}
              />
            </div>
            {renderError('requestedAmount')}
          </div>

          {/* Property address */}
          <div>
            <label className={labelClasses}>
              Property Address
              <span className="ml-2 font-normal text-gray-500">(if different from applicant address)</span>
            </label>
            <input
              type="text"
              value={form.propertyAddress}
              onChange={(e) => updateField('propertyAddress', e.target.value)}
              placeholder="456 Oak Ave, Suite 100"
              className={inputClasses}
            />
          </div>

          {/* Project description */}
          <div>
            <label className={labelClasses}>Project Description</label>
            <textarea
              rows={4}
              value={form.projectDescription}
              onChange={(e) => updateField('projectDescription', e.target.value)}
              placeholder="Describe the project this grant will fund..."
              className={cn(inputClasses, 'resize-none', errors.projectDescription && 'border-red-500/50')}
            />
            {renderError('projectDescription')}
          </div>

          {/* Upload placeholder */}
          <div>
            <label className={labelClasses}>Supporting Documents</label>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-navy-600 bg-navy-700/30 p-8 text-center">
              <Upload className="mb-3 h-8 w-8 text-gray-600" />
              <p className="mb-1 text-sm text-gray-400">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-600">
                PDF, PNG, JPG up to 10MB each
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderStep4() {
    const programLabel = selectedProgram?.name ?? form.programType;

    return (
      <div>
        <h2 className="mb-1 font-heading text-xl font-semibold text-white">Review & Submit</h2>
        <p className="mb-6 text-sm text-gray-500">
          Please review all information before submitting.
        </p>

        <div className="space-y-4">
          {/* Program summary */}
          <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
            <h3 className="mb-3 font-heading text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Program
            </h3>
            <p className="text-lg font-semibold text-white">{programLabel}</p>
            <p className="text-sm text-gray-400">
              Requested: {form.requestedAmount ? formatCurrency(Number(form.requestedAmount)) : '--'}
            </p>
          </div>

          {/* Applicant summary */}
          <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
            <h3 className="mb-3 font-heading text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Applicant
            </h3>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-gray-500">Name:</span>{' '}
                <span className="text-gray-200">{form.firstName} {form.lastName}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>{' '}
                <span className="text-gray-200">{form.email}</span>
              </div>
              <div>
                <span className="text-gray-500">Phone:</span>{' '}
                <span className="text-gray-200">{form.phone}</span>
              </div>
              <div>
                <span className="text-gray-500">DOB:</span>{' '}
                <span className="text-gray-200">{form.dob}</span>
              </div>
              <div>
                <span className="text-gray-500">SSN:</span>{' '}
                <span className="font-mono text-gray-200">***-**-{form.ssn.replace(/\D/g, '').slice(-4)}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500">Address:</span>{' '}
                <span className="text-gray-200">
                  {form.address}, {form.city}, {form.state} {form.zip}
                </span>
              </div>
            </div>
          </div>

          {/* Grant details summary */}
          <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
            <h3 className="mb-3 font-heading text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Grant Details
            </h3>
            <div className="space-y-2 text-sm">
              {form.propertyAddress && (
                <div>
                  <span className="text-gray-500">Property Address:</span>{' '}
                  <span className="text-gray-200">{form.propertyAddress}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Project Description:</span>{' '}
                <span className="text-gray-200">{form.projectDescription}</span>
              </div>
            </div>
          </div>

          {/* Consent */}
          <div className="rounded-xl border border-navy-700 bg-navy-800 p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => updateField('consent', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-navy-600 bg-navy-700 text-accent-green focus:ring-accent-green/20"
              />
              <span className="text-sm text-gray-300">
                I certify that all information provided is accurate and complete. I authorize GrantShield
                to perform identity verification, fraud screening, and background checks as part of the
                application review process. I understand that providing false information may result in
                denial and potential legal action.
              </span>
            </label>
            {errors.consent && (
              <p className="mt-2 text-xs text-red-400">{errors.consent}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderScreeningOverlay() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/80 backdrop-blur-sm">
        <div className="mx-4 w-full max-w-md rounded-2xl border border-navy-700 bg-navy-800 p-8 shadow-2xl">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-4 rounded-full bg-accent-green/10 p-4">
              <Shield className="h-8 w-8 text-accent-green" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-white">
              Running Fraud Screening
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Please wait while we verify the application...
            </p>
          </div>

          <div className="space-y-3">
            {screeningSteps.map((s, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-4 py-3',
                  s.status === 'done'
                    ? 'border-green-500/20 bg-green-500/5'
                    : s.status === 'error'
                      ? 'border-red-500/20 bg-red-500/5'
                      : s.status === 'running'
                        ? 'border-accent-green/20 bg-accent-green/5'
                        : 'border-navy-600 bg-navy-700/50'
                )}
              >
                {s.status === 'done' && <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-400" />}
                {s.status === 'running' && <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-accent-green" />}
                {s.status === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />}
                {s.status === 'pending' && (
                  <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-navy-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    s.status === 'done'
                      ? 'text-green-400'
                      : s.status === 'error'
                        ? 'text-red-400'
                        : s.status === 'running'
                          ? 'text-accent-green'
                          : 'text-gray-500'
                  )}
                >
                  {s.label}
                </span>
                {s.status === 'done' && (
                  <span className="ml-auto text-xs text-green-500">Complete</span>
                )}
                {s.status === 'error' && (
                  <span className="ml-auto text-xs text-red-400">Failed</span>
                )}
              </div>
            ))}
          </div>

          {submitError && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submitError && (
            <button
              onClick={() => {
                setShowScreening(false);
                setSubmitting(false);
              }}
              className="mt-4 w-full rounded-lg border border-navy-600 bg-navy-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-navy-600"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {showScreening && renderScreeningOverlay()}

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="font-heading text-2xl font-bold text-white">New Application</h1>
        <p className="mt-1 text-sm text-gray-500">Submit a new grant or rebate application.</p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                    step > s.number
                      ? 'border-accent-green bg-accent-green text-navy-900'
                      : step === s.number
                        ? 'border-accent-green text-accent-green'
                        : 'border-navy-600 text-gray-600'
                  )}
                >
                  {step > s.number ? <CheckCircle className="h-5 w-5" /> : s.number}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-xs font-medium',
                    step >= s.number ? 'text-gray-300' : 'text-gray-600'
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-3 mt-[-1.25rem] h-0.5 w-12 sm:w-20 lg:w-28',
                    step > s.number ? 'bg-accent-green' : 'bg-navy-600'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-navy-700 bg-navy-800 p-6 shadow-lg sm:p-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className={cn(
              'flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-700 px-5 py-2.5 text-sm font-medium text-gray-300',
              'transition-colors hover:bg-navy-600 disabled:cursor-not-allowed disabled:opacity-40'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className={cn(
                'flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-green to-accent-teal',
                'px-5 py-2.5 text-sm font-semibold text-navy-900 shadow-lg shadow-accent-green/20',
                'transition-all hover:brightness-110'
              )}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-green to-accent-teal',
                'px-6 py-2.5 text-sm font-semibold text-navy-900 shadow-lg shadow-accent-green/20',
                'transition-all hover:brightness-110',
                'disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Submit Application
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function SSNInput({
  value,
  onChange,
  hasError,
  inputClasses,
}: {
  value: string;
  onChange: (val: string) => void;
  hasError: boolean;
  inputClasses: string;
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract raw digits from the stored value
  const rawDigits = value.replace(/\D/g, '');

  // Format digits as 123-45-6789
  function formatForDisplay(digits: string): string {
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }

  // Mask as ***-**-6789
  function maskForDisplay(digits: string): string {
    if (digits.length === 0) return '';
    if (digits.length <= 4) return digits;
    const last4 = digits.slice(-4);
    return `***-**-${last4}`;
  }

  const displayValue = focused ? formatForDisplay(rawDigits) : maskForDisplay(rawDigits);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target.value;
    const digits = input.replace(/\D/g, '').slice(0, 9);
    // Store the formatted version (with dashes) so validation works
    onChange(formatForDisplay(digits));
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="***-**-1234"
      maxLength={11}
      className={cn(inputClasses, hasError && 'border-red-500/50', 'font-mono')}
    />
  );
}
