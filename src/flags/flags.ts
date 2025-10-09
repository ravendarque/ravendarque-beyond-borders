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
        { color: '#5BCEFA', weight: 1, label: 'blue' },
        { color: '#F5A9B8', weight: 1, label: 'yellow' },
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
        { color: '#0057B7', weight: 1, label: 'blue' },
        { color: '#FFD700', weight: 1, label: 'gold' }
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
        { color: '#034DA2', weight: 1, label: 'blue' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#EC1D25', weight: 1, label: 'red' }
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
        { color: '#CC0000', weight: 1, label: 'red' },
        { color: '#FFFF00', weight: 1, label: 'yellow' }
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
        { color: '#E4002B', weight: 1, label: 'red' },
        { color: '#43B02A', weight: 1, label: 'green' },
        { color: '#418FDE', weight: 1, label: 'blue' },
        { color: '#FFC72C', weight: 1, label: 'orange' }
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
        { color: '#DA0000', weight: 1, label: 'red' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#239F40', weight: 1, label: 'green' }
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
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#ED2024', weight: 1, label: 'red' },
        { color: '#278E43', weight: 1, label: 'green' },
        { color: '#FEBD11', weight: 1, label: 'orange' }
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
        { color: '#2D2D2D', weight: 1, label: 'black' },
        { color: '#9B59D0', weight: 1, label: 'purple' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#FFF433', weight: 1, label: 'orange' }
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
        { color: '#770088', weight: 1, label: 'purple' },
        { color: '#004CFF', weight: 1, label: 'blue' },
        { color: '#028121', weight: 1, label: 'green' },
        { color: '#FFEE00', weight: 1, label: 'orange' },
        { color: '#FF8D00', weight: 1, label: 'orange' },
        { color: '#E50000', weight: 1, label: 'red' }
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
        { color: '#009639', weight: 1, label: 'green' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#ED2E38', weight: 1, label: 'red' }
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
        { color: '#559EE2', weight: 1, label: 'blue' },
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
        { color: '#007A3D', weight: 1, label: 'green' },
        { color: '#FFFFFF', weight: 1, label: 'white' },
        { color: '#C4111B', weight: 1, label: 'red' }
      ],
    },
    recommended: { borderStyle: 'ring-stripes', defaultThicknessPct: 12 },
  }
];
