'use client';

import React, { useEffect, useState } from 'react';
import { LocationData, RouteMatrixCell } from '@/types';
import { formatDistance, formatDuration } from '@/lib/optimizer/constraints';
import { Grid, X, Clock, Navigation, MapPin, RefreshCw } from 'lucide-react';

interface RouteMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: LocationData[];
}

export default function RouteMatrixModal({
  isOpen,
  onClose,
  locations,
}: RouteMatrixModalProps) {
  const [matrix, setMatrix] = useState<RouteMatrixCell[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMatrixData();
    }
  }, [isOpen]);

  const fetchMatrixData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/routes/matrix');
      const data = await res.json();
      if (data.success && data.matrix) {
        setMatrix(data.matrix);
      }
    } catch (err) {
      console.error('Error fetching route matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getCell = (originId: string, destId: string) => {
    if (originId === destId) return { text: '—', isSelf: true };
    const cell = matrix.find((m) => m.originId === originId && m.destinationId === destId);
    if (!cell) return { text: 'N/A', isSelf: false };
    return {
      text: `${formatDuration(cell.durationSeconds)} (${formatDistance(cell.distanceMeters)})`,
      isSelf: false,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Google Routes Matrix Inspector</h3>
              <p className="text-xs text-slate-500">Origin ↔ Destination driving times & distance matrix grid</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMatrixData}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
              title="Refresh matrix"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3 border-r border-slate-200 sticky left-0 bg-slate-50 z-10">Origin \ Destination</th>
                {locations.map((loc) => (
                  <th key={loc.id} className="p-3 border-r border-slate-200 min-w-[140px] truncate">
                    {loc.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locations.map((orig) => (
                <tr key={orig.id} className="hover:bg-blue-50/40">
                  <td className="p-3 font-bold text-slate-800 border-r border-slate-200 sticky left-0 bg-white z-10 truncate max-w-[180px]">
                    {orig.name}
                  </td>
                  {locations.map((dest) => {
                    const { text, isSelf } = getCell(orig.id, dest.id);
                    return (
                      <td
                        key={dest.id}
                        className={`p-3 border-r border-slate-100 text-slate-600 font-medium ${
                          isSelf ? 'bg-slate-100/60 text-slate-400 text-center font-bold' : ''
                        }`}
                      >
                        {text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500 shrink-0">
          <span>Powered by Google Routes Platform API</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
