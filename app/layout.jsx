export const metadata = {
  title: 'Marcel Spahr – Bewerbung',
  description: 'Private Bewerbungs-Webseite von Marcel Spahr (Wirtschaftsinformatik).',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: `
          tailwind = window.tailwind || {};
          tailwind.config = { theme: { extend: { colors: { ms: { 50:'#f0f8ff',100:'#e0f2fe',200:'#bae6fd',300:'#7dd3fc',400:'#38bdf8',500:'#0ea5e9',600:'#0284c7',700:'#0369a1' } } } } };
        `}} />
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="/static/app.css?v=6" />
      </head>
      <body className="bg-ms-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
