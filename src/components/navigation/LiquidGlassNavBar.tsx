'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ListOrdered, Map, BarChart2, Plus } from 'lucide-react';

interface LiquidGlassNavBarProps {
  activeTab: 'timeline' | 'map' | 'stats';
  onTabChange: (tab: 'timeline' | 'map' | 'stats') => void;
  onAddEventClick: () => void;
}

export default function LiquidGlassNavBar({
  activeTab,
  onTabChange,
  onAddEventClick,
}: LiquidGlassNavBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'timeline' as const, label: 'Timeline', icon: ListOrdered },
    { id: 'map' as const, label: 'Map', icon: Map },
    { id: 'stats' as const, label: 'Metrics', icon: BarChart2 },
  ];

  return (
    <div className="lg:hidden fixed bottom-4 left-3 right-3 z-50 pointer-events-auto">
      <motion.div
        ref={containerRef}
        drag="x"
        dragConstraints={{ left: -10, right: 10 }}
        dragElastic={0.1}
        whileDrag={{ scale: 1.01 }}
        className="mx-auto max-w-md bg-white/90 backdrop-blur-2xl border border-white/80 shadow-2xl rounded-full px-2 py-1.5 ring-1 ring-slate-900/5 flex items-center justify-between relative select-none"
      >
        {/* Glass reflection highlight overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60 pointer-events-none -translate-x-full animate-pulse overflow-hidden" />

        {/* Tab Buttons */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-1 justify-around relative z-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full transition-colors duration-200 z-10 shrink-0 ${
                  isActive ? 'text-white font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {/* Liquid Glass Animated Active Pill */}
                {isActive && (
                  <motion.div
                    layoutId="liquidGlassPill"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 32,
                    }}
                    className="absolute inset-0 bg-slate-900 shadow-md shadow-slate-950/20 rounded-full border border-slate-700/60 -z-10"
                  />
                )}

                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Add Event Action Button (Uncropped) */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={onAddEventClick}
          className="relative z-10 flex items-center gap-1 text-[11px] sm:text-xs font-bold px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all shrink-0 ml-1 active:scale-95 border border-blue-400/40"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>Add</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
