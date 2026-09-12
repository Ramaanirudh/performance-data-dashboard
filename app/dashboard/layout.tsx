export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="h-16 border-b border-gray-800 flex items-center px-6 shrink-0">
        <h1 className="text-xl font-bold">Data Dashboard</h1>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
