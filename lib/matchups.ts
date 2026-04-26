export type Celeb = {
  id: string
  name: string
  tag: string
  image: string
  /** Baseline vote share for the left side (0-100). The opponent gets 100 - this. */
  baselinePct: number
}

export type Matchup = {
  id: string
  category: string
  left: Celeb
  right: Celeb
}

export const matchups: Matchup[] = [
  {
    id: 'pop-queens',
    category: 'POP QUEENS',
    left: {
      id: 'taylor',
      name: 'Taylor',
      tag: 'Eras Era',
      image: '/celebs/taylor.jpg',
      baselinePct: 52,
    },
    right: {
      id: 'beyonce',
      name: 'Beyoncé',
      tag: 'Cowboy Carter',
      image: '/celebs/beyonce.jpg',
      baselinePct: 48,
    },
  },
  {
    id: 'it-couple',
    category: 'IT COUPLE',
    left: {
      id: 'zendaya',
      name: 'Zendaya',
      tag: 'Tennis Core',
      image: '/celebs/zendaya.jpg',
      baselinePct: 58,
    },
    right: {
      id: 'timothee',
      name: 'Timothée',
      tag: 'Wonka Boy',
      image: '/celebs/timothee.jpg',
      baselinePct: 42,
    },
  },
  {
    id: 'icons',
    category: 'CULTURAL ICONS',
    left: {
      id: 'rihanna',
      name: 'Rihanna',
      tag: 'Fenty Boss',
      image: '/celebs/rihanna.jpg',
      baselinePct: 61,
    },
    right: {
      id: 'gaga',
      name: 'Gaga',
      tag: 'Chromatica',
      image: '/celebs/gaga.jpg',
      baselinePct: 39,
    },
  },
  {
    id: 'rap-gods',
    category: 'RAP GODS',
    left: {
      id: 'drake',
      name: 'Drake',
      tag: 'OVO',
      image: '/celebs/drake.jpg',
      baselinePct: 34,
    },
    right: {
      id: 'kendrick',
      name: 'Kendrick',
      tag: 'Pulitzer Pen',
      image: '/celebs/kendrick.jpg',
      baselinePct: 66,
    },
  },
  {
    id: 'leading-ladies',
    category: 'LEADING LADIES',
    left: {
      id: 'margot',
      name: 'Margot',
      tag: 'Barbie',
      image: '/celebs/margot.jpg',
      baselinePct: 47,
    },
    right: {
      id: 'florence',
      name: 'Florence',
      tag: 'Indie Queen',
      image: '/celebs/florence.jpg',
      baselinePct: 53,
    },
  },
]
