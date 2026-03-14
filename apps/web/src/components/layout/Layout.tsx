import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import SupportBot from '@/components/chat/SupportBot';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-sky-100 to-sky-200 dark:from-sky-950 dark:via-slate-950 dark:to-sky-950">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <SupportBot />
    </div>
  );
}

