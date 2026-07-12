import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { FocusReset } from '@/components/shared/focus-reset';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardNav userName={session.user?.name ?? session.user?.email ?? 'Account'} />
      <main id="main" className="flex-1 bg-background min-w-0" tabIndex={-1}>
        <FocusReset />
        <div className="container-padding py-4 sm:py-6 md:container md:px-0 md:max-w-6xl md:py-6">{children}</div>
      </main>
    </div>
  );
}
