import { FlagSpec } from './schema';

export const flags: FlagSpec[] = [
  {
    id: 'trans-pride',
    displayName: 'Transgender Pride — Transgender flag',
    png_full: 'transgender-pride.png',
    png_preview: 'transgender-pride.preview.png',
    svgFilename: 'transgender-pride.svg',
    category: 'marginalized',
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
  },
  {
    id: 'ua',
    displayName: 'Ukraine — Flag of Ukraine',
    png_full: 'ukraine.png',
    png_preview: 'ukraine.preview.png',
    svgFilename: 'ukraine.svg',
    category: 'national',
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
  },
  {
    id: 'nk',
    displayName: 'North Korea — Ramhongsaek Konghwagukgi',
    png_full: 'north-korea.png',
    png_preview: 'north-korea.preview.png',
    svgFilename: 'north-korea.svg',
    category: 'national',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/North_Korea' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#F02020', weight: 1, label: 'red' },
        { color: '#0050A0', weight: 1, label: 'blue' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#F09090', weight: 1, label: 'red' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
  },
  {
    id: 'australian-aboriginal',
    displayName: 'Australian Aboriginal Peoples — Australian Aboriginal Flag',
    png_full: 'australian-aboriginal.png',
    png_preview: 'australian-aboriginal.preview.png',
    svgFilename: 'australian-aboriginal.svg',
    category: 'marginalized',
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
  },
  {
    id: 'er',
    displayName: 'Eritrea — Flag of Eritrea',
    png_full: 'eritrea.png',
    png_preview: 'eritrea.preview.png',
    svgFilename: 'eritrea.svg',
    category: 'national',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Eritrea' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#E00030', weight: 1, label: 'red' },
        { color: '#4090E0', weight: 1, label: 'blue' },
        { color: '#40B030', weight: 1, label: 'green' },
        { color: '#FFD030', weight: 1, label: 'orange' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
  },
  {
    id: 'ir',
    displayName: 'Iran — Flag of the Islamic Republic of Iran',
    png_full: 'iran.png',
    png_preview: 'iran.preview.png',
    svgFilename: 'iran.svg',
    category: 'national',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Iran' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#E00000', weight: 1, label: 'red' },
        { color: '#20A040', weight: 1, label: 'green' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
  },
  {
    id: 'kurdistan',
    displayName: 'Kurdistan — Kurdish flag (Roj)',
    png_full: 'kurdistan.png',
    png_preview: 'kurdistan.preview.png',
    svgFilename: 'kurdistan.svg',
    category: 'marginalized',
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
  },
  {
    id: 'nonbinary',
    displayName: 'Non-binary Pride — Non-binary flag',
    png_full: 'nonbinary.png',
    png_preview: 'nonbinary.preview.png',
    svgFilename: 'nonbinary.svg',
    category: 'marginalized',
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
  },
  {
    id: 'pride',
    displayName: 'Pride — Rainbow Flag',
    png_full: 'gay-pride.png',
    png_preview: 'gay-pride.preview.png',
    svgFilename: 'gay-pride.svg',
    category: 'marginalized',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Rainbow_flag' },
    status: 'active',
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
  },
  {
    id: 'ps',
    displayName: 'Palestine — Palestinian flag',
    png_full: 'palestine.png',
    png_preview: 'palestine.preview.png',
    svgFilename: 'palestine.svg',
    category: 'marginalized',
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
  },
  {
    id: 'rohingya',
    displayName: 'Rohingya — Rohingya flag',
    png_full: 'rohingya.png',
    png_preview: 'rohingya.preview.png',
    svgFilename: 'rohingya.svg',
    category: 'marginalized',
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
  },
  {
    id: 'tibet',
    displayName: 'Tibet — Snow Lion Flag',
    png_full: 'tibet.png',
    png_preview: 'tibet.preview.png',
    svgFilename: 'tibet.svg',
    category: 'marginalized',
    sources: { referenceUrl: 'https://en.wikipedia.org/wiki/Flag_of_Tibet' },
    status: 'active',
    pattern: {
      type: 'stripes',
      orientation: 'horizontal',
      stripes: [
        { color: '#E02020', weight: 1, label: 'red' },
        { color: '#301070', weight: 1, label: 'blue' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#F0E010', weight: 1, label: 'orange' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
  },
  {
    id: 'uyghur',
    displayName: 'Uyghur (East Turkestan) — East Turkestan flag',
    png_full: 'kokbayraq.png',
    png_preview: 'kokbayraq.preview.png',
    svgFilename: 'kokbayraq.svg',
    category: 'marginalized',
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
  },
  {
    id: 'ws',
    displayName: 'Western Sahara — Sahrawi Arab Democratic Republic',
    png_full: 'the-sahrawi-arab-democratic-republic.png',
    png_preview: 'the-sahrawi-arab-democratic-republic.preview.png',
    svgFilename: 'the-sahrawi-arab-democratic-republic.svg',
    category: 'marginalized',
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
  }
];
