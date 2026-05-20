/**
 * GuideConfig de ejemplo — Barcelona 2026
 * Reemplazar con datos reales en el formulario del generador.
 */

/** @type {import('./types').GuideConfig} */
export const sampleConfig = {
  // Identidad
  city:      'BARCELONA',
  year:      '26',
  edition:   'Edición Barcelona 2026',
  director:  'Carlos Jacoste',

  // Cover
  coverPhoto:     null,           // URL de imagen protagonista
  coverHeadline1: 'INSPIRING',
  coverHeadline2: 'the World',
  coverTagline:   'coolest places in the world',
  coverBgColor:   '#1a1a1a',
  coverTintOpacity: 0,

  // Editorial
  directorsLetter: `2026 ha sido, sin duda, un año que quedará en el imaginario popular...`,

  // Secciones
  sections: {
    restaurantes: {
      enabled: true,
      subcategories: ['Exclusivo', 'Cool', 'Local'],
      items: [
        {
          name:        '71 Oyster Bar',
          tagline:     'Bar de ostras y cócteles',
          description: 'Situado en una de las calles con más encanto de Barcelona...',
          photo:       null,
          web:         'www.71oysterbar.com',
          address:     'Carrer d\'Enric Granados, 71',
          subcategory: 'Exclusivo',
          slug:        '71-oyster-bar',
        },
      ],
    },
    fiesta: {
      enabled: true,
      items: [],
    },
    ocioEventos: {
      enabled: true,
      items: [],
    },
    arteExposiciones: {
      enabled: false,
      items: [],
    },
    experienciasActividades: {
      enabled: true,
      items: [],
    },
    alojamientos: {
      enabled: false,
      items: [],
    },
    shopping: {
      enabled: true,
      items: [],
    },
  },

  influencers: [
    {
      username:         '@influencer_bcn',
      realName:         'Nombre Apellido',
      category:         'Food',
      photo:            null,
      discoolverProfile: 'barcelona/influencer-bcn',
    },
  ],

  personaDelAno: {
    name:    'La Rosalía',
    tagline: 'Artista del año',
    photo:   null,
    bio:     '',
    quote:   '"Siento que hago música desde el respeto y la libertad."',
  },

  ads: [],
};
