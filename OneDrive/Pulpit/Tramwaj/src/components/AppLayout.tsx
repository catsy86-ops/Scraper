/**
 * AppLayout — wraps every page with TopBar + BottomNav.
 * Content is offset by bottom nav height on mobile so nothing gets hidden.
 */
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  backTo?: string;
}

export default function AppLayout({ children, title, backTo }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar title={title} backTo={backTo} />
      {/* pb-20 = bottom nav height on mobile */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
