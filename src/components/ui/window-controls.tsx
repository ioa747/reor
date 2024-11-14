/* eslint-disable jsx-a11y/control-has-associated-label */
import React from 'react'
import { X, Maximize2, Plus } from 'lucide-react'

interface WindowControlsProps {
  onClose: () => void
  onMaximize: () => void
  onNewChat?: () => void
}

const WindowControls = ({ onClose, onMaximize, onNewChat }: WindowControlsProps) => (
  <div className="group absolute right-2 top-2 z-10 transition-opacity hover:opacity-100">
    <div className="flex">
      {onNewChat && (
        <button
          type="button"
          onClick={onNewChat}
          className="cursor-pointer bg-transparent p-1.5 transition-colors"
          title="New Chat"
        >
          <Plus className="size-3 text-neutral-400 hover:text-neutral-300" />
        </button>
      )}
      <button
        type="button"
        onClick={onMaximize}
        className="cursor-pointer bg-transparent p-1.5 transition-colors"
        title="Maximize"
      >
        <Maximize2 className="size-3 text-neutral-400 hover:text-neutral-300" />
      </button>
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer bg-transparent p-1.5 transition-colors"
        title="Close"
      >
        <X className="size-3 text-neutral-400 hover:text-neutral-300" />
      </button>
    </div>
  </div>
)

export default WindowControls
