import React from 'react'
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Server,
  UserCheck,
  Mail,
  FileText,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white transition-colors">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span>Home</span> / <span className="font-semibold text-slate-900 dark:text-slate-200">Privacy Policy</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 dark:border-cyan-500/30 bg-blue-500/10 dark:bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-cyan-400 mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Developer Privacy &amp; Data Safeguards</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
            At CodeGuardian AI, we recognize that your source code represents your most critical intellectual property. This Privacy Policy details our strict zero-retention commitments, data handling practices, and developer protections.
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>Effective Date: October 2026</span>
            <span>•</span>
            <span>Version: 2.4.0</span>
          </div>
        </div>

        {/* Key Guarantees Highlight Banner */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-cyan-500/30 bg-white dark:bg-slate-900/80 p-5 shadow-xs dark:shadow-md backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 mb-3 border border-blue-200 dark:border-cyan-500/20">
              <EyeOff className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Zero Permanent Code Storage</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your source code is analyzed strictly in volatile memory. We never write your raw code to persistent databases or disks.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-purple-500/30 bg-white dark:bg-slate-900/80 p-5 shadow-xs dark:shadow-md backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-3 border border-purple-200 dark:border-purple-500/20">
              <Lock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No AI Model Training</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              User code is strictly excluded from training sets. Your proprietary algorithms will never be used to train public or private LLMs.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-emerald-500/30 bg-white dark:bg-slate-900/80 p-5 shadow-xs dark:shadow-md backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-200 dark:border-emerald-500/20">
              <Server className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Isolated Sandboxes</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sandbox execution runs in ephemeral, network-isolated containers destroyed immediately upon completion.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="mt-12 space-y-10 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Section 1 */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              1. Information We Collect
            </h2>
            <div className="space-y-3">
              <p>
                To provide CodeGuardian AI services, we collect minimal data strictly necessary for account management and security verification:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                <li><strong className="text-slate-800 dark:text-slate-200">Account Credentials:</strong> Name, work email address, and cryptographically hashed passwords (salted bcrypt). We never store plaintext passwords.</li>
                <li><strong className="text-slate-800 dark:text-slate-200">Analysis Metadata:</strong> Timestamps, language types (e.g., Python, TypeScript), aggregate quality scores, and defect counts. This metadata powers your personal Dashboard and Audit History.</li>
                <li><strong className="text-slate-800 dark:text-slate-200">Session &amp; Device Telemetry:</strong> Anonymized browser headers, IP addresses for rate limiting and brute-force mitigation, and authentication session tokens.</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              2. Source Code Handling &amp; Ephemeral Analysis
            </h2>
            <p className="mb-3">
              When you submit code via the CodeGuardian AI Workspace or REST API:
            </p>
            <div className="rounded-xl border border-blue-200 dark:border-cyan-500/20 bg-blue-50/80 dark:bg-cyan-950/20 p-4 mb-4 text-blue-900 dark:text-cyan-200 text-xs">
              <strong className="text-blue-700 dark:text-cyan-300 block mb-1">Ephemeral In-Memory Pipeline:</strong>
              Code is parsed directly into an Abstract Syntax Tree (AST) in volatile RAM. Once rule evaluation, vulnerability matching, and metric calculations finish, the memory buffer is garbage collected and released.
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              We do not create persistent database records of your source code unless you explicitly click &quot;Save Snippet&quot; or &quot;Bookmark Analysis&quot; within your authenticated workspace.
            </p>
          </section>

          {/* Section 3 */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              3. Artificial Intelligence &amp; Third-Party LLM Policy
            </h2>
            <p className="mb-3">
              CodeGuardian AI utilizes specialized machine learning models (such as fine-tuned CodeBERT classifiers) alongside rule-based AST analyzers to detect code smells and predict defects.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
              <li><strong className="text-slate-800 dark:text-slate-200">Strict Non-Training Agreement:</strong> Under no circumstances is customer source code utilized to train, retrain, or improve public foundation models.</li>
              <li><strong className="text-slate-800 dark:text-slate-200">Zero Third-Party Model Leaks:</strong> Automated patch suggestions and reasoning are executed in isolated API sessions with strict zero-data-retention headers enabled.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              4. Your Rights &amp; Data Ownership (GDPR &amp; CCPA)
            </h2>
            <p className="mb-3">
              You maintain 100% intellectual property ownership over all code and inputs processed through CodeGuardian AI. You have the right to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">Instant Audit History Deletion</span>
                <span className="text-slate-500 dark:text-slate-400">Delete any past analysis record or clear your entire audit log with one click in History.</span>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">Full Account Erasure</span>
                <span className="text-slate-500 dark:text-slate-400">Permanently delete your profile, credentials, and settings at any time in Settings.</span>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">Export Data Portability</span>
                <span className="text-slate-500 dark:text-slate-400">Export your analysis findings, defect summaries, and generated tests in JSON or Markdown format.</span>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">Zero Commercial Data Sale</span>
                <span className="text-slate-500 dark:text-slate-400">We do not sell, rent, or trade your personal information or metadata to any third party.</span>
              </div>
            </div>
          </section>

          {/* Section 5: Contact */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600 dark:text-cyan-400" />
              5. Privacy Officer &amp; Inquiries
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              If you have questions regarding this Privacy Policy, enterprise data processing agreements (DPAs), or compliance inquiries, please contact our dedicated Privacy &amp; Security team:
            </p>
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white shadow-xs">
              <Mail className="h-4 w-4 text-blue-600 dark:text-cyan-400" />
              <span>privacy@codeguardian.ai</span>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
export default PrivacyPolicyPage
