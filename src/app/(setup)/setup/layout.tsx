export default function SetupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
