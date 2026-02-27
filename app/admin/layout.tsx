export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-white">
      {children}
    </div>
  );
}
