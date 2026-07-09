import { useState, useCallback } from 'react';
import PageA4 from '../components/PageA4';
import DiscoolverIsotipo from '../components/DiscoolverIsotipo';
import './T01Portada.css';

/**
 * T01Portada — Portada con foto a sangre.
 * Template 1/17.
 *
 * @param {object}  config       - GuideConfig
 * @param {string}  config.city
 * @param {string}  config.year              - 2 dígitos ("26")
 * @param {string}  config.coverHeadline1    - Línea Bebas uppercase
 * @param {string}  config.coverHeadline2    - Línea Playfair italic
 * @param {string}  config.coverTagline
 * @param {string}  config.coverPhoto        - URL imagen protagonista
 * @param {string}  config.coverBgColor
 * @param {number}  config.coverTintOpacity  - 0-0.85
 * @param {string}  config.headlineAlign     - 'left' | 'right'
 */
export default function T01Portada({ config = {}, onPhotoChange }) {
  const {
    city            = 'WORLDWIDE',
    year            = '21',
    coverHeadline1  = 'INSPIRING',
    coverHeadline2  = 'the World',
    coverTagline    = 'coolest places in the world',
    coverPhoto      = null,
    coverBgColor    = '#1a1a1a',
    coverTintOpacity = 0,
    headlineAlign   = 'right',
  } = config;

  const [localPhoto, setLocalPhoto] = useState(coverPhoto);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setLocalPhoto(url);
      onPhotoChange?.(url);
    }
  }, [onPhotoChange]);

  const handleFile = useCallback((e) => {
    const file = e.target.files[0];
    if (file?.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setLocalPhoto(url);
      onPhotoChange?.(url);
    }
  }, [onPhotoChange]);

  const photo = localPhoto ?? coverPhoto;

  return (
    <PageA4
      bg={coverBgColor}
      className="dv-portada"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* ── Full-bleed background photo ── */}
      {photo ? (
        <img className="dv-portada__bg-photo" src={photo} alt="protagonista" />
      ) : (
        <div className="dv-portada__bg-placeholder">
          <span className="dv-portada__placeholder-icon">📷</span>
          <span className="dv-portada__placeholder-txt">Arrastra la foto protagonista aquí</span>
        </div>
      )}

      {/* ── Color tint sobre foto ── */}
      <div
        className="dv-portada__tint"
        style={{ background: coverBgColor, opacity: coverTintOpacity }}
      />

      {/* ── Gradientes ── */}
      <div className="dv-portada__grad-top" />
      <div className="dv-portada__grad-bottom" />

      {/* ── TOP: wordmark ── */}
      <div className="dv-portada__top">
        <div className="dv-portada__wordmark">discoolver</div>
        <div className="dv-portada__wordmark-sub">{coverTagline}</div>
      </div>

      {/* ── Headline editorial ── */}
      <div className="dv-portada__headline" style={{ textAlign: headlineAlign }}>
        <span className="dv-portada__hl1">{coverHeadline1}</span>
        <span className="dv-portada__hl2">{coverHeadline2}</span>
      </div>

      {/* ── BOTTOM: año + ciudad ── */}
      <div className="dv-portada__bottom">
        <span className="dv-portada__guide-label">discoolver guide</span>
        <div className="dv-portada__year-row">
          {/* "2▷YY CIUDAD" — isotipo same height as numbers */}
          <span className="dv-portada__year-num">2</span>
          <DiscoolverIsotipo
            size={96}          /* height = font-size del texto adyacente */
            color="#ffffff"
            style={{ position: 'relative', top: 2, margin: '0 1px' }}
          />
          <span className="dv-portada__year-num">{year}</span>
        </div>
        <span className="dv-portada__city">{city.toUpperCase()}</span>
      </div>

      {/* ── Upload hint (solo en studio, no en print) ── */}
      {!photo && (
        <>
          <input
            id="portada-photo-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          <button
            className="dv-portada__upload-btn no-print"
            onClick={() => document.getElementById('portada-photo-input').click()}
          >
            📷 &nbsp; Subir foto protagonista
          </button>
        </>
      )}
    </PageA4>
  );
}
