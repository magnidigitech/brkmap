'use client';

import React, { useEffect, useState } from 'react';
import { CampaignContactData, EventData } from '@/types';
import { Phone, Users, User, X, UserCheck, Shield, Plus, Building } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData | null;
}

export default function ContactModal({
  isOpen,
  onClose,
  event,
}: ContactModalProps) {
  const [contacts, setContacts] = useState<CampaignContactData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      fetchContacts();
    }
  }, [isOpen, event]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts?eventId=${event?.id}`);
      const data = await res.json();
      if (data.success && data.contacts) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Event Contacts & Staff</h3>
              <p className="text-xs text-slate-500 truncate max-w-[220px]">{event.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contacts List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              No specific organizer contact assigned for this event.
            </div>
          ) : (
            contacts.map((c) => (
              <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" /> {c.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {c.role}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-1 text-blue-600 font-bold hover:underline"
                  >
                    <Phone className="w-3.5 h-3.5" /> {c.phone}
                  </a>

                  {c.expectedCrowd && (
                    <span className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                      <Users className="w-3 h-3 text-purple-600" /> Crowd: ~{c.expectedCrowd.toLocaleString()}
                    </span>
                  )}
                </div>

                {c.notes && <p className="text-[10px] text-slate-500 italic mt-0.5">{c.notes}</p>}
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
