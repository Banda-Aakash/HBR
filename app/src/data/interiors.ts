import {InteriorDesign} from '../types';

export const interiorDesigns: InteriorDesign[] = [
  {
    id: 'i1',
    title: 'Minimalist Scandinavian Living',
    category: 'living-room',
    description:
      'A serene living space featuring clean lines, neutral tones, and natural materials. The design emphasizes function and simplicity with cozy textiles and plants.',
    images: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
    ],
    designer: 'Anna Johansson',
    style: 'Scandinavian',
    tags: ['minimalist', 'neutral', 'cozy', 'natural'],
    likes: 342,
    isLiked: false,
  },
  {
    id: 'i2',
    title: 'Industrial Modern Kitchen',
    category: 'kitchen',
    description:
      'Bold industrial kitchen with exposed brick, stainless steel appliances, open shelving, and a massive island for cooking and entertaining.',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
      'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800',
    ],
    designer: 'Marco Bellini',
    style: 'Industrial',
    tags: ['industrial', 'modern', 'open-plan', 'entertaining'],
    likes: 287,
    isLiked: true,
  },
  {
    id: 'i3',
    title: 'Coastal Retreat Bedroom',
    category: 'bedroom',
    description:
      'A calming bedroom inspired by the coast. Features soft blues, white linens, rattan furniture, and natural textures that evoke beach serenity.',
    images: [
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800',
    ],
    designer: 'Olivia West',
    style: 'Coastal',
    tags: ['coastal', 'relaxing', 'blue', 'natural'],
    likes: 415,
    isLiked: false,
  },
  {
    id: 'i4',
    title: 'Luxe Marble Bathroom',
    category: 'bathroom',
    description:
      'An opulent bathroom clad in Calacatta marble with a freestanding tub, rain shower, heated floors, and gold fixtures throughout.',
    images: [
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800',
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
    ],
    designer: 'Laurent Dubois',
    style: 'Luxury',
    tags: ['luxury', 'marble', 'gold', 'spa'],
    likes: 523,
    isLiked: true,
  },
  {
    id: 'i5',
    title: 'Mid-Century Home Office',
    category: 'office',
    description:
      'A stylish home office blending mid-century modern furniture with contemporary tech. Walnut desk, Eames chair, and curated shelving create the perfect workspace.',
    images: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
      'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800',
    ],
    designer: 'David Kim',
    style: 'Mid-Century Modern',
    tags: ['mid-century', 'workspace', 'productive', 'walnut'],
    likes: 198,
    isLiked: false,
  },
  {
    id: 'i6',
    title: 'Mediterranean Outdoor Lounge',
    category: 'outdoor',
    description:
      'A warm Mediterranean-inspired outdoor area with terracotta tiles, lush greenery, a built-in fireplace, and comfortable lounge seating for al fresco living.',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1598928506311-c55ez637a57e?w=800',
    ],
    designer: 'Sofia Moreno',
    style: 'Mediterranean',
    tags: ['outdoor', 'mediterranean', 'terracotta', 'lounge'],
    likes: 276,
    isLiked: false,
  },
  {
    id: 'i7',
    title: 'Japanese Zen Living Room',
    category: 'living-room',
    description:
      'A tranquil living space inspired by Japanese aesthetics. Low-profile furniture, tatami mats, shoji screens, and a carefully curated bonsai collection.',
    images: [
      'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=800',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    ],
    designer: 'Yuki Tanaka',
    style: 'Japandi',
    tags: ['zen', 'japanese', 'minimal', 'peaceful'],
    likes: 389,
    isLiked: false,
  },
  {
    id: 'i8',
    title: 'Bohemian Eclectic Bedroom',
    category: 'bedroom',
    description:
      'A vibrant bedroom layered with patterns, textures, and global influences. Moroccan rugs, macramé wall hangings, and lush indoor plants create a free-spirited vibe.',
    images: [
      'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=800',
      'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
    ],
    designer: 'Priya Sharma',
    style: 'Bohemian',
    tags: ['bohemian', 'eclectic', 'colorful', 'textured'],
    likes: 456,
    isLiked: true,
  },
];

export const getInteriorById = (id: string): InteriorDesign | undefined =>
  interiorDesigns.find(d => d.id === id);

export const getInteriorsByCategory = (
  category: InteriorDesign['category'],
): InteriorDesign[] => interiorDesigns.filter(d => d.category === category);

export const interiorCategories = [
  {key: 'all' as const, label: 'All', icon: 'apps'},
  {key: 'living-room' as const, label: 'Living Room', icon: 'weekend'},
  {key: 'bedroom' as const, label: 'Bedroom', icon: 'hotel'},
  {key: 'kitchen' as const, label: 'Kitchen', icon: 'restaurant'},
  {key: 'bathroom' as const, label: 'Bathroom', icon: 'hot-tub'},
  {key: 'office' as const, label: 'Office', icon: 'computer'},
  {key: 'outdoor' as const, label: 'Outdoor', icon: 'deck'},
];
