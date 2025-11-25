import { ImageResponse } from 'next/og';

// Configurações da Imagem (Tamanho padrão de favicon)
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Geração do Ícone via Código
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F59E0B', // Amarelo/Ouro do Poupp
        }}
      >
        {/* SVG do Logo Poupp desenhado manualmente para o ImageResponse */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: '100%', height: '100%' }}
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="7" />
          <path d="M10.5 9.5V14.5" />
          <path d="M10.5 9.5H12.5C13.6046 9.5 14.5 10.3954 14.5 11.5C14.5 12.6046 13.6046 13.5 12.5 13.5H10.5" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}