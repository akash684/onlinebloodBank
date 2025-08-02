import React from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' } : {}}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700
        ${hover ? 'transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}