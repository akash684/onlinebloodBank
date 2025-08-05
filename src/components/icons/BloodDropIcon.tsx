import React from 'react'

interface BloodDropIconProps {
  className?: string
  size?: number
  color?: string
}

// Medical/blood-specific droplet icon with more medical styling
const BloodDropIcon: React.FC<BloodDropIconProps> = ({ 
  className = "h-6 w-6", 
  size,
  color = "#DC2626" // Default to medical red
}) => {
  const style = size ? { width: size, height: size } : {}
  
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2.5C12 2.5 5.5 9.5 5.5 15C5.5 18.59 8.41 21.5 12 21.5C15.59 21.5 18.5 18.59 18.5 15C18.5 9.5 12 2.5 12 2.5Z"
        fill={color}
        stroke={color}
        strokeWidth="1"
      />
      <path
        d="M12 6C12 6 8.5 10.5 8.5 14C8.5 16.21 10.29 18 12.5 18C14.71 18 16.5 16.21 16.5 14C16.5 10.5 12 6 12 6Z"
        fill="white"
        opacity="0.2"
      />
      <circle
        cx="10"
        cy="13"
        r="1.5"
        fill="white"
        opacity="0.4"
      />
    </svg>
  )
}

export default BloodDropIcon