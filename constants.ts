import { AspectRatio, Template, StockImage } from './types';

export const TEMPLATES: Template[] = [
  {
    id: 'studio_clean',
    name: 'Clean Studio',
    description: 'Minimalist background highlighting the subject',
    thumbnail: 'https://picsum.photos/200/200?grayscale',
    promptModifier: 'in a clean, modern studio setting with soft professional lighting, minimalist background'
  },
  {
    id: 'pub_warm',
    name: 'Tavern Warmth',
    description: 'Cozy, warm lighting with wood textures',
    thumbnail: 'https://picsum.photos/200/200?blur=2',
    promptModifier: 'inside a cozy, upscale tavern with warm ambient lighting, rich mahogany wood textures, and a welcoming atmosphere'
  },
  {
    id: 'neon_city',
    name: 'Neon City',
    description: 'Vibrant cyberpunk aesthetic',
    thumbnail: 'https://picsum.photos/200/200?random=1',
    promptModifier: 'in a vibrant futuristic city street at night with neon signage, wet pavement reflections, and cinematic cyan and magenta lighting'
  },
  {
    id: 'nature_calm',
    name: 'Serene Nature',
    description: 'Outdoor landscape with natural light',
    thumbnail: 'https://picsum.photos/200/200?random=2',
    promptModifier: 'in a serene outdoor landscape with natural sunlight, lush greenery, and a shallow depth of field'
  },
  {
    id: 'tv_broadcast',
    name: 'TV Broadcast',
    description: 'Professional news or presentation style',
    thumbnail: 'https://picsum.photos/200/200?random=3',
    promptModifier: 'in a professional tv broadcast graphic overlay style, high contrast, suitable for digital signage'
  }
];

export const STOCK_IMAGES: StockImage[] = [
  { id: '1', url: 'https://picsum.photos/id/42/1920/1080', description: 'Restaurant Interior' },
  { id: '2', url: 'https://picsum.photos/id/56/1920/1080', description: 'Lamps' },
  { id: '3', url: 'https://picsum.photos/id/60/1920/1080', description: 'Office' },
  { id: '4', url: 'https://picsum.photos/id/20/1920/1080', description: 'Tools' },
];

export const ASPECT_RATIO_OPTIONS = Object.values(AspectRatio);
