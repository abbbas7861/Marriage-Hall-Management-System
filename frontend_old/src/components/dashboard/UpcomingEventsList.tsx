import React from 'react';
import { CalendarCheck, ChevronRight, Inbox } from 'lucide-react';
import { Booking } from '../../types';

interface UpcomingEventsListProps {
  events?: Booking[];
  onViewCalendar?: () => void;
  onCreateBooking?: () => void;
}

export const UpcomingEventsList: React.FC<UpcomingEventsListProps> = ({
  events = [],
  onViewCalendar,
}) => {
  const isEmpty = !events || events.length === 0;

  return (
    <div className="flex flex-col rounded-2xl bg-slate-800/60 backdrop-blur-md p-5 sm:p-6 border border-slate-700/50 shadow-xl h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-slate-100 font-['Plus_Jakarta_Sans']">
            Upcoming Events
          </h3>
        </div>
        <button
          type="button"
          onClick={onViewCalendar}
          className="inline-flex items-center gap-1 text-xs text-teal-400 font-semibold hover:text-teal-300 transition-colors cursor-pointer"
        >
          <span>[View Calendar]</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider rounded-lg">
              <th className="py-2.5 px-3 rounded-l-lg">Event Name</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Hall</th>
              <th className="py-2.5 px-3 text-right rounded-r-lg">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40 text-xs">
            {isEmpty ? (
              <tr>
                <td colSpan={4} className="py-12 px-3 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-400 text-xs font-['Plus_Jakarta_Sans']">
                      No upcoming events.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              events.map((evt, idx) => (
                <tr key={evt.id || idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {evt.eventType || evt.customerName}
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {evt.date}
                  </td>
                  <td className="py-3 px-3 text-slate-300">{evt.hallName}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/20 border border-teal-500/30 text-teal-300">
                      {evt.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
