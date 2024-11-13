import React, { useState } from "react"
import { FiCopy } from "react-icons/fi" // Import the copy icon

const CopyField = ({ contentToCopy }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000) // Reset copied state after 2 seconds
  }

  return (
    <div className='relative p-4 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 max-w-2lg shadow-lg'>
      <div className='overflow-auto p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm font-mono text-gray-500 dark:text-gray-300'>
        {contentToCopy.split("\n").map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>

      <button
        onClick={handleCopy}
        className='absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
        aria-label='Copy to clipboard'>
        <FiCopy size={20} />
      </button>

      {copied && (
        <div className='absolute top-10 right-2 text-xs text-green-500 dark:text-green-400'>
          Copied!
        </div>
      )}
    </div>
  )
}

export default CopyField
