import React from 'react';
import { CalendarCheck, ChevronRight, Inbox, PlusCircle } from 'lucide-react';
import { Booking } from '../../types';

interface UpcomingEventsListProps {
  events?: Booking[];
  onViewCalendar?: () => void;
  onCreateBooking?: () => void;
}

export const UpcomingEventsList: React.FC<UpcomingEventsListProps> = ({
  events = [],
  onViewCalendar,
  onCreateBooking,
}) => {
  const isEmpty = !events || events.length === 0;

  return (
    <div className="flex flex-col rounded-xl bg-white p-5 border border-slate-200/80 shadow-xs h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-slate-800 font-['Plus_Jakarta_Sans']">
            Upcoming Events
          </h3>
        </div>
        <button
          type="button"
          onClick={onViewCalendar}
          className="inline-flex items-center gap-1 text-xs text-teal-700 font-semibold hover:text-teal-800 transition-colors"
        >
          <span>[View Calendar]</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider rounded-md">
              <th className="py-2.5 px-3 rounded-l-md">Event Name</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Hall</th>
              <th className="py-2.5 px-3 text-right rounded-r-md">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isEmpty ? (
              <tr>
                <td colSpan={4} className="py-12 px-3 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Inbox className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-slate-500 text-xs font-['Plus_Jakarta_Sans']">
                      No upcoming events.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              events.map((evt, idx) => (
                <tr key={evt.id || idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800">
                    {evt.eventType || evt.customerName}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                    {evt.date}
                  </td>
                  <td className="py-3 px-3 text-slate-700">{evt.hallName}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700">
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
