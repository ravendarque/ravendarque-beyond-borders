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
    categoryDisplayOrder: 1,
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Palestine' },
    status: 'active',
    modes: {
      ring: {
        colors: [
          '#000000',
          '#009040',
          '#ffffff',
          '#f03040'
        ],
      },
      cutout: {
        offsetEnabled: true,
        defaultOffset: -50,
      },
    },
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
    categoryDisplayOrder: 1,
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Flag_of_Tibet' },
    status: 'active',
    modes: {
      ring: {
        colors: [
          '#e02020',
          '#301070',
          '#f0e010',
          '#ffffff'
        ],
      },
      cutout: {
        offsetEnabled: true,
        defaultOffset: 0,
      },
    },
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
    categoryDisplayOrder: 1,
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Western_Sahara' },
    status: 'active',
    modes: {
      ring: {
        colors: [
          '#000000',
          '#008040',
          '#ffffff',
          '#c01020'
        ],
      },
      cutout: {
        offsetEnabled: true,
        defaultOffset: -50,
      },
    },
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
    categoryDisplayOrder: 1,
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Flag_of_Ukraine' },
    status: 'active',
    modes: {
      ring: {
        colors: [
          '#ffd000',
          '#0050b0'
        ],
      },
    },
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
    categoryDisplayOrder: 2,
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Kurdistan' },
    status: 'active',
    modes: {
      ring: {
        colors: [
          '#f02020',
          '#209040',
          '#ffffff',
          '#ffc010'
        ],
      },
      cutout: {
        offsetEnabled: true,
        defaultOffset: 50,
      },
    },
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
    categoryDisplayOrder: 2,
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Uyghurs' },
    status: 'active',
    modes: {
      ring: {
        colors: [
          '#50a0e0',
          '#ffffff'
        ],
      },
    },
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
    categoryDisplayOrder: 2,
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Rohingya' },
    status: 'active',
    modes: {
      ring: {
        colors: [
          '#106020',
          '#d0b030',
          '#ffffff'
        ],
      },
      cutout: {
        offsetEnabled: true,
        defaultOffset: 50,
      },
    },
  },
  {
    id: 'irish-traveller-movement',
    name: 'Irish Traveller Movement',
    displayName: 'Irish Traveller Movement',
    png_full: 'irish-traveller-movement.png',
    png_preview: 'irish-traveller-movement.preview.png',
    aspectRatio: 1.530241935483871,
    svgFilename: 'irish-traveller-movement.svg',
    category: 'stateless',
    categoryDisplayName: 'Stateless People',
    categoryDisplayOrder: 2,
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Irish_Traveller_movement' },
    status: 'active',
    modes: {
      ring: {
        colors: [
          '#005000',
          '#3030d0',
          '#ffff00',
          '#ffffff',
          '#000000'
        ],
      },
      cutout: {
        offsetEnabled: true,
        defaultOffset: 0,
      },
    },
  },
  {
    id: 'gay-pride',
    name: 'Rainbow Flag',
    displayName: 'Pride',
    png_full: 'gay-pride.png',
    png_preview: 'gay-pride.preview.png',
    aspectRatio: 1.62,
    svgFilename: 'gay-pride.svg',
    category: 'lgbtqia',
    categoryDisplayName: 'LGBTQIA+',
    categoryDisplayOrder: 3,
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Rainbow_flag' },
    status: 'active',
    modes: {
      ring: {
        colors: [
          '#e00000',
          '#008020',
          '#ff9000',
          '#fff000',
          '#0050ff',
          '#700090'
        ],
      },
    },
  },
  {
    id: 'transgender-pride',
    name: 'Transgender Flag',
    displayName: 'Trans Pride',
    png_full: 'transgender-pride.png',
    png_preview: 'transgender-pride.preview.png',
    aspectRatio: 1.6666666666666667,
    svgFilename: 'transgender-pride.svg',
    category: 'lgbtqia',
    categoryDisplayName: 'LGBTQIA+',
    categoryDisplayOrder: 3,
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Transgender_flag' },
    status: 'active',
    modes: {
      ring: {
        colors: [
          '#60d0ff',
          '#f0b0c0',
          '#ffffff'
        ],
      },
    },
  },
  {
    id: 'nonbinary',
    name: 'Non-Binary Flag',
    displayName: 'Non-Binary Pride',
    png_full: 'nonbinary.png',
    png_preview: 'nonbinary.preview.png',
    aspectRatio: 1.5,
    svgFilename: 'nonbinary.svg',
    category: 'lgbtqia',
    categoryDisplayName: 'LGBTQIA+',
    categoryDisplayOrder: 3,
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Non-binary_gender#Flags' },
    status: 'active',
    modes: {
      ring: {
        colors: [
          '#303030',
          '#fff030',
          '#ffffff',
          '#a060d0'
        ],
      },
    },
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
    categoryDisplayOrder: 4,
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Aboriginal_flag' },
    status: 'active',
    modes: {
      ring: {
        colors: [
          '#000000',
          '#d00000',
          '#ffff00',
          '#202000'
        ],
      },
      cutout: {
        offsetEnabled: true,
        defaultOffset: 50,
      },
    },
  }
];
