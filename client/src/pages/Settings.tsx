import { Shield, Leaf } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Settings</h1>
        <p className="text-gray-400 mt-1">Platform configuration and preferences</p>
      </div>

      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Shield className="w-8 h-8 text-accent-green" />
            <Leaf className="w-4 h-4 text-accent-teal absolute -bottom-1 -right-1" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-semibold">GrantShield</h2>
            <p className="text-sm text-gray-400">v1.0.0 — Fraud Prevention Platform</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm">
          GrantShield uses the CRS Credit API to verify applicant identities, detect fraud signals,
          and prevent duplicate or fraudulent grant and rebate applications.
        </p>
      </div>

      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
        <h2 className="text-lg font-heading font-semibold mb-4">CRS API Configuration</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-navy-700">
            <span className="text-gray-400">Sandbox Endpoint</span>
            <span className="text-sm font-mono text-gray-300">api-sandbox.stitchcredit.com</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-navy-700">
            <span className="text-gray-400">API Status</span>
            <span className="flex items-center gap-2 text-green-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400">Available Services</span>
            <span className="text-sm text-gray-300">FlexID, FraudFinder, Experian, Criminal, Eviction</span>
          </div>
        </div>
      </div>

      <div className="bg-navy-800 rounded-xl border border-navy-700 p-6">
        <h2 className="text-lg font-heading font-semibold mb-4">Screening Thresholds</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-sm">Auto-Approve Threshold</span>
              <span className="text-green-400 text-sm font-semibold">Score 0-25</span>
            </div>
            <div className="w-full bg-navy-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-sm">Manual Review</span>
              <span className="text-yellow-400 text-sm font-semibold">Score 26-55</span>
            </div>
            <div className="w-full bg-navy-700 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '55%' }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400 text-sm">Auto-Deny Threshold</span>
              <span className="text-red-400 text-sm font-semibold">Score 56-100</span>
            </div>
            <div className="w-full bg-navy-700 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
