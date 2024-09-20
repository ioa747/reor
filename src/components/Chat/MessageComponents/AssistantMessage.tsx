import React, { useCallback, useMemo } from 'react'
import { HiOutlinePencilAlt } from 'react-icons/hi'
import { toast } from 'react-toastify'
import { ToolCallPart } from 'ai'
import { FaRegCopy } from 'react-icons/fa'
import { Chat, ReorChatMessage } from '../types'
import {
  makeAndAddToolResultToMessages,
  extractMessagePartsFromAssistantMessage,
  findToolResultMatchingToolCall,
  getClassNameBasedOnMessageRole,
} from '../utils'
import { ToolCallComponent } from './ToolCalls'
import { useWindowContentContext } from '@/contexts/WindowContentContext'
import { useChatContext } from '@/contexts/ChatContext'
import MarkdownRenderer from '@/components/Common/MarkdownRenderer'

interface AssistantMessageProps {
  message: ReorChatMessage
  setCurrentChat: React.Dispatch<React.SetStateAction<Chat | undefined>>
  currentChat: Chat
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({ message, setCurrentChat, currentChat }) => {
  if (message.role !== 'assistant') {
    throw new Error('Message is not an assistant message')
  }
  const { openContent } = useWindowContentContext()
  const { saveChat } = useChatContext()

  const { textParts, toolCalls } = useMemo(() => {
    return extractMessagePartsFromAssistantMessage(message)
  }, [message])

  const copyToClipboard = () => {
    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content, null, 2)
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard!')
  }

  const createNewNoteFromMessage = async () => {
    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content, null, 2)
    const title = `${content.substring(0, 20)}...`
    openContent(title, content)
  }

  const executeToolCall = useCallback(
    async (toolCallPart: ToolCallPart) => {
      const existingToolResult = findToolResultMatchingToolCall(toolCallPart.toolCallId, currentChat.messages)
      if (existingToolResult) {
        toast.error('Tool call id already exists')
        return
      }

      const updatedMessages = await makeAndAddToolResultToMessages(currentChat.messages, toolCallPart, message)

      setCurrentChat((prevChat) => {
        if (!prevChat) return prevChat
        const updatedChat = {
          ...prevChat,
          messages: updatedMessages,
        }
        saveChat(updatedChat)
        return updatedChat
      })
    },
    [currentChat, setCurrentChat, saveChat, message],
  )

  const renderContent = () => {
    return (
      <>
        {textParts.map((text, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <MarkdownRenderer key={index} content={text} />
        ))}
        {toolCalls.map((toolCall) => (
          <ToolCallComponent
            key={toolCall.toolCallId}
            toolCallPart={toolCall}
            currentChat={currentChat}
            executeToolCall={executeToolCall}
          />
        ))}
      </>
    )
  }

  return (
    <div className={`w-full ${getClassNameBasedOnMessageRole(message)} mb-4 flex`}>
      <div className="w-full flex-col gap-1">
        <div className="flex grow flex-col ">
          {renderContent()}
          <div className="mt-2 flex">
            <div
              className="cursor-pointer items-center justify-center rounded p-1 hover:bg-neutral-700"
              onClick={copyToClipboard}
            >
              <FaRegCopy color="gray" size={16} className="text-gray-200" title="Copy" />
            </div>
            <div
              className="cursor-pointer items-center justify-center rounded p-1 hover:bg-neutral-700"
              onClick={createNewNoteFromMessage}
            >
              <HiOutlinePencilAlt color="gray" size={18} className="text-gray-200" title="New Note" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssistantMessage
