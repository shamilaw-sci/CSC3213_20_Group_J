import { apiClient } from '../../lib/axios';

export const defaultHero = { headline: 'Upgrade your everyday.', subtitle: 'Discover smartphones, audio and accessories made for the way you live.' };
export const heroImageUrl = hero => hero?.imageUrl ? `${apiClient.defaults.baseURL.replace(/\/$/, '')}${hero.imageUrl}` : '/images/storefront-hero.png';

