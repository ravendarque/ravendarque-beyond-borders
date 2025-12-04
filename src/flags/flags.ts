import { FlagSpec } from './schema';

/**
 * Flag definitions generated from flag-data.yaml
 * Do not edit manually - run scripts/fetch-and-extract.cjs to regenerate
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
    png_preview: 'tibet.preview.png',
    aspectRatio: 1.6,
    svgFilename: 'tibet.svg',
    category: 'occupied',
    categoryDisplayName: 'Occupied / Disputed Territory',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Flag_of_Tibet' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#E02020', weight: 1, label: 'red' },
        { color: '#301070', weight: 1, label: 'blue' },
        { color: '#F0E010', weight: 1, label: 'orange' },
        { color: '#FFFFFF', weight: 1, label: 'white' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#e02020',
          '#301070',
          '#f0e010',
          '#ffffff'
        ],
      }
    ],
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'the-sahrawi-arab-democratic-republic',
    name: 'Flag Of The Sahrawi Arab Democratic Republic',
    displayName: 'Western Sahara',
    png_full: 'the-sahrawi-arab-democratic-republic.png',
    png_preview: 'the-sahrawi-arab-democratic-republic.preview.png',
    aspectRatio: 2,
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
        { color: '#008040', weight: 1, label: 'green' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#C01020', weight: 1, label: 'red' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#000000',
          '#008040',
          '#ffffff',
          '#c01020'
        ],
      }
    ],
    focalPoint: { x: 0.5, y: 0.5 },
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
    png_preview: 'rohingya.preview.png',
    aspectRatio: 1.4981273408239701,
    svgFilename: 'rohingya.svg',
    category: 'stateless',
    categoryDisplayName: 'Stateless People',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Rohingya' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#106020', weight: 1, label: 'green' },
        { color: '#D0B030', weight: 1, label: 'orange' },
        { color: '#FFFFFF', weight: 1, label: 'white' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#106020',
          '#d0b030',
          '#ffffff'
        ],
      }
    ],
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'gay-pride',
    name: 'Rainbow Flag',
    displayName: 'Pride',
    png_full: 'gay-pride.png',
    png_preview: 'gay-pride.preview.png',
    aspectRatio: 1.62,
    svgFilename: 'gay-pride.svg',
    category: 'oppressed',
    categoryDisplayName: 'Oppressed Groups',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Rainbow_flag' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#E00000', weight: 1, label: 'red' },
        { color: '#FFF000', weight: 1, label: 'orange' },
        { color: '#008020', weight: 1, label: 'green' },
        { color: '#FF9000', weight: 1, label: 'orange' },
        { color: '#0050FF', weight: 1, label: 'blue' },
        { color: '#700090', weight: 1, label: 'purple' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
    layouts: [
      {
        type: 'ring',
        colors: [
          '#e00000',
          '#fff000',
          '#008020',
          '#ff9000',
          '#0050ff',
          '#700090'
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
