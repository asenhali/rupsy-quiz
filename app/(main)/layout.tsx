import BottomNav from "@/components/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <main className="content-area pb-[80px]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
