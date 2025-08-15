import { FlagSpec } from './schema';

export const flags: FlagSpec[] = [
  {
    id: 'trans-pride',
    displayName: 'Trans Pride',
    category: 'marginalized',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Transgender_flags' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#5BCEFA', weight: 1, label: 'light blue' },
        { color: '#F5A9B8', weight: 1, label: 'light pink' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#F5A9B8', weight: 1, label: 'light pink' },
        { color: '#5BCEFA', weight: 1, label: 'light blue' },
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
  },
  {
    id: 'ua',
    displayName: 'Ukraine',
    category: 'national',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Flag_of_Ukraine' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#0057B7', weight: 1, label: 'blue' },
        { color: '#FFD700', weight: 1, label: 'yellow' },
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
  },
];
