import { useEffect, useState } from 'react';
import { Bell, MessageSquare, Star } from 'lucide-react';
import Modal from '../../components/common/Modal';

const loadFeedback = () => JSON.parse(localStorage.getItem('customerFeedback') || '[]');
const saveFeedback = (rows) => localStorage.setItem('customerFeedback', JSON.stringify(rows));

export default function Feedback() {
  const [feedback, setFeedback] = useState(loadFeedback);
  const [popupOpen, setPopupOpen] = useState(false);
  const [instantAlerts, setInstantAlerts] = useState(localStorage.getItem('feedbackInstantAlerts') === 'true');
  const [onlineReviews, setOnlineReviews] = useState(localStorage.getItem('feedbackOnlineReviews') !== 'false');
  const [form, setForm] = useState({ customer: '', rating: 5, comment: '' });

  useEffect(() => {
    setPopupOpen(true);
  }, []);

  const submit = () => {
    if (!form.customer.trim()) return alert('Customer name is required');
    if (!form.comment.trim()) return alert('Feedback comment is required');
    const next = [{ ...form, id: Date.now(), createdAt: new Date().toISOString() }, ...feedback];
    setFeedback(next);
    saveFeedback(next);
    setForm({ customer: '', rating: 5, comment: '' });
    setPopupOpen(false);
    if (instantAlerts) alert('Instant alert sent to the customer team');
  };

  const toggleAlerts = (value) => {
    setInstantAlerts(value);
    localStorage.setItem('feedbackInstantAlerts', String(value));
  };

  const toggleReviews = (value) => {
    setOnlineReviews(value);
    localStorage.setItem('feedbackOnlineReviews', String(value));
  };

  return (
    <div className="so-module-page">
      <div className="so-titlebar">
        <h1 className="so-title">Feedback</h1>
        <button type="button" onClick={() => setPopupOpen(true)} className="so-btn-primary text-sm">
          <MessageSquare size={15} /> New Feedback
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-5">
        <button type="button" onClick={() => toggleAlerts(!instantAlerts)} className="so-table-panel flex min-h-[112px] items-center justify-between p-5 text-left">
          <div>
            <div className="text-lg font-semibold text-[#101828]">Receive Instant Alerts</div>
            <div className="mt-1 text-sm text-[#667085]">Notify the team when low ratings or new feedback arrive.</div>
          </div>
          <span className={`so-settings-switch ${instantAlerts ? 'so-settings-switch-on' : ''}`} />
        </button>
        <button type="button" onClick={() => toggleReviews(!onlineReviews)} className="so-table-panel flex min-h-[112px] items-center justify-between p-5 text-left">
          <div>
            <div className="text-lg font-semibold text-[#101828]">Online Reviews</div>
            <div className="mt-1 text-sm text-[#667085]">Collect review-ready comments from happy customers.</div>
          </div>
          <span className={`so-settings-switch ${onlineReviews ? 'so-settings-switch-on' : ''}`} />
        </button>
      </div>

      <section className="so-table-panel">
        <table className="so-table">
          <thead>
            <tr><th>Customer</th><th>Rating</th><th>Feedback</th><th>Received</th></tr>
          </thead>
          <tbody>
            {feedback.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-[#667085]">No feedback yet.</td></tr>}
            {feedback.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">{row.customer}</td>
                <td><span className="inline-flex items-center gap-1 text-[#b45309]"><Star size={15} fill="currentColor" /> {row.rating}</span></td>
                <td>{row.comment}</td>
                <td>{new Date(row.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal isOpen={popupOpen} onClose={() => setPopupOpen(false)} title="Customer Feedback" size="md">
        <div className="space-y-4">
          <div className="rounded-[4px] border border-[#dbeafe] bg-[#eff6ff] p-3 text-sm text-[#1d4ed8]">
            <Bell size={15} className="mr-1 inline" /> Feedback popup is active for customer feedback capture.
          </div>
          <label className="block">
            <span className="so-label">Customer</span>
            <input className="so-input w-full" value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })} placeholder="Customer name" />
          </label>
          <label className="block">
            <span className="so-label">Rating</span>
            <select className="so-input so-select w-full" value={form.rating} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })}>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} Star</option>)}
            </select>
          </label>
          <label className="block">
            <span className="so-label">Comment</span>
            <textarea className="so-input min-h-[96px] w-full" value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} placeholder="Write customer feedback" />
          </label>
          <button type="button" onClick={submit} className="so-btn-primary w-full justify-center">Save Feedback</button>
        </div>
      </Modal>
    </div>
  );
}
