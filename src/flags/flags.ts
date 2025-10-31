import { FlagSpec } from './schema';

/**
 * Flag definitions generated from flag-data.yaml
 * Do not edit manually - run scripts/fetch-and-extract.cjs to regenerate
 */
export const flags: FlagSpec[] = [
  {
    id: 'north-korea',
    name: 'Ramhongsaek Konghwagukgi',
    displayName: 'North Korea',
    png_full: 'north-korea.png',
    png_preview: 'north-korea.preview.png',
    svgFilename: 'north-korea.svg',
    category: 'authoritarian',
    layouts: [
      {
        type: 'ring',
        colors: [
          '#f02020',
          '#0050a0',
          '#ffffff',
          '#f09090'
        ],
      }
    ],
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/North_Korea' },
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'eritrea',
    name: 'Flag Of Eritrea',
    displayName: 'Eritrea',
    png_full: 'eritrea.png',
    png_preview: 'eritrea.preview.png',
    svgFilename: 'eritrea.svg',
    category: 'authoritarian',
    layouts: [
      {
        type: 'ring',
        colors: [
          '#e00030',
          '#4090e0',
          '#40b030',
          '#ffd030'
        ],
      }
    ],
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Eritrea' },
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'iran',
    name: 'Flag Of The Islamic Republic Of Iran',
    displayName: 'Iran',
    png_full: 'iran.png',
    png_preview: 'iran.preview.png',
    svgFilename: 'iran.svg',
    category: 'authoritarian',
    layouts: [
      {
        type: 'ring',
        colors: [
          '#ffffff',
          '#e00000',
          '#20a040'
        ],
      }
    ],
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Iran' },
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'palestine',
    name: 'Palestinian Flag',
    displayName: 'Palestine',
    png_full: 'palestine.png',
    png_preview: 'palestine.preview.png',
    svgFilename: 'palestine.svg',
    category: 'occupied',
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
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Palestine' },
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'tibet',
    name: 'Snow Lion Flag',
    displayName: 'Tibet',
    png_full: 'tibet.png',
    png_preview: 'tibet.preview.png',
    svgFilename: 'tibet.svg',
    category: 'occupied',
    layouts: [
      {
        type: 'ring',
        colors: [
          '#e02020',
          '#301070',
          '#ffffff',
          '#f0e010'
        ],
      }
    ],
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Flag_of_Tibet' },
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'the-sahrawi-arab-democratic-republic',
    name: 'Flag Of The Sahrawi Arab Democratic Republic',
    displayName: 'Western Sahara',
    png_full: 'the-sahrawi-arab-democratic-republic.png',
    png_preview: 'the-sahrawi-arab-democratic-republic.preview.png',
    svgFilename: 'the-sahrawi-arab-democratic-republic.svg',
    category: 'occupied',
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
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Western_Sahara' },
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'kurdistan',
    name: 'Kurdish Flag (Roj)',
    displayName: 'Kurdistan',
    png_full: 'kurdistan.png',
    png_preview: 'kurdistan.preview.png',
    svgFilename: 'kurdistan.svg',
    category: 'stateless',
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
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Kurdistan' },
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'kokbayraq',
    name: 'East Turkestan Flag',
    displayName: 'Uyghur (East Turkestan)',
    png_full: 'kokbayraq.png',
    png_preview: 'kokbayraq.preview.png',
    svgFilename: 'kokbayraq.svg',
    category: 'stateless',
    layouts: [
      {
        type: 'ring',
        colors: [
          '#50a0e0',
          '#ffffff'
        ],
      }
    ],
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Uyghurs' },
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'rohingya',
    name: 'Rohingya Flag',
    displayName: 'Rohingya',
    png_full: 'rohingya.png',
    png_preview: 'rohingya.preview.png',
    svgFilename: 'rohingya.svg',
    category: 'stateless',
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
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Rohingya' },
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'gay-pride',
    name: 'Rainbow Flag',
    displayName: 'Pride',
    png_full: 'gay-pride.png',
    png_preview: 'gay-pride.preview.png',
    svgFilename: 'gay-pride.svg',
    category: 'oppressed',
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
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Rainbow_flag' },
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'transgender-pride',
    name: 'Transgender Flag',
    displayName: 'Trans Pride',
    png_full: 'transgender-pride.png',
    png_preview: 'transgender-pride.preview.png',
    svgFilename: 'transgender-pride.svg',
    category: 'oppressed',
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
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Transgender_flag' },
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'ukraine',
    name: 'Flag Of Ukraine',
    displayName: 'Ukraine',
    png_full: 'ukraine.png',
    png_preview: 'ukraine.preview.png',
    svgFilename: 'ukraine.svg',
    category: 'occupied',
    layouts: [
      {
        type: 'ring',
        colors: [
          '#ffd000',
          '#0050b0'
        ],
      }
    ],
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Flag_of_Ukraine' },
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'australian-aboriginal',
    name: 'Australian Aboriginal Flag',
    displayName: 'Australian Aboriginal Peoples',
    png_full: 'australian-aboriginal.png',
    png_preview: 'australian-aboriginal.preview.png',
    svgFilename: 'australian-aboriginal.svg',
    category: 'oppressed',
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
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Aboriginal_flag' },
    focalPoint: { x: 0.5, y: 0.5 },
  },
  {
    id: 'nonbinary',
    name: 'Non-Binary Flag',
    displayName: 'Non-Binary Pride',
    png_full: 'nonbinary.png',
    png_preview: 'nonbinary.preview.png',
    svgFilename: 'nonbinary.svg',
    category: 'oppressed',
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
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Non-binary_gender#Flags' },
    focalPoint: { x: 0.5, y: 0.5 },
  }
];
