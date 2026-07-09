import '../shared/brand-tokens.css';
import './App.css';
import T01Portada from './templates/T01Portada';
import T02PortadaTypo from './templates/T02PortadaTypo';
import T03Indice from './templates/T03Indice';
import T04NotaDirector from './templates/T04NotaDirector';
import T05ReportajePersona from './templates/T05ReportajePersona';
import T06Restaurantes from './templates/T06Restaurantes';
import T07GastromiaBcn from './templates/T07GastromiaBcn';
import T08Fiesta from './templates/T08Fiesta';
import T09OcioEventos from './templates/T09OcioEventos';
import T10ArteExposiciones from './templates/T10ArteExposiciones';
import T11Experiencias from './templates/T11Experiencias';
import T12Alojamientos from './templates/T12Alojamientos';
import T13Shopping from './templates/T13Shopping';
import T14Influencers from './templates/T14Influencers';
import T15Publicidad from './templates/T15Publicidad';
import T16Contraportada from './templates/T16Contraportada';
import { useGuideConfig } from './lib/useGuideConfig';

export default function App() {
  const { config, loading, error } = useGuideConfig();

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#1A1A2E', color: '#fff',
      fontFamily: 'Inter, sans-serif', fontSize: 14,
    }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="36" height="33" viewBox="0 0 110 100" fill="none" style={{ marginBottom: 12 }}>
          <path d="M59 0 A59 50 0 0 0 59 100 Z" fill="#C8006B"/>
          <polygon points="72,13 110,50 72,87" fill="#C8006B"/>
        </svg>
        <div>Cargando guía...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#1A1A2E', color: '#fff',
      fontFamily: 'Inter, sans-serif', fontSize: 13,
    }}>
      <div style={{ textAlign: 'center', color: '#C8006B' }}>
        ⚠ {error}
      </div>
    </div>
  );

  return (
    <div className="dv-studio">
      <header className="dv-studio-header no-print">
        <span className="dv-studio-logo">discoolver</span>
        <span className="dv-studio-subtitle">
          Design Studio · {config.city} 20{config.year}
        </span>
      </header>

      <T01Portada config={config} />
      <T02PortadaTypo config={config} />
      <T03Indice config={config} />
      <T04NotaDirector config={config} />
      <T05ReportajePersona config={config} />
      <T06Restaurantes config={config} />
      <T07GastromiaBcn config={config} />
      <T08Fiesta config={config} />
      <T09OcioEventos config={config} />
      <T10ArteExposiciones config={config} />
      <T11Experiencias config={config} />
      <T12Alojamientos config={config} />
      <T13Shopping config={config} />
      <T14Influencers config={config} />
      <T15Publicidad config={config} />
      <T16Contraportada config={config} />
    </div>
  );
}
