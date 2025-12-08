import { FlagSpec } from './schema';

/**
 * Flag definitions generated from flag-data.yaml
 * Do not edit manually - run scripts/fetch-flags.cjs to regenerate
 */
export const flags: FlagSpec[] = [
  {
    id: 'palestine',
    name: 'Palestinian Flag',
    displayName: 'Palestine',
    png_full: 'palestine.png',
    png_preview: 'palestine.preview.png',
    aspectRatio: 2,
    svgFilename: 'palestine.svg',
    category: 'occupied',
    categoryDisplayName: 'Occupied / Disputed Territory',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Palestine' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#000000', weight: 1, label: 'black' },
        { color: '#009040', weight: 1, label: 'green' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#F03040', weight: 1, label: 'red' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#000000',
          '#009040',
          '#ffffff',
          '#f03040'
        ],
      }
    ],
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'tibet',
    name: 'Snow Lion Flag',
    displayName: 'Tibet',
    png_full: 'tibet.png',
    svgFilename: 'tibet.svg',
    category: 'occupied',
    categoryDisplayName: 'Occupied / Disputed Territory',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Flag_of_Tibet' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#84BE86', weight: 1, label: 'cyan' },
        { color: '#328C4E', weight: 1, label: 'green' },
        { color: '#F4E109', weight: 1, label: 'orange' },
        { color: '#DA251C', weight: 1, label: 'red' },
        { color: '#29166F', weight: 1, label: 'blue' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#000000', weight: 1, label: 'black' },
        { color: '#F1C700', weight: 1, label: 'orange' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#84be86',
          '#328c4e',
          '#f4e109',
          '#da251c',
          '#29166f',
          '#ffffff',
          '#000000',
          '#f1c700'
        ],
      }
    ],
  },
  {
    id: 'the-sahrawi-arab-democratic-republic',
    name: 'Flag Of The Sahrawi Arab Democratic Republic',
    displayName: 'Western Sahara',
    png_full: 'the-sahrawi-arab-democratic-republic.png',
    svgFilename: 'the-sahrawi-arab-democratic-republic.svg',
    category: 'occupied',
    categoryDisplayName: 'Occupied / Disputed Territory',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Western_Sahara' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#000000', weight: 1, label: 'black' },
        { color: '#007A3D', weight: 1, label: 'green' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#C4111B', weight: 1, label: 'red' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#000000',
          '#007a3d',
          '#ffffff',
          '#c4111b'
        ],
      }
    ],
  },
  {
    id: 'kurdistan',
    name: 'Kurdish Flag (Roj)',
    displayName: 'Kurdistan',
    png_full: 'kurdistan.png',
    png_preview: 'kurdistan.preview.png',
    aspectRatio: 1.5,
    svgFilename: 'kurdistan.svg',
    category: 'stateless',
    categoryDisplayName: 'Stateless People',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Kurdistan' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#F02020', weight: 1, label: 'red' },
        { color: '#209040', weight: 1, label: 'green' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#FFC010', weight: 1, label: 'orange' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#f02020',
          '#209040',
          '#ffffff',
          '#ffc010'
        ],
      }
    ],
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'kokbayraq',
    name: 'East Turkestan Flag',
    displayName: 'Uyghur (East Turkestan)',
    png_full: 'kokbayraq.png',
    png_preview: 'kokbayraq.preview.png',
    aspectRatio: 1.5,
    svgFilename: 'kokbayraq.svg',
    category: 'stateless',
    categoryDisplayName: 'Stateless People',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Uyghurs' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#50A0E0', weight: 1, label: 'blue' },
        { color: '#FFFFFF', weight: 1, label: 'white' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#50a0e0',
          '#ffffff'
        ],
      }
    ],
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'rohingya',
    name: 'Rohingya Flag',
    displayName: 'Rohingya',
    png_full: 'rohingya.png',
    svgFilename: 'rohingya.svg',
    category: 'stateless',
    categoryDisplayName: 'Stateless People',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Rohingya' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#000000', weight: 1, label: 'black' },
        { color: '#D4AC34', weight: 1, label: 'orange' },
        { color: '#D4AF37', weight: 1, label: 'orange' },
        { color: '#FBFBFA', weight: 1, label: 'white' },
        { color: '#14642C', weight: 1, label: 'green' },
        { color: '#0B6623', weight: 1, label: 'green' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#ffffff',
          '#000000',
          '#d4ac34',
          '#d4af37',
          '#fbfbfa',
          '#14642c',
          '#0b6623'
        ],
      }
    ],
  },
  {
    id: 'gay-pride',
    name: 'Rainbow Flag',
    displayName: 'Pride',
    png_full: 'gay-pride.png',
    png_preview: 'gay-pride.preview.png',
    aspectRatio: 1.61875,
    svgFilename: 'gay-pride.svg',
    category: 'oppressed',
    categoryDisplayName: 'Oppressed Groups',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Rainbow_flag' },
    status: 'active',
    horizontalInvariant: true,
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#E00000', weight: 1, label: 'red' },
        { color: '#0050FF', weight: 1, label: 'blue' },
        { color: '#FF9000', weight: 1, label: 'orange' },
        { color: '#FFF000', weight: 1, label: 'orange' },
        { color: '#700090', weight: 1, label: 'purple' },
        { color: '#008020', weight: 1, label: 'green' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#e00000',
          '#0050ff',
          '#ff9000',
          '#fff000',
          '#700090',
          '#008020'
        ],
      }
    ],
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'transgender-pride',
    name: 'Transgender Flag',
    displayName: 'Trans Pride',
    png_full: 'transgender-pride.png',
    png_preview: 'transgender-pride.preview.png',
    aspectRatio: 1.6666666666666667,
    svgFilename: 'transgender-pride.svg',
    category: 'oppressed',
    categoryDisplayName: 'Oppressed Groups',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Transgender_flag' },
    status: 'active',
    horizontalInvariant: true,
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#60D0FF', weight: 1, label: 'blue' },
        { color: '#F0B0C0', weight: 1, label: 'yellow' },
        { color: '#FFFFFF', weight: 1, label: 'white' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#60d0ff',
          '#f0b0c0',
          '#ffffff'
        ],
      }
    ],
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'ukraine',
    name: 'Flag Of Ukraine',
    displayName: 'Ukraine',
    png_full: 'ukraine.png',
    png_preview: 'ukraine.preview.png',
    aspectRatio: 1.5,
    svgFilename: 'ukraine.svg',
    category: 'occupied',
    categoryDisplayName: 'Occupied / Disputed Territory',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Flag_of_Ukraine' },
    status: 'active',
    horizontalInvariant: true,
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#FFD000', weight: 1, label: 'orange' },
        { color: '#0050B0', weight: 1, label: 'blue' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#ffd000',
          '#0050b0'
        ],
      }
    ],
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'australian-aboriginal',
    name: 'Australian Aboriginal Flag',
    displayName: 'Australian Aboriginal Peoples',
    png_full: 'australian-aboriginal.png',
    png_preview: 'australian-aboriginal.preview.png',
    aspectRatio: 1.6666666666666667,
    svgFilename: 'australian-aboriginal.svg',
    category: 'oppressed',
    categoryDisplayName: 'Oppressed Groups',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Aboriginal_flag' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#000000', weight: 1, label: 'black' },
        { color: '#D00000', weight: 1, label: 'red' },
        { color: '#FFFF00', weight: 1, label: 'yellow' },
        { color: '#202000', weight: 1, label: 'red' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#000000',
          '#d00000',
          '#ffff00',
          '#202000'
        ],
      }
    ],
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'nonbinary',
    name: 'Non-Binary Flag',
    displayName: 'Non-Binary Pride',
    png_full: 'nonbinary.png',
    png_preview: 'nonbinary.preview.png',
    aspectRatio: 1.5,
    svgFilename: 'nonbinary.svg',
    category: 'oppressed',
    categoryDisplayName: 'Oppressed Groups',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Non-binary_gender#Flags' },
    status: 'active',
    horizontalInvariant: true,
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#FFF030', weight: 1, label: 'orange' },
        { color: '#303030', weight: 1, label: 'black' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#A060D0', weight: 1, label: 'purple' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#fff030',
          '#303030',
          '#ffffff',
          '#a060d0'
        ],
      }
    ],
    focalPoint: { x: 0.5, y: 0.5 },
  }
];
