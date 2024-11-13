/* eslint-disable react/button-has-type */
import React, { useEffect, useState } from 'react'
import { EditorContent, BubbleMenu } from '@tiptap/react'
import EditorContextMenu from './EditorContextMenu'
import SearchBar from './Search/SearchBar'
import { useFileContext } from '@/contexts/FileContext'
import DocumentStats from './DocumentStats'
import AiEditMenu from './AIEdit'

const EditorManager: React.FC = () => {
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [editorFlex, setEditorFlex] = useState(true)
  const [showAIPopup, setShowAIPopup] = useState(false)
  const { editor } = useFileContext()

  const handleContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    setMenuPosition({
      x: event.pageX,
      y: event.pageY,
    })
    setContextMenuVisible(true)
  }

  const hideMenu = () => {
    if (contextMenuVisible) setContextMenuVisible(false)
  }

  useEffect(() => {
    const initEditorContentCenter = async () => {
      const isCenter = await window.electronStore.getEditorFlexCenter()
      setEditorFlex(isCenter)
    }

    const handleEditorChange = (event: any, editorFlexCenter: boolean) => {
      setEditorFlex(editorFlexCenter)
    }

    initEditorContentCenter()
    window.ipcRenderer.on('editor-flex-center-changed', handleEditorChange)
  }, [])

  return (
    <div
      className="relative size-full cursor-text overflow-hidden bg-dark-gray-c-eleven py-4 text-slate-400 opacity-80"
      onClick={() => editor?.commands.focus()}
    >
      {editor && (
        <BubbleMenu
          className="flex gap-2 rounded-lg border border-gray-700 bg-dark-gray-c-eleven p-2 shadow-lg"
          editor={editor}
          tippyOptions={{
            duration: 1000,
            placement: 'auto',
            offset: [0, 10],
            onHidden: () => {
              setShowAIPopup(false)
            },
          }}
        >
          <div
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            {showAIPopup ? (
              <AiEditMenu selectedText={editor.getText()} onEdit={() => {}} />
            ) : (
              <button onClick={() => setShowAIPopup(true)} className="rounded p-2 hover:bg-gray-700">
                Ask AI
              </button>
            )}
          </div>
        </BubbleMenu>
      )}
      <SearchBar editor={editor} showSearch={showSearchBar} setShowSearch={setShowSearchBar} />
      {contextMenuVisible && (
        <EditorContextMenu
          editor={editor}
          menuPosition={menuPosition}
          setMenuVisible={setContextMenuVisible}
          hideMenu={hideMenu}
        />
      )}

      <div className={`relative h-full ${editorFlex ? 'flex justify-center py-4 pl-4' : ''}`}>
        <div className="relative size-full overflow-y-auto">
          <EditorContent
            className={`relative size-full bg-dark-gray-c-eleven ${editorFlex ? 'max-w-xl' : ''}`}
            style={{
              wordBreak: 'break-word',
            }}
            onContextMenu={handleContextMenu}
            editor={editor}
          />
        </div>
      </div>
      <DocumentStats editor={editor} />
    </div>
  )
}

export default EditorManager
