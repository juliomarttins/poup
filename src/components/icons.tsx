import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="7" />
      <path d="M10.5 9.5V14.5" />
      <path d="M10.5 9.5H12.5C13.6046 9.5 14.5 10.3954 14.5 11.5C14.5 12.6046 13.6046 13.5 12.5 13.5H10.5" />
    </svg>
  );
}
