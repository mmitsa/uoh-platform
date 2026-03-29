import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setLocale } from '../i18n';
import { useAuth, type AppRole } from '../app/auth';
import { GrayModeToggle } from '../components/GrayModeToggle';

const DEMO_ROLES: { role: AppRole; labelAr: string; labelEn: string; descAr: string; descEn: string }[] = [
  {
    role: 'SystemAdmin',
    labelAr: 'م. خالد المهندس — مدير النظام',
    labelEn: 'Eng. Khalid — System Admin',
    descAr: 'صلاحيات كاملة لإدارة النظام والمستخدمين',
    descEn: 'Full system & user administration access',
  },
  {
    role: 'CommitteeHead',
    labelAr: 'د. فهد العميد — رئيس لجنة',
    labelEn: 'Dr. Fahad — Committee Head',
    descAr: 'اعتماد المحاضر والقرارات وإدارة اللجان',
    descEn: 'Approve minutes, decisions & manage committees',
  },
  {
    role: 'CommitteeSecretary',
    labelAr: 'أ. نورة الكاتبة — أمينة لجنة',
    labelEn: 'Ms. Noura — Committee Secretary',
    descAr: 'إدارة الاجتماعات والمحاضر والاستبيانات',
    descEn: 'Manage meetings, minutes, and surveys',
  },
  {
    role: 'CommitteeMember',
    labelAr: 'د. أحمد الباحث — عضو لجنة',
    labelEn: 'Dr. Ahmed — Committee Member',
    descAr: 'المشاركة في الاجتماعات والتصويت والمهام',
    descEn: 'Participate in meetings, voting & tasks',
  },
  {
    role: 'Observer',
    labelAr: 'أ. ريم المراقبة — مراقبة',
    labelEn: 'Ms. Reem — Observer',
    descAr: 'عرض الاجتماعات والمحاضر والتقارير فقط',
    descEn: 'View meetings, minutes & reports only',
  },
];

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const isAr = i18n.language === 'ar';

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || t('login.failed'));
    } finally {
      setLoading(false);
    }
  }

  function handleDemoLogin(role: AppRole) {
    demoLogin(role);
  }

  return (
    <div className="relative flex min-h-screen">
      {/* Left/Start panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 p-12 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -start-20 h-80 w-80 rounded-full bg-neutral-0/5" />
        <div className="absolute top-1/3 end-[-60px] h-60 w-60 rounded-full bg-neutral-0/5" />
        <div className="absolute bottom-[-40px] start-1/4 h-48 w-48 rounded-full bg-neutral-0/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-0/15 backdrop-blur-sm">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold">{t('university')}</div>
              <div className="text-sm text-white/70">{t('appName')}</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
            {isAr ? 'منصة إدارة المجالس\nواللجان والاجتماعات' : 'Meetings &\nCommittees\nManagement Platform'}
          </h1>
          <p className="max-w-md text-lg text-white/80 leading-relaxed">
            {isAr
              ? 'نظام متكامل لإدارة اللجان والاجتماعات ومحاضر الجلسات والتصويت والمهام والاستبيانات.'
              : 'An integrated system for managing committees, meetings, minutes, voting, tasks, and surveys.'}
          </p>
          <div className="flex gap-6 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              {isAr ? 'آمن ومحمي' : 'Secure & Protected'}
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
              </svg>
              {isAr ? 'عربي / English' : 'Arabic / English'}
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/40">
          &copy; {new Date().getFullYear()} {t('university')}
        </div>
      </div>

      {/* Right/End panel - login form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
        {/* Top bar for mobile + controls */}
        <div className="absolute top-4 end-4 flex items-center gap-2">
          <GrayModeToggle />
          <div className="flex rounded-md border border-neutral-200 bg-neutral-50 text-xs font-medium">
            <button
              type="button"
              className={[
                'px-2.5 py-1.5 rounded-s-md transition-colors',
                isAr ? 'bg-brand-700 text-white' : 'text-neutral-600 hover:bg-neutral-100',
              ].join(' ')}
              onClick={() => setLocale('ar')}
            >
              ع
            </button>
            <button
              type="button"
              className={[
                'px-2.5 py-1.5 rounded-e-md transition-colors',
                !isAr ? 'bg-brand-700 text-white' : 'text-neutral-600 hover:bg-neutral-100',
              ].join(' ')}
              onClick={() => setLocale('en')}
            >
              En
            </button>
          </div>
        </div>

        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700 text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-900">{t('appName')}</div>
              <div className="text-xs text-neutral-500">{t('university')}</div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto lg:mx-0">
          <h2 className="text-2xl font-bold text-neutral-900">{t('login.title')}</h2>
          <p className="mt-2 text-sm text-neutral-500">{t('login.subtitle')}</p>

          {/* Login form */}
          {!showDemo && (
            <form onSubmit={(e) => void handleLogin(e)} className="mt-8 space-y-5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  {t('login.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isAr ? 'user@uoh.edu.sa' : 'user@uoh.edu.sa'}
                  dir="ltr"
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-0 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  {t('login.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-0 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {loading && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {t('actions.login')}
              </button>

              {/* Demo access — hidden in production builds */}
              {!import.meta.env.PROD && (
                <>
                  <div className="relative py-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-neutral-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-neutral-0 px-3 text-xs text-neutral-400">{t('login.or')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDemo(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-neutral-0 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                    </svg>
                    {t('login.demoAccess')}
                  </button>
                </>
              )}
            </form>
          )}

          {/* Demo role selection — hidden in production builds */}
          {!import.meta.env.PROD && showDemo && (
            <div className="mt-8 space-y-3">
              <p className="text-sm text-neutral-600">{t('login.selectRole')}</p>

              <div className="space-y-2">
                {DEMO_ROLES.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleDemoLogin(item.role)}
                    className="group flex w-full items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-0 px-4 py-3 text-start transition-all hover:border-brand-300 hover:bg-brand-50 hover:shadow-sm"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 transition-colors group-hover:bg-brand-100 group-hover:text-brand-700">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-neutral-900 group-hover:text-brand-800">
                        {isAr ? item.labelAr : item.labelEn}
                      </div>
                      <div className="text-xs text-neutral-500 group-hover:text-brand-600">
                        {isAr ? item.descAr : item.descEn}
                      </div>
                    </div>
                    <svg className="h-4 w-4 shrink-0 text-neutral-400 transition-colors group-hover:text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowDemo(false)}
                className="mt-3 w-full text-center text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                {t('login.backToLogin')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
