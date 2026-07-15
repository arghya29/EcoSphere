import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InteractiveDemo } from '@/components/landing/interactive-demo';
import { Ship, Factory, Plug, FileBarChart, Github } from 'lucide-react';
import { useLocale } from 'next-intl';

export default function LandingPage() {
  const locale = useLocale();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2 font-display text-lg font-semibold">
            <Ship className="h-5 w-5" aria-hidden="true" />
            EcoSphere
          </Link>
          <nav className="flex items-center gap-3" aria-label="Primary">
            <a
              href="https://github.com/arghya29/EcoSphere"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground sm:flex"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              GitHub
            </a>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${locale}/login`}>Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/${locale}/signup`}>Sign up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <section className="container py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Open-source · free to self-host
            </span>
            <h1 className="mt-5 text-balance font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              See exactly where your supply chain burns carbon.
            </h1>
            <p className="mt-4 text-balance text-lg text-muted-foreground">
              Map suppliers, routes, and facilities on one canvas. EcoSphere computes Scope 1, 2, and 3
              emissions from the data you already have, and flags the hotspots worth fixing first.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href={`/${locale}/signup`}>Start mapping your supply chain</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#demo">Try the demo below</a>
              </Button>
            </div>
          </div>
        </section>

        <section id="demo" className="container pb-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-1 text-center font-display text-2xl font-semibold">Try it without signing up</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Pick an industry. The network graph and scope breakdown update instantly — no server calls,
              no account needed.
            </p>
            <InteractiveDemo />
          </div>
        </section>

        <section className="border-t border-border bg-muted/40 py-16">
          <div className="container">
            <h2 className="mb-10 text-center font-display text-2xl font-semibold">How it works</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              <FeatureCard
                icon={<Plug className="h-5 w-5" aria-hidden="true" />}
                title="Upload your data"
                text="Import suppliers, facilities, and routes from CSV or Excel. No special schema to learn — we provide templates."
              />
              <FeatureCard
                icon={<Factory className="h-5 w-5" aria-hidden="true" />}
                title="See your emissions"
                text="Scope 1, 2, and 3 totals are calculated automatically using published emission factors, broken down by supplier, facility, and route."
              />
              <FeatureCard
                icon={<FileBarChart className="h-5 w-5" aria-hidden="true" />}
                title="Get the hotspots"
                text="Rule-based insights surface your biggest emitters and concrete mode-shift opportunities, then export everything as a report."
              />
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container">
            <p className="mb-4 text-center text-xs uppercase tracking-wide text-muted-foreground">
              Built entirely on free, open-source tools
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-muted-foreground">
              {['Next.js', 'React Flow', 'Leaflet', 'Recharts', 'Tailwind CSS', 'NextAuth.js', 'Prisma', 'Neon'].map(
                (name) => (
                  <span key={name}>{name}</span>
                )
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} EcoSphere. Open-source under the Apache 2.0 license.</p>
          <div className="flex gap-4">
            <a href="https://github.com/arghya29/EcoSphere" target="_blank" rel="noreferrer" className="hover:text-foreground">
              GitHub
            </a>
            <Link href={`/${locale}/login`} className="hover:text-foreground">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
        {icon}
      </div>
      <h3 className="mb-2 font-display text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
