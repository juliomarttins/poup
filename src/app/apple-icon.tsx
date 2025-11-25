import { ImageResponse } from 'next/og';

// Tamanho recomendado pela Apple
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b', // Fundo Escuro (Zinc-950)
          color: '#F59E0B', // Logo Amarelo
          borderRadius: '20%', // Curva suave do iOS (opcional, o iOS corta sozinho, mas ajuda no preview)
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: '60%', height: '60%' }}
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