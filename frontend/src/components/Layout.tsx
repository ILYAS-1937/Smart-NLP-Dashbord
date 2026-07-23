import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      {/* Barre latérale fixe */}
      <Sidebar />

      {/* Contenu principal de l'application */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}