import { FileInfoNode } from "electron/main/filesystem/types"
import React, { useEffect, useRef } from "react"
import { ChatHistoryMetadata } from "../Chat/hooks/use-chat-history"
import { useModalOpeners } from '../../providers/ModalProvider'
import NewNoteComponent from "../File/NewNote"
import NewDirectoryComponent from '../File/NewDirectory'

/**
 * Name of component that user right clicked on.
 * Used to define the type for our useState
 */
export type ContextMenuLocations = 
    | 'FileSidebar'
    | 'EditorContent'
    | 'FileItem'
    | 'ChatItem'
    | 'DirectoryItem'
    | 'None'

export interface ContextMenuFocus {
    currentSelection: ContextMenuLocations
    locations: ContextMenuPos
    file?: FileInfoNode
    chatMetadata?: ChatHistoryMetadata 
}

export type HandleFocusedItemType = (
    event: React.MouseEvent<HTMLDivElement>, 
    focusedItem: ContextMenuLocations,
    additionalData?: Partial<Omit<ContextMenuFocus, 'currentSelection' | 'locations'>>
) => void;

interface ContextMenuPos {
    x: number
    y: number
}

interface MenuItemType {
    title: string
    onSelect: ((...args: any[]) => void) | null
    icon: string
}

interface CustomContextMenuProps {
  focusedItem: ContextMenuFocus
  setFocusedItem: (item: ContextMenuFocus) => void
  hideFocusedItem: () => void
  handleDeleteFile: (path: string | undefined) => void
  handleDeleteChat: (chatID: string | undefined) => void
  setFileNodeToBeRenamed: (newName: string) => void
  openFileAndOpenEditor: (path: string, optionalContentToWriteOnCreate?: string) => void
  currentFilePath: string | null
}

const CustomContextMenu: React.FC<CustomContextMenuProps> = ({ 
    focusedItem,
    setFocusedItem,
    hideFocusedItem,
    handleDeleteFile,
    handleDeleteChat,
    setFileNodeToBeRenamed,
    openFileAndOpenEditor,
    currentFilePath,
}) => {
  const { currentSelection, locations, file, chatMetadata } = focusedItem
  const menuRef = useRef<HTMLDivElement>(null)
  
  const {
    isNewNoteModalOpen,
    setIsNewNoteModalOpen,
    isNewDirectoryModalOpen,
    setIsNewDirectoryModalOpen,
  } = useModalOpeners()

  useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          hideFocusedItem()
        }
      }

      document.addEventListener('mousedown', handleOutsideClick)
      return () => {
          document.removeEventListener('mousedown', handleOutsideClick)
      }
  }, [hideFocusedItem])

  let displayList: MenuItemType[] = []
  switch(currentSelection) {
      case 'FileSidebar': {
          displayList = [
              {title: 'New Note', onSelect: () => setIsNewNoteModalOpen(true), icon: ''},
              {title: 'New Directory', onSelect: () => setIsNewDirectoryModalOpen(true), icon: ''},
          ]
          break
      }
      case 'EditorContent': {

          break
      }
      case 'FileItem': {
          displayList = [
              {title: 'Delete', onSelect: () => handleDeleteFile(file?.path), icon: ''},
              {title: 'Rename', onSelect: () => {file?.path ? setFileNodeToBeRenamed(file?.path) : ''}, icon: ''},
              {title: 'Create flashcard set', onSelect: null, icon: ''},
              {title: 'Add File to chat context', onSelect: null, icon: ''},
          ]
          break
      }
      case 'ChatItem': {
          displayList = [
              {title: 'Delete Chat', onSelect: () => handleDeleteChat(chatMetadata?.id), icon: ''},
          ]
          break
      }
      case 'DirectoryItem': {
          displayList = [
              {title: 'New Directory', onSelect: null, icon: ''},
              {title: 'New Note', onSelect: () => setIsNewNoteModalOpen(true), icon: ''},
              {title: 'Delete', onSelect: null, icon: ''},
              {title: 'Rename', onSelect: null, icon: ''},
              {title: 'Create flashcard set', onSelect: null, icon: ''},
              {title: 'Add file to chat context', onSelect: null, icon: ''},
          ]
          break
      }
  }

  // Selects the item then hides menu
  const handleSubmit = (item: MenuItemType) => {
    if (item.onSelect)
      item.onSelect()
    setFocusedItem((prevItem: ContextMenuFocus) => ({
      ...prevItem,
      currentSelection: 'None' as ContextMenuLocations,
    }))
    console.log("Previous item:", focusedItem)
  }


  console.log("Path:", file?.path)
  return (
    <div>
      {focusedItem.currentSelection !== 'None' && (
          <div 
            ref={menuRef}
            className="absolute p-2 rounded-md z-[1020] bg-[#1E1E1E] overflow-y-auto"
            style={{
            left: locations.x,
              top: locations.y,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* TODO: onClick is a temporarily fix since not everyhing is implemented. */}
            <div className="flex flex-col">
              {displayList?.map((item, index) => (
                <div
                  key={index}
                  className="text-[11px] text-white/90 cursor-pointer hover:bg-blue-500 hover:rounded-md px-2 py-1"
                  onClick={() => handleSubmit(item)}
                >
                  {item.title}
                </div>
              ))}
            </div>
          </div>
      )}
      <NewNoteComponent
        isOpen={isNewNoteModalOpen}
        onClose={() => setIsNewNoteModalOpen(false)}
        openFileAndOpenEditor={openFileAndOpenEditor}
        currentOpenFilePath={file?.path ? file?.path : null}
        optionalAbsoluteCreate={file?.path ? file?.path : null}
      />
      <NewDirectoryComponent
        isOpen={isNewDirectoryModalOpen}
        onClose={() => setIsNewDirectoryModalOpen(false)}
        currentOpenFilePath={null}
      />
    </div>
  )
}

export default CustomContextMenu