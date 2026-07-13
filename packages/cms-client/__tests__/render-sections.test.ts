/**
 * Tests for section renderer
 */

import { mergeCmsData } from '../src/renderers/render-sections'

describe('mergeCmsData', () => {
  it('returns hardcoded dict if CMS data is empty', () => {
    const hardcoded = { headline: 'Default', subheading: 'Sub' }
    const result = mergeCmsData(hardcoded, undefined, 'en')
    expect(result).toEqual(hardcoded)
  })

  it('merges CMS scalar values over hardcoded', () => {
    const hardcoded = { headline: 'Default', subheading: 'Sub' }
    const cms = { headline: 'CMS headline' }
    const result = mergeCmsData(hardcoded, cms, 'en')
    expect(result).toEqual({ headline: 'CMS headline', subheading: 'Sub' })
  })

  it('ignores empty/null CMS values and keeps hardcoded', () => {
    const hardcoded = { headline: 'Default' }
    const cms = { headline: '', subheading: null }
    const result = mergeCmsData(hardcoded, cms, 'en')
    expect(result).toEqual({ headline: 'Default' })
  })

  it('handles locale-specific fields (fieldName_locale pattern)', () => {
    const hardcoded = { headline: 'En default' }
    const cms = {
      headline: 'Base value',
      headline_es: 'Titular en español',
      headline_en: 'Headline in English',
    }
    const resultEs = mergeCmsData(hardcoded, cms, 'es')
    expect(resultEs).toMatchObject({ headline: 'Titular en español' })

    const resultEn = mergeCmsData(hardcoded, cms, 'en')
    expect(resultEn).toMatchObject({ headline: 'Headline in English' })
  })

  it('merges complex objects from CMS', () => {
    const hardcoded = {
      author: { name: 'Anonymous', bio: 'Unknown' },
    }
    const cms = {
      author: { name: 'Jane Doe', bio: 'Writer' },
    }
    const result = mergeCmsData(hardcoded, cms, 'en')
    expect(result.author).toMatchObject({ name: 'Jane Doe', bio: 'Writer' })
  })
})
