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
    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 pointer-events-auto">
      <motion.div
        ref={containerRef}
        drag="x"
        dragConstraints={{ left: -15, right: 15 }}
        dragElastic={0.15}
        whileDrag={{ scale: 1.02 }}
        className="mx-auto max-w-md bg-white/80 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-full p-1.5 ring-1 ring-slate-900/5 flex items-center justify-between relative overflow-hidden select-none"
      >
        {/* Glass reflection highlight */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60 pointer-events-none -translate-x-full animate-pulse" />

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 flex-1 justify-around relative z-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full transition-colors duration-200 z-10 ${
                  isActive ? 'text-white font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {/* Liquid Glass Animated Active Pill */}
                {isActive && (
                  <motion.div
                    layoutId="liquidGlassPill"
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 30,
                    }}
                    className="absolute inset-0 bg-slate-900 shadow-lg shadow-slate-950/20 rounded-full border border-slate-700/60 -z-10"
                  />
                )}

                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Add Event Liquid Blue Action Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onAddEventClick}
          className="relative z-10 flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all shrink-0 ml-1 active:scale-95 border border-blue-400/40"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span>Add</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
