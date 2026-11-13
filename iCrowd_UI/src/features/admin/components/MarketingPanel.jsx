import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/axios';
export default function MarketingPanel() {
  const [data, setData] = useState(null);
  const [audience, setAudience] = useState(null);
  const [error, setError] = useState('');
  async function refresh() {
    try { setData((await apiClient.get('/admin/marketing')).data); setError(''); }
    catch { setError('Unable to load email campaigns.'); }
  }
  useEffect(() => { let active = true;
    apiClient.get('/admin/marketing').then(r => { if (active) setData(r.data); }).catch(() => { if (active) setError('Unable to load email campaigns.'); });
    return () => { active = false; };
  }, []);
  async function preview(id) {
    setAudience(null);
    try { setAudience({ id, rows: (await apiClient.get(`/admin/marketing/${id}/audience`)).data }); setError(''); }
    catch { setError('Unable to preview recipients.'); }
  }
  return <section className="bg-white border rounded-2xl p-5 space-y-3">
    <div className="flex justify-between"><h2 className="font-bold text-lg">Targeted email campaigns</h2><button type="button" className="underline" onClick={refresh}>Refresh</button></div>
    {data && <>
      <p className="text-sm">Delivery {data.enabled ? 'enabled' : 'disabled — configure the sender before enabling'}. Limit: {data.dailyLimit} attempts per 24 hours; {data.weeklyCustomerLimit} per customer per 7 days.</p>
      <p className="text-xs text-gray-500">New products and promotions create campaigns automatically. Only subscribed customers with matching interests qualify. Queue updates can take a minute.</p>
      <div className="overflow-auto"><table className="w-full text-sm text-left"><thead><tr><th>Campaign</th><th>Queued</th><th>Sent</th><th>Retry</th><th>Failed / unconfirmed</th><th>Skipped</th><th>Audience</th></tr></thead>
        <tbody>{data.campaigns.map(c => <tr key={c.id} className="border-t"><td className="py-3">{c.kind === 'PRODUCT' ? 'New product' : 'Promotion'} #{c.sourceId}</td><td>{c.queued}</td><td>{c.sent}</td><td>{c.retry}</td><td>{c.failed + c.sending}</td><td>{c.skipped}</td><td><button className="underline" onClick={() => preview(c.id)}>Preview matches</button></td></tr>)}</tbody>
      </table></div>
      {!data.campaigns.length && <p className="text-sm">No campaigns yet. Publish a new product or create a promotion to start.</p>}
    </>}
    {audience && <div className="border-t pt-3"><h3 className="font-semibold">Current matches for campaign #{audience.id}</h3><p className="text-xs text-gray-500">Matching customers before frequency limits. This does not resend a prepared campaign.</p>
      {!audience.rows.length && <p>No eligible matches.</p>}
      <ul className="max-h-64 overflow-auto">{audience.rows.map(a => <li key={a.userId} className="text-sm py-2">{a.email} — {a.productName} — {a.reason} (score {a.score})</li>)}</ul></div>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </section>;
}
