import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/axios';
import StorefrontHero from '../../products/components/StorefrontHero';
import { defaultHero } from '../../products/heroConfig';

export default function AdminStorefront() {
  const [hero, setHero] = useState(defaultHero);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [resetImage, setResetImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let current = true;
    apiClient.get('/storefront/hero').then(({ data }) => { if (current) setHero(data); }).catch(() => { if (current) setError('Could not load the banner. Refresh to try again.'); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const chooseImage = event => {
    const selected = event.target.files[0];
    if (!selected) return;
    setMessage('');
    if (!['image/png', 'image/jpeg'].includes(selected.type) || selected.size > 5 * 1024 * 1024) { setError('Choose a JPEG or PNG smaller than 5 MB.'); event.target.value = ''; return; }
    setError(''); setResetImage(false); setFile(selected); setPreview(URL.createObjectURL(selected));
  };
  const save = async event => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const form = new FormData(); form.append('headline', hero.headline); form.append('subtitle', hero.subtitle); form.append('resetImage', String(resetImage));
    if (file) form.append('image', file);
    try {
      const { data } = await apiClient.put('/admin/storefront/hero', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setHero(data); setFile(null); setPreview(''); setResetImage(false); setMessage('Homepage banner saved. Your customers can see it now.');
    } catch { setError('Could not save the banner. Use a JPEG or PNG, 800 × 300 to 6000 × 4000 pixels, under 5 MB, and try again.'); }
    finally { setBusy(false); }
  };
  return <div className="mx-auto max-w-6xl space-y-6"><header><h1 className="text-3xl font-bold">Homepage banner</h1><p className="mt-2 text-slate-600">Choose the image and message customers see when they visit your store.</p></header>
    {loading ? <p role="status">Loading banner…</p> : <>
      <div className="overflow-hidden rounded-3xl border border-slate-200"><StorefrontHero hero={hero} previewImage={resetImage ? '/images/storefront-hero.png' : preview}/></div>
      <form onSubmit={save} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
          <div><label htmlFor="banner-headline" className="block font-semibold">Headline</label><input id="banner-headline" required maxLength={80} value={hero.headline} onChange={event => setHero({ ...hero, headline: event.target.value })} className="mt-2 block w-full rounded-xl border border-slate-300 p-3"/></div>
          <div><label htmlFor="banner-description" className="block font-semibold">Description</label><textarea id="banner-description" required maxLength={180} value={hero.subtitle} onChange={event => setHero({ ...hero, subtitle: event.target.value })} className="mt-2 block w-full rounded-xl border border-slate-300 p-3" rows={2}/></div>
          <div><label htmlFor="banner-image" className="block font-semibold">Banner image</label><input id="banner-image" type="file" accept="image/jpeg,image/png" onChange={chooseImage} className="mt-2 block w-full text-sm"/></div>
          <p className="text-sm text-slate-500">JPEG or PNG, up to 5 MB. A wide image with space on the left works best. Preview above before saving.</p>
          <div className="flex flex-wrap gap-3"><button type="button" onClick={() => { setFile(null); setPreview(''); setResetImage(true); setMessage(''); }} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold">Use default image</button><button className="rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white">{busy ? 'Saving…' : 'Save banner'}</button></div>
        </fieldset>
        {error && <p role="alert" className="text-red-700">{error}</p>}{message && <p role="status" className="text-emerald-700">{message}</p>}
      </form>
    </>}
  </div>;
}
