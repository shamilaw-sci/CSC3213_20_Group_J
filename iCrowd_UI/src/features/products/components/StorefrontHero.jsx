import { Link } from 'react-router-dom';
import { defaultHero, heroImageUrl } from '../heroConfig';

export default function StorefrontHero({ hero = defaultHero, previewImage }) {
  return <section className="relative isolate overflow-hidden bg-[#081322]">
    <img src={previewImage || heroImageUrl(hero)} alt="Smartphone, headphones and everyday electronics" fetchPriority="high" onError={event => { event.currentTarget.src = '/images/storefront-hero.png'; }} className="absolute inset-0 -z-20 h-full w-full object-cover object-[65%_center] md:object-center"/>
    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-950/60 to-slate-950/10 md:via-slate-950/30"/>
    <div className="mx-auto flex min-h-[440px] max-w-7xl items-center px-6 py-16 sm:min-h-[520px] lg:px-8">
      <div className="max-w-xl"><p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">Your next everyday essential</p>
        <h1 className="max-w-lg text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl">{hero.headline || defaultHero.headline}</h1>
        <p className="mt-6 max-w-md text-base leading-7 text-slate-200 sm:text-lg">{hero.subtitle || defaultHero.subtitle}</p>
        <Link to="/search" className="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 font-semibold text-slate-950 shadow-sm hover:bg-blue-50">Shop now <span className="ml-3" aria-hidden="true">→</span></Link>
      </div>
    </div>
  </section>;
}
