import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className={isMobile ? "flex-1 pt-16 px-4 pb-4" : "ml-64 flex-1 p-8"}>
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
