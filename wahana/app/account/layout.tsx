import { AccountNav } from "@/components/account-nav";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-5 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-[7.5rem] lg:self-start">
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
