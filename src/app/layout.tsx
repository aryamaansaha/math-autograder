import '@/styles/globals.css';

export const metadata = {
  title: 'Goblins Auto-Grader',
  description: 'AI-powered math grading system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

