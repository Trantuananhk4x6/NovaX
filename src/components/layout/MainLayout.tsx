'use client';
// ============================================================================
// MainLayout — App Shell with Sidebar + 3D Background
// ============================================================================

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from './Sidebar';
import { useApp } from '@/context/AppContext';

// Dynamic import Scene3D to avoid SSR issues with Three.js
const Scene3D = dynamic(() => import('@/components/3d/Scene3D'), {
  ssr: false,
});

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useApp();

  return (
    <div className="app-layout">
      {/* 3D Particle Background */}
      <Suspense fallback={null}>
        <Scene3D />
      </Suspense>

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="page-container fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
