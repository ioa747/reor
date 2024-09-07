import path from 'path'

import { ipcMain } from 'electron'
import Store from 'electron-store'
import {
  Tab,
  EmbeddingModelConfig,
  EmbeddingModelWithLocalPath,
  EmbeddingModelWithRepo,
  StoreKeys,
  StoreSchema,
} from './storeConfig'

import WindowsManager from '../common/windowManager'

import { initializeAndMaybeMigrateStore } from './storeSchemaMigrator'
import { Chat } from '@/components/Chat/types'

export const registerStoreHandlers = (store: Store<StoreSchema>, windowsManager: WindowsManager) => {
  initializeAndMaybeMigrateStore(store)
  ipcMain.handle('set-vault-directory-for-window', async (event, userDirectory: string): Promise<void> => {
    windowsManager.setVaultDirectoryForContents(event.sender, userDirectory, store)
  })

  ipcMain.handle('get-vault-directory-for-window', (event) => {
    let vaultPathForWindow = windowsManager.getVaultDirectoryForWinContents(event.sender)
    if (!vaultPathForWindow) {
      vaultPathForWindow = windowsManager.getAndSetupDirectoryForWindowFromPreviousAppSession(event.sender, store)
    }
    return vaultPathForWindow
  })
  ipcMain.handle('set-default-embedding-model', (event, repoName: string) => {
    store.set(StoreKeys.DefaultEmbeddingModelAlias, repoName)
  })

  ipcMain.handle('add-new-local-embedding-model', (event, model: EmbeddingModelWithLocalPath) => {
    const currentModels = store.get(StoreKeys.EmbeddingModels) || {}
    const modelAlias = path.basename(model.localPath)
    store.set(StoreKeys.EmbeddingModels, {
      ...currentModels,
      [modelAlias]: model,
    })
    store.set(StoreKeys.DefaultEmbeddingModelAlias, modelAlias)
  })

  ipcMain.handle('add-new-repo-embedding-model', (event, model: EmbeddingModelWithRepo) => {
    const currentModels = store.get(StoreKeys.EmbeddingModels) || {}
    store.set(StoreKeys.EmbeddingModels, {
      ...currentModels,
      [model.repoName]: model,
    })
    store.set(StoreKeys.DefaultEmbeddingModelAlias, model.repoName)
  })

  ipcMain.handle('get-embedding-models', () => store.get(StoreKeys.EmbeddingModels))

  ipcMain.handle(
    'update-embedding-model',
    (event, modelName: string, updatedModel: EmbeddingModelWithLocalPath | EmbeddingModelWithRepo) => {
      const currentModels = store.get(StoreKeys.EmbeddingModels) || {}
      store.set(StoreKeys.EmbeddingModels, {
        ...currentModels,
        [modelName]: updatedModel,
      })
    },
  )

  ipcMain.handle('remove-embedding-model', (event, modelName: string) => {
    const currentModels = store.get(StoreKeys.EmbeddingModels) || {}
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [modelName]: unused, ...updatedModels } = currentModels

    store.set(StoreKeys.EmbeddingModels, updatedModels)
  })

  ipcMain.handle('set-no-of-rag-examples', (event, noOfExamples: number) => {
    store.set(StoreKeys.MaxRAGExamples, noOfExamples)
  })

  ipcMain.handle('get-no-of-rag-examples', () => store.get(StoreKeys.MaxRAGExamples))

  ipcMain.handle('set-chunk-size', (event, chunkSize: number) => {
    store.set(StoreKeys.ChunkSize, chunkSize)
  })

  ipcMain.handle('get-chunk-size', () => store.get(StoreKeys.ChunkSize))

  ipcMain.handle('get-default-embedding-model', () => store.get(StoreKeys.DefaultEmbeddingModelAlias))

  ipcMain.handle('set-llm-generation-params', (event, generationParams) => {
    store.set(StoreKeys.LLMGenerationParameters, generationParams)
  })

  ipcMain.handle('get-llm-generation-params', () => {
    return store.get(StoreKeys.LLMGenerationParameters)
  })

  ipcMain.handle('set-sb-compact', (event, isSBCompact) => {
    store.set(StoreKeys.IsSBCompact, isSBCompact)
    event.sender.send('sb-compact-changed', isSBCompact)
  })

  ipcMain.handle('get-sb-compact', () => store.get(StoreKeys.IsSBCompact))

  ipcMain.handle('get-editor-flex-center', () => store.get(StoreKeys.EditorFlexCenter))

  ipcMain.handle('set-editor-flex-center', (event, setEditorFlexCenter) => {
    store.set(StoreKeys.EditorFlexCenter, setEditorFlexCenter)
    event.sender.send('editor-flex-center-changed', setEditorFlexCenter)
  })

  ipcMain.handle('set-analytics-mode', (event, isAnalytics) => {
    store.set(StoreKeys.Analytics, isAnalytics)
  })

  ipcMain.handle('get-analytics-mode', () => {
    return store.get(StoreKeys.Analytics)
  })

  ipcMain.handle('set-spellcheck-mode', (event, isSpellCheck) => {
    store.set(StoreKeys.SpellCheck, isSpellCheck)
  })

  ipcMain.handle('get-spellcheck-mode', () => {
    return store.get(StoreKeys.SpellCheck)
  })

  ipcMain.handle('has-user-opened-app-before', () => store.get(StoreKeys.hasUserOpenedAppBefore))

  ipcMain.handle('set-user-has-opened-app-before', () => {
    store.set(StoreKeys.hasUserOpenedAppBefore, true)
  })

  ipcMain.handle('get-all-chat-histories', (event) => {
    const vaultDir = windowsManager.getVaultDirectoryForWinContents(event.sender)

    if (!vaultDir) {
      return []
    }

    const allHistories = store.get(StoreKeys.ChatHistories)
    const chatHistoriesCorrespondingToVault = allHistories?.[vaultDir] ?? []
    return chatHistoriesCorrespondingToVault
  })

  ipcMain.handle('update-chat-history', (event, newChat: Chat) => {
    const vaultDir = windowsManager.getVaultDirectoryForWinContents(event.sender)
    const allChatHistories = store.get(StoreKeys.ChatHistories)
    if (!vaultDir) {
      return
    }
    const chatHistoriesCorrespondingToVault = allChatHistories?.[vaultDir] ?? []
    // check if chat history already exists. if it does, update it. if it doesn't append it
    const existingChatIndex = chatHistoriesCorrespondingToVault.findIndex((chat) => chat.id === newChat.id)
    if (existingChatIndex !== -1) {
      chatHistoriesCorrespondingToVault[existingChatIndex] = newChat
    } else {
      chatHistoriesCorrespondingToVault.push(newChat)
    }
    // store.set(StoreKeys.ChatHistories, allChatHistories);
    store.set(StoreKeys.ChatHistories, {
      ...allChatHistories,
      [vaultDir]: chatHistoriesCorrespondingToVault,
    })

    event.sender.send('update-chat-histories', chatHistoriesCorrespondingToVault)
  })

  ipcMain.handle('get-chat-history', (event, chatId: string) => {
    const vaultDir = windowsManager.getVaultDirectoryForWinContents(event.sender)
    if (!vaultDir) {
      return null
    }
    const allChatHistories = store.get(StoreKeys.ChatHistories)
    const vaultChatHistories = allChatHistories[vaultDir] || []
    return vaultChatHistories.find((chat) => chat.id === chatId)
  })

  ipcMain.handle('remove-chat-history-at-id', (event, chatID: string) => {
    const vaultDir = windowsManager.getVaultDirectoryForWinContents(event.sender)

    if (!vaultDir) {
      return
    }

    const chatHistoriesMap = store.get(StoreKeys.ChatHistories)
    const allChatHistories = chatHistoriesMap[vaultDir] || []
    const filteredChatHistories = allChatHistories.filter((item) => item.id !== chatID)

    chatHistoriesMap[vaultDir] = filteredChatHistories.reverse()
    store.set(StoreKeys.ChatHistories, chatHistoriesMap)
  })

  ipcMain.handle('get-current-open-files', () => store.get(StoreKeys.OpenTabs) || [])

  ipcMain.handle('add-current-open-files', (event, tab: Tab) => {
    if (tab === null) return
    const openTabs: Tab[] = store.get(StoreKeys.OpenTabs) || []
    const existingTab = openTabs.findIndex((item) => item.path === tab.path)

    /* If tab is already open, do not do anything */
    if (existingTab !== -1) return
    openTabs.push(tab)
    store.set(StoreKeys.OpenTabs, openTabs)
  })

  ipcMain.handle('remove-current-open-files', (event, tabId: string, idx: number, newIndex: number) => {
    // Ensure indices are within range
    const openTabs: Tab[] = store.get(StoreKeys.OpenTabs) || []
    if (idx < 0 || idx >= openTabs.length || newIndex < 0 || newIndex >= openTabs.length) return
    openTabs[idx].lastAccessed = false
    openTabs[newIndex].lastAccessed = true
    const updatedTabs = openTabs.filter((tab) => tab.id !== tabId)
    store.set(StoreKeys.OpenTabs, updatedTabs)
  })

  ipcMain.handle('clear-current-open-files', () => {
    store.set(StoreKeys.OpenTabs, [])
  })

  ipcMain.handle('update-current-open-files', (event, draggedIndex: number, targetIndex: number) => {
    const openTabs: Tab[] = store.get(StoreKeys.OpenTabs) || []
    if (draggedIndex < 0 || draggedIndex >= openTabs.length || targetIndex < 0 || targetIndex >= openTabs.length) return
    ;[openTabs[draggedIndex], openTabs[targetIndex]] = [openTabs[targetIndex], openTabs[draggedIndex]]
    store.set(StoreKeys.OpenTabs, openTabs)
  })

  ipcMain.handle('set-current-open-files', (event, tabs: Tab[]) => {
    if (tabs) store.set(StoreKeys.OpenTabs, tabs)
  })

  ipcMain.handle('remove-current-open-files-by-path', (event, filePath: string) => {
    if (!filePath) return
    const openTabs: Tab[] = store.get(StoreKeys.OpenTabs) || []
    // Filter out selected tab
    const updatedTabs = openTabs.filter((tab) => tab.path !== filePath)
    store.set(StoreKeys.OpenTabs, updatedTabs)
    event.sender.send('remove-tab-after-deletion', updatedTabs)
  })
}

export function getDefaultEmbeddingModelConfig(store: Store<StoreSchema>): EmbeddingModelConfig {
  const defaultEmbeddingModelAlias = store.get(StoreKeys.DefaultEmbeddingModelAlias) as string | undefined

  // Check if the default model alias is defined and not empty
  if (!defaultEmbeddingModelAlias) {
    throw new Error('No default embedding model is specified')
  }

  const embeddingModels = store.get(StoreKeys.EmbeddingModels) || {}

  // Check if the model with the default alias exists
  const model = embeddingModels[defaultEmbeddingModelAlias]
  if (!model) {
    throw new Error(`No embedding model found for alias '${defaultEmbeddingModelAlias}'`)
  }

  return model
}
