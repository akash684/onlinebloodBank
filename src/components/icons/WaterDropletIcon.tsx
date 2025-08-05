import React from 'react'

interface WaterDropletIconProps {
  className?: string
  size?: number
  color?: string
}

export const WaterDropletIcon: React.FC<WaterDropletIconProps> = ({ 
  className = "h-6 w-6", 
  size,
  color = "currentColor" 
}) => {
  const style = size ? { width: size, height: size } : {}
  
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C12 2 6 8.5 6 14C6 17.31 8.69 20 12 20C15.31 20 18 17.31 18 14C18 8.5 12 2 12 2Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color === "currentColor" ? color : "none"}
      />
      <path
        d="M12 16C13.1046 16 14 15.1046 14 14C14 12.8954 13.1046 12 12 12C10.8954 12 10 12.8954 10 14C10 15.1046 10.8954 16 12 16Z"
        fill="white"
        opacity="0.3"
      />
    </svg>
  )
}

// Alternative filled version
export const WaterDropletFilledIcon: React.FC<WaterDropletIconProps> = ({ 
  className = "h-6 w-6", 
  size,
  color = "currentColor" 
}) => {
  const style = size ? { width: size, height: size } : {}
  
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C12 2 6 8.5 6 14C6 17.31 8.69 20 12 20C15.31 20 18 17.31 18 14C18 8.5 12 2 12 2Z"
        fill={color}
      />
      <ellipse
        cx="12"
        cy="14"
        rx="2"
        ry="2"
        fill="white"
        opacity="0.3"
      />
    </svg>
  )
}