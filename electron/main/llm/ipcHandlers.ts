import { MessageStreamEvent } from '@anthropic-ai/sdk/resources'
import { ipcMain, IpcMainInvokeEvent } from 'electron'
import Store from 'electron-store'
import { ProgressResponse } from 'ollama'
import { ChatCompletionChunk } from 'openai/resources/chat/completions'

import { LLMConfig, StoreKeys, StoreSchema } from '../electron-store/storeConfig'

import { sliceListOfStringsToContextLength, sliceStringToContextLength } from './contextLimit'
import { addOrUpdateLLMSchemaInStore, removeLLM, getAllLLMConfigs, getLLMConfig } from './llmConfig'
import AnthropicModelSessionService from './models/anthropic'
import OllamaService from './models/ollama'
import OpenAIModelSessionService from './models/openai'
import { LLMSessionService } from './types'
import { ChatHistory } from '@/components/Chat/chatUtils'

enum LLMType {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
}

export const LLMSessions: { [sessionId: string]: LLMSessionService } = {}

export const openAISession = new OpenAIModelSessionService()
export const anthropicSession = new AnthropicModelSessionService()

export const ollamaService = new OllamaService()

export const registerLLMSessionHandlers = (store: Store<StoreSchema>) => {
  ipcMain.handle(
    'streaming-llm-response',
    async (
      event: IpcMainInvokeEvent,
      llmName: string,
      llmConfig: LLMConfig,
      isJSONMode: boolean,
      chatHistory: ChatHistory,
    ): Promise<void> => {
      const handleOpenAIChunk = (chunk: ChatCompletionChunk) => {
        event.sender.send('openAITokenStream', chatHistory.id, chunk)
      }

      const handleAnthropicChunk = (chunk: MessageStreamEvent) => {
        event.sender.send('anthropicTokenStream', chatHistory.id, chunk)
      }

      switch (llmConfig.type) {
        case LLMType.OpenAI:
          await openAISession.streamingResponse(
            llmName,
            llmConfig,
            isJSONMode,
            chatHistory.displayableChatHistory,
            handleOpenAIChunk,
            store.get(StoreKeys.LLMGenerationParameters),
          )
          break
        case LLMType.Anthropic:
          await anthropicSession.streamingResponse(
            llmName,
            llmConfig,
            isJSONMode,
            chatHistory.displayableChatHistory,
            handleAnthropicChunk,
            store.get(StoreKeys.LLMGenerationParameters),
          )
          break
        default:
          throw new Error(`LLM type ${llmConfig.type} not supported.`)
      }
    },
  )
  ipcMain.handle('set-default-llm', (event, modelName: string) => {
    // TODO: validate that the model exists
    store.set(StoreKeys.DefaultLLM, modelName)
  })

  ipcMain.handle('get-default-llm-name', () => store.get(StoreKeys.DefaultLLM))

  ipcMain.handle('pull-ollama-model', async (event, modelName: string) => {
    const handleProgress = (progress: ProgressResponse) => {
      event.sender.send('ollamaDownloadProgress', modelName, progress)
    }
    await ollamaService.pullModel(modelName, handleProgress)
  })

  ipcMain.handle('get-llm-configs', async () => getAllLLMConfigs(store, ollamaService))

  ipcMain.handle('add-or-update-llm', async (event, modelConfig: LLMConfig) => {
    await addOrUpdateLLMSchemaInStore(store, modelConfig)
  })

  ipcMain.handle('remove-llm', async (event, modelNameToDelete: string) => {
    await removeLLM(store, ollamaService, modelNameToDelete)
  })

  ipcMain.handle(
    'slice-list-of-strings-to-context-length',
    async (event, strings: string[], llmName: string): Promise<string[]> => {
      const llmSession = openAISession
      const llmConfig = await getLLMConfig(store, ollamaService, llmName)

      if (!llmConfig) {
        throw new Error(`LLM ${llmName} not configured.`)
      }

      return sliceListOfStringsToContextLength(strings, llmSession.getTokenizer(llmName), llmConfig.contextLength)
    },
  )

  ipcMain.handle(
    'slice-string-to-context-length',
    async (event, inputString: string, llmName: string): Promise<string> => {
      const llmSession = openAISession
      const llmConfig = await getLLMConfig(store, ollamaService, llmName)

      if (!llmConfig) {
        throw new Error(`LLM ${llmName} not configured.`)
      }

      return sliceStringToContextLength(inputString, llmSession.getTokenizer(llmName), llmConfig.contextLength)
    },
  )
}
