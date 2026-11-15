import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/axios';

const editablePreferences = data => ({ ...data, subscribed: Boolean(data.subscribed || data.pendingConfirmation) });

export default function EmailPreferences() {
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    apiClient.get('/marketing/preferences').then(({ data }) => { if (active) setForm(editablePreferences(data)); })
      .catch(() => { if (active) setMessage('Unable to load email preferences. Please reload the page.'); });
    return () => { active = false; };
  }, []);
  async function save(event) {
    event.preventDefault(); setSaving(true); setMessage('');
    try { const { data } = await apiClient.put('/marketing/preferences', form); setForm(editablePreferences(data)); setMessage(data.pendingConfirmation ? 'Check your inbox and confirm your subscription. Offers will start only after confirmation.' : 'Email preferences saved.'); }
    catch { setMessage('Unable to save preferences. Please try again.'); }
    finally { setSaving(false); }
  }
  return <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
    <h2 className="text-lg font-bold">Product alerts and offers</h2>
    <p className="text-sm text-gray-600">Choose whether to receive relevant new arrivals and offers by email. We use these preferences and successful purchases to select products for you.</p>
    {form && <form onSubmit={save} className="space-y-4">
      <label className="flex gap-3 items-start"><input type="checkbox" checked={form.subscribed} onChange={e => setForm({ ...form, subscribed: e.target.checked })} className="mt-1" />Email me relevant products and promotions. I can unsubscribe at any time.</label>
      <label className="block text-sm font-medium">Interests or main uses
        <input className="block border rounded-lg p-2 w-full mt-1" maxLength={500} value={form.interests} placeholder="gaming, office, studying, travel, headphones" onChange={e => setForm({ ...form, interests: e.target.value })} />
        <span className="text-xs text-gray-500">Optional, separated by commas. Matches product categories and tags.</span>
      </label>
      <label className="block text-sm font-medium">Preferred brands
        <input className="block border rounded-lg p-2 w-full mt-1" maxLength={500} value={form.brands} placeholder="Samsung, Sony, Anker" onChange={e => setForm({ ...form, brands: e.target.value })} />
      </label>
      <button disabled={saving} className="bg-gray-950 text-white px-4 py-2 rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save email preferences'}</button>
    </form>}
    {!form && !message && <p>Loading preferences...</p>}
    <p role="status" className="text-sm">{message}</p>
  </section>;
}
