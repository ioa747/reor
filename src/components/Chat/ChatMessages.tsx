import React, { useEffect, useState, Dispatch, MutableRefObject, SetStateAction } from 'react'
import { PiPaperPlaneRight } from 'react-icons/pi'
import { HiOutlineClipboardCopy, HiOutlinePencilAlt } from 'react-icons/hi'
import { FaRegUserCircle } from 'react-icons/fa'
import { toast } from 'react-toastify'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

import { LLMConfig } from 'electron/main/electron-store/storeConfig'
import PromptSuggestion from './ChatPrompts'
// Add this import

import LoadingDots from '@/utils/animations'
import '../../styles/chat.css'
import { Chat, ChatFilters, ReorChatMessage } from './types'
import ContextSettingsBar from './ContextSettingsBar'

export enum AskOptions {
  Ask = 'Ask',
}

export const EXAMPLE_PROMPTS: { [key: string]: string[] } = {
  [AskOptions.Ask]: [
    'What have I written about Philosophy?',
    'Generate a study guide from my notes.',
    'Which authors have I discussed positively about?',
  ],
}

interface ChatMessagesProps {
  chatContainerRef: MutableRefObject<HTMLDivElement | null>
  openFileAndOpenEditor: (path: string, optionalContentToWriteOnCreate?: string) => Promise<void>
  currentChatHistory: Chat | undefined
  chatFilters: ChatFilters
  setChatFilters: Dispatch<SetStateAction<ChatFilters>>
  setUserTextFieldInput: Dispatch<SetStateAction<string>>
  defaultModelName: string
  vaultDirectory: string
  handlePromptSelection: (prompt: string | undefined) => void
  askText: AskOptions
  loadAnimation: boolean
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  chatContainerRef,
  openFileAndOpenEditor,
  currentChatHistory,
  chatFilters,
  setChatFilters,
  setUserTextFieldInput,
  defaultModelName,
  vaultDirectory,
  handlePromptSelection,
  askText,
  loadAnimation,
}) => {
  const [llmConfigs, setLLMConfigs] = useState<LLMConfig[]>([])
  const [selectedLlm, setSelectedLlm] = useState<string>(defaultModelName)
  const [showTitlebar, setShowTitlebar] = useState(true)

  const getClassName = (message: ReorChatMessage): string => {
    return `markdown-content ${message.role}-chat-message`
  }

  const getDisplayMessage = (message: ReorChatMessage): string | undefined => {
    return message.visibleContent || typeof message.content !== 'string' ? message.visibleContent : message.content
  }

  const copyToClipboard = (message: ReorChatMessage) => {
    navigator.clipboard.writeText(getDisplayMessage(message) ?? '')
    toast.success('Copied to clipboard!')
  }

  const createNewNote = async (message: ReorChatMessage) => {
    const title = `${(getDisplayMessage(message) ?? `${new Date().toDateString()}`).substring(0, 20)}...`
    openFileAndOpenEditor(title, getDisplayMessage(message))
  }

  useEffect(() => {
    const fetchLLMModels = async () => {
      const LLMConfigs = await window.llm.getLLMConfigs()
      setLLMConfigs(LLMConfigs)
    }
    fetchLLMModels()
  }, [])

  const sendMessageButtonHandler = async () => {
    setShowTitlebar(false)
    await window.llm.setDefaultLLM(selectedLlm)
    handlePromptSelection(undefined)
  }

  const handleUserInput = (input: string) => {
    setUserTextFieldInput(input)
    if (input.trim().length > 0) {
      setShowTitlebar(false)
    } else {
      setShowTitlebar(true)
    }
  }

  return (
    <div
      ref={chatContainerRef}
      className="chat-container relative flex h-full flex-col items-center justify-center overflow-auto bg-transparent"
    >
      <div className="relative mt-4 flex size-full flex-col items-center gap-3 overflow-x-hidden p-10 pt-0">
        <div className="w-full max-w-3xl">
          {currentChatHistory && currentChatHistory.messages && currentChatHistory.messages.length > 0 ? (
            // Display chat history if it exists
            currentChatHistory.messages
              .filter((msg) => msg.role !== 'system')
              .map((message, index) => (
                <div className={`w-full ${getClassName(message)} flex`}>
                  <div className="relative items-start pl-4 pt-3">
                    {message.role === 'user' ? (
                      <FaRegUserCircle size={22} />
                    ) : (
                      <img src="/src/assets/reor-logo.svg" style={{ width: '22px', height: '22px' }} alt="ReorImage" />
                    )}
                  </div>
                  <div className="w-full flex-col gap-1">
                    <div className="flex grow flex-col px-5 py-2.5">
                      <ReactMarkdown
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        rehypePlugins={[rehypeRaw]}
                        className="max-w-[95%] break-words"
                      >
                        {message.visibleContent || typeof message.content !== 'string'
                          ? message.visibleContent
                          : message.content}
                      </ReactMarkdown>
                      {message.role === 'assistant' && (
                        <div className="flex">
                          <div
                            className="cursor-pointer items-center justify-center rounded p-1 hover:bg-neutral-700"
                            onClick={() => copyToClipboard(message)}
                          >
                            <HiOutlineClipboardCopy color="gray" size={18} className="text-gray-200" title="Copy" />
                          </div>
                          <div
                            className="cursor-pointer items-center justify-center rounded p-1 hover:bg-neutral-700"
                            onClick={() => createNewNote(message)}
                          >
                            <HiOutlinePencilAlt color="gray" size={18} className="text-gray-200" title="New Note" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
          ) : (
            // Display centered "Start a conversation..." if there is no currentChatHistory
            <div className="relative flex w-full flex-col items-center">
              <div className="relative flex size-full flex-col text-center lg:top-10 lg:max-w-2xl">
                <div className="flex size-full justify-center">
                  <img src="/src/assets/reor-logo.svg" style={{ width: '64px', height: '64px' }} alt="ReorImage" />
                </div>
                <h1 className="mb-10 text-[28px] text-gray-300">
                  Welcome to your AI-powered assistant! Start a conversation with your second brain!
                </h1>
                <div className="flex w-full flex-col rounded-md bg-bg-000 focus-within:ring-1 focus-within:ring-[#8c8c8c]">
                  {showTitlebar && !currentChatHistory?.messages.length && (
                    <ContextSettingsBar
                      chatFilters={chatFilters}
                      setChatFilters={setChatFilters}
                      vaultDirectory={vaultDirectory}
                    />
                  )}
                  <textarea
                    onKeyDown={(e) => {
                      if (!e.shiftKey && e.key === 'Enter') {
                        e.preventDefault()
                        sendMessageButtonHandler()
                      }
                    }}
                    className="h-[100px] w-full resize-none rounded-t-md border-0 bg-transparent p-4 text-text-gen-100 caret-white focus:outline-none"
                    placeholder="What can Reor help you with today?"
                    onChange={(e) => handleUserInput(e.target.value)}
                  />
                  <div className="h-px w-[calc(100%-5%)] flex-col self-center bg-gray-600 md:flex-row" />
                  <div className="flex flex-col items-center justify-between px-4 py-2 md:flex-row">
                    <div className="flex flex-col items-center justify-between rounded-md border-0 py-2 text-text-gen-100 md:flex-row">
                      <select
                        value={selectedLlm}
                        onChange={(e) => setSelectedLlm(e.target.value)}
                        className="h-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {llmConfigs.map((model) => (
                          <option key={model.modelName} value={model.modelName}>
                            {model.modelName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      className="m-1 flex cursor-pointer items-center justify-center rounded-md border-0 bg-blue-600 p-2 text-white hover:bg-blue-500"
                      onClick={sendMessageButtonHandler}
                      type="button"
                      aria-label="Send message"
                    >
                      <PiPaperPlaneRight aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 size-full justify-center md:flex-row lg:flex">
                  {EXAMPLE_PROMPTS[askText].map((option) => (
                    <PromptSuggestion key={option} promptText={option} onClick={() => handlePromptSelection(option)} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {loadAnimation && (
          <div className="relative left-4 ml-1 mt-4 flex w-full max-w-3xl items-start gap-6">
            <img src="/src/assets/reor-logo.svg" style={{ width: '22px', height: '22px' }} alt="ReorImage" />
            <LoadingDots />
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatMessages
