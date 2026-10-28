import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  Trash2,
  Eye,
  RotateCcw,
  User,
  Phone,
  Tag,
  CheckCircle2,
  FileText,
  Save,
  X,
  Send,
  Calendar,
} from 'lucide-react';
import { FeedbackLogEntry } from '../../types';
import { feedbackApi } from '../../api/client';

export const FeedbackReviewsModule: React.FC = () => {
  // STRICT DATA RULE: DO NOT hardcode any dummy data.
  // Form starts with empty fields and structural placeholders.
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventType, setEventType] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [rawNotes, setRawNotes] = useState('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Recent Feedback Log (starts as empty array, then fetches from API)
  const [feedbackList, setFeedbackList] = useState<FeedbackLogEntry[]>([]);
  const [selectedFeedbackModal, setSelectedFeedbackModal] = useState<FeedbackLogEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    feedbackApi.list()
      .then((data) => {
        if (isMounted) setFeedbackList(data);
      })
      .catch(() => {
        if (isMounted) setFeedbackList([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Reset Form
  const handleResetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setEventType('');
    setRating(0);
    setHoverRating(0);
    setRawNotes('');
  };

  // Save Feedback: Appends new record to Recent Feedback Log and persists to API
  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Partial<FeedbackLogEntry> = {
      customerName: customerName.trim() || 'Valued Guest',
      customerPhone: customerPhone.trim() || '',
      eventType: eventType.trim() || 'General',
      rating: rating || 5,
      rawNotes: rawNotes.trim() || '',
      date: new Date().toISOString().split('T')[0],
    };

    try {
      const saved = await feedbackApi.create(payload);
      setFeedbackList([saved, ...feedbackList]);
      handleResetForm();
      showToast('Feedback saved successfully!');
    } catch {
      // Local fallback in case of temporary network issue
      const fallbackEntry: FeedbackLogEntry = {
        id: `FDB-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        customerName: payload.customerName || 'Valued Guest',
        customerPhone: payload.customerPhone || '',
        eventType: payload.eventType || 'General',
        rating: payload.rating || 5,
        rawNotes: payload.rawNotes || '',
      };
      setFeedbackList([fallbackEntry, ...feedbackList]);
      handleResetForm();
      showToast('Feedback saved locally.');
    }
  };

  // Delete from log
  const handleDeleteEntry = async (id: string) => {
    try {
      await feedbackApi.delete(id);
    } catch {
      // ignore
    }
    setFeedbackList(feedbackList.filter((item) => item.id !== id));
    showToast('Feedback record deleted.');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Section: Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="p-2 rounded-xl bg-teal-50 text-[#00685f] border border-teal-100/80">
              <Star className="w-5 h-5 fill-[#00685f]" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              Client Feedback &amp; Reviews
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Record client feedback and track satisfaction.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetForm}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Reset form fields"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Form</span>
          </button>
        </div>
      </div>

      {/* Main Section: 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form ("Event Feedback Details") */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#00685f]" />
              <h2 className="text-base font-bold text-slate-800">
                Event Feedback Details
              </h2>
            </div>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60">
              Entry Form
            </span>
          </div>

          <form onSubmit={handleSaveFeedback} className="space-y-4">
            {/* Field 1: Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Customer Name</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="[Enter Customer Name]"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:border-[#00685f] transition-all"
              />
            </div>

            {/* Field 2: Customer Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Customer Phone (Optional)</span>
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="[Enter Customer WhatsApp e.g., 923001234567]"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:border-[#00685f] transition-all font-mono text-xs"
              />
            </div>

            {/* Field 3: Event Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Event Type</span>
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:border-[#00685f] transition-all"
              >
                <option value="">[Select Event Type]</option>
                <option value="Mehndi">Mehndi</option>
                <option value="Barat">Barat</option>
                <option value="Walima">Walima</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Field 4: Overall Rating (Star Rating Component - Clickable, default empty) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Overall Rating</span>
                </label>
                <span className="text-xs font-medium text-slate-500">
                  {rating > 0 ? (
                    <span className="text-amber-600 font-semibold">
                      {rating}.0 / 5.0 Stars
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono text-[11px]">[--]</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled =
                      (hoverRating || rating) >= starValue;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 rounded-lg hover:bg-white hover:shadow-2xs transition-all cursor-pointer focus:outline-none"
                        title={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 stroke-amber-500 drop-shadow-2xs'
                              : 'text-slate-300 stroke-slate-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setRating(0)}
                    className="ml-auto text-[11px] text-slate-400 hover:text-slate-600 underline font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Field 5: Raw Notes / Key Points */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Raw Notes / Feedback</span>
              </label>
              <textarea
                rows={4}
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                placeholder="[Enter rough notes e.g., Food was amazing, staff was polite, AC worked well]"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00685f]/30 focus:border-[#00685f] transition-all resize-none"
              />
            </div>

            {/* Primary Button: "Save Feedback" */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#00685f] hover:bg-[#00524a] text-white text-sm font-bold shadow-xs hover:shadow-md active:scale-[0.99] transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Feedback</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Recent Feedback Log Data Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col gap-4 min-h-[520px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#00685f]" />
                <h2 className="text-base font-bold text-slate-800">
                  Recent Feedback Log
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Logged records of client reviews and satisfaction ratings.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full w-fit">
              Total: {feedbackList.length}
            </span>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-semibold tracking-wider uppercase text-[11px]">
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Customer Name</th>
                  <th className="py-3 px-3.5">Event Type</th>
                  <th className="py-3 px-3.5">Rating</th>
                  <th className="py-3 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {feedbackList.length === 0 ? (
                  /* STRICT DATA RULE: Render empty state message when empty */
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-2.5">
                          <MessageSquare className="w-5 h-5 stroke-[1.5]" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">
                          No feedback recorded yet.
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                          Complete the form on the left and click &apos;Save Feedback&apos; to record customer reviews.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  feedbackList.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-3.5 font-mono text-slate-600 whitespace-nowrap">
                        {entry.date || '[--]'}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3.5 px-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{entry.customerName || '[--]'}</span>
                          {entry.customerPhone && entry.customerPhone !== '[--]' && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {entry.customerPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Event Type */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-[#00685f] border border-teal-200/60">
                          {entry.eventType || '[--]'}
                        </span>
                      </td>

                      {/* Rating (Stars) */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < entry.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-[11px] font-bold text-slate-700 ml-1">
                            {entry.rating ? `${entry.rating}.0` : '[--]'}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedFeedbackModal(entry)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#00685f] transition-colors cursor-pointer"
                            title="View Feedback Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Feedback"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal for Viewing Feedback */}
      {selectedFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="text-base font-bold text-slate-800">
                  Client Feedback Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeedbackModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                    Customer Name
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedFeedbackModal.customerName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                    Event Type
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedFeedbackModal.eventType}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                    Rating
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < selectedFeedbackModal.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="font-bold text-slate-700 ml-1">
                      {selectedFeedbackModal.rating}.0
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                    Date Recorded
                  </span>
                  <span className="font-mono text-slate-600">
                    {selectedFeedbackModal.date}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <span className="text-slate-500 uppercase font-semibold text-[10px] block mb-1">
                  Client Notes / Comments
                </span>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed font-sans text-xs">
                  &ldquo;{selectedFeedbackModal.rawNotes}&rdquo;
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              {selectedFeedbackModal.customerPhone && selectedFeedbackModal.customerPhone !== '[--]' && (
                <button
                  type="button"
                  onClick={() => {
                    const cleanPhone = (selectedFeedbackModal.customerPhone || '').replace(/\D/g, '');
                    const message = encodeURIComponent(
                      `Hello ${selectedFeedbackModal.customerName}, thank you for your feedback regarding your recent ${selectedFeedbackModal.eventType} event at MHMS!`
                    );
                    const url = `https://wa.me/${cleanPhone}?text=${message}`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 fill-white" />
                  <span>Contact on WhatsApp</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedFeedbackModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
