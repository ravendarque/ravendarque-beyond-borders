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
    reason: 'Unlawful occupation since 1967 and ongoing genocide in Gaza. The Israeli government has imposed a total siege, cut off essential supplies, and launched military attacks resulting in catastrophic civilian deaths.',
    references: [
      {
        url: 'https://en.wikipedia.org/wiki/Flag_of_Palestine',
        text: 'Flag of Palestine on Wikipedia',
      },
      {
        url: 'https://www.unrwa.org/resources/fact-sheet/two-years-fast-facts',
        text: 'Two Years of War: Fast Facts on UNRWA'
      }
    ],
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
    reason: 'Banned in Tibet since Chinese control; symbol of Tibetan cultural and political resistance.',
    references: [
      {
        url: 'https://en.wikipedia.org/wiki/Flag_of_Tibet',
        text: 'Flag of Tibet on Wikipedia'
      }
    ],
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
    reason: 'Territory with partial recognition; long-running dispute and displacement of Sahrawi people.',
    references: [
      {
        url: 'https://en.wikipedia.org/wiki/Flag_of_Western_Sahara',
        text: 'Flag of Western Sahara on Wikipedia'
      }
    ],
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
    reason: 'Ongoing military occupation and territorial aggression since 2014; symbol of sovereignty and resistance.',
    references: [
      {
        url: 'https://en.wikipedia.org/wiki/Flag_of_Ukraine',
        text: 'Flag of Ukraine on Wikipedia'
      }
    ],
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
    reason: 'Represents Kurdish identity and independence aspirations; Kurds face repression and denial of rights across multiple states.',
    references: [
      {
        url: 'https://en.wikipedia.org/wiki/Flag_of_Kurdistan',
        text: 'Flag of Kurdistan on Wikipedia'
      }
    ],
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
    reason: 'Used by Uyghur activists and diaspora; Uyghurs face mass detention, cultural repression, and rights abuses in Xinjiang.',
    references: [
      {
        url: 'https://en.wikipedia.org/wiki/Flag_of_East_Turkestan',
        text: 'Flag of East Turkestan on Wikipedia'
      }
    ],
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
    displayName: 'Rohingya (Myanmar)',
    png_full: 'rohingya.png',
    png_preview: 'rohingya.preview.png',
    aspectRatio: 1.4981273408239701,
    svgFilename: 'rohingya.svg',
    category: 'stateless',
    categoryDisplayName: 'Stateless People',
    categoryDisplayOrder: 2,
    reason: 'Rohingya have faced ethnic cleansing, statelessness, and severe persecution in Myanmar.',
    references: [
      {
        url: 'https://en.wikipedia.org/wiki/Rohingya_flag',
        text: 'Flag of Rohingya on Wikipedia'
      }
    ],
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
    reason: 'Represents LGBTQIA+ communities; in many countries LGBTQIA+ people face criminalisation, discrimination, and violence.',
    references: [
      {
        url: 'https://en.wikipedia.org/wiki/Rainbow_flag',
        text: 'Wikipedia page'
      }
    ],
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
    reason: 'Symbol of transgender visibility; transgender people face discrimination and legal obstacles in many places.',
    references: [
      {
        url: 'https://en.wikipedia.org/wiki/Transgender_flag',
        text: 'Wikipedia page'
      }
    ],
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
    reason: 'Represents non-binary people and their visibility; used in LGBTQIA+ contexts to acknowledge gender diversity.',
    references: [
      {
        url: 'https://en.wikipedia.org/wiki/Non-binary_gender#Flags',
        text: 'Wikipedia page'
      }
    ],
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
    id: 'irish-traveller-movement',
    name: 'Irish Traveller Movement',
    displayName: 'Irish Traveller Movement',
    png_full: 'irish-traveller-movement.png',
    png_preview: 'irish-traveller-movement.preview.png',
    aspectRatio: 1.530241935483871,
    svgFilename: 'irish-traveller-movement.svg',
    category: 'oppressed',
    categoryDisplayName: 'Oppressed Groups',
    categoryDisplayOrder: 4,
    reason: 'Represents the Irish Traveller community which faces discrimination, social exclusion, and economic disadvantage.',
    references: [
      {
        url: 'https://en.wikipedia.org/wiki/Irish_Traveller_Movement',
        text: 'Irish Traveller Movement on Wikipedia'
      }
    ],
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
    id: 'the-romani-people',
    name: 'Flag of the Romani people',
    displayName: 'Romani',
    png_full: 'the-romani-people.png',
    png_preview: 'the-romani-people.preview.png',
    aspectRatio: 1.5,
    svgFilename: 'the-romani-people.svg',
    category: 'oppressed',
    categoryDisplayName: 'Oppressed Groups',
    categoryDisplayOrder: 4,
    reason: 'Represents the Romani people, a minority concentrated in Europe who face widespread discrimination, social exclusion, and persecution across many countries.',
    references: [
      {
        url: 'https://en.wikipedia.org/wiki/Flag_of_the_Romani_people',
        text: 'Flag of the Romani people on Wikipedia'
      }
    ],
    modes: {
      ring: {
        colors: [
          '#008000',
          '#0080ff',
          '#ff0000'
        ],
      },
      cutout: {
        offsetEnabled: true,
        defaultOffset: 0,
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
    reason: 'Represents Aboriginal peoples of Australia and is used as a symbol of identity, cultural resilience, and political rights.',
    references: [
      {
        url: 'https://en.wikipedia.org/wiki/Aboriginal_flag',
        text: 'Wikipedia page'
      }
    ],
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
