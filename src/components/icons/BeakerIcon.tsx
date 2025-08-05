import React from 'react'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export const BeakerIcon: React.FC<IconProps> = ({ className = "h-6 w-6", ...props }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19.428 15.428l-7.071-7.071V4h1a1 1 0 000-2H10.643a1 1 0 000 2h1v4.357l-7.071 7.071A2 2 0 006.986 20h10.028a2 2 0 001.414-3.572z"
    />
  </svg>
)