import PageShell from '@/components/layout/PageShell';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <PageShell showCart>{children}</PageShell>;
}
