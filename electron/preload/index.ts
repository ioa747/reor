import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";
import {
  AugmentPromptWithFileProps,
  FileInfoNode,
  FileInfoTree,
  RenameFileProps,
  WriteFileProps,
} from "electron/main/Files/Types";
import { PromptWithContextLimit } from "electron/main/Prompts/Prompts";
import {
  EmbeddingModelConfig,
  EmbeddingModelWithLocalPath,
  EmbeddingModelWithRepo,
  HardwareConfig,
  LLMConfig,
  LLMGenerationParameters,
} from "electron/main/Store/storeConfig";
import { DBEntry, DBQueryResult } from "electron/main/database/Schema";
import { BasePromptRequirements } from "electron/main/database/dbSessionHandlerTypes";
import { PromptWithRagResults } from "electron/main/database/dbSessionHandlers";

import { ChatHistory } from "@/components/Chat/Chat";
import { ChatHistoryMetadata } from "@/components/Chat/hooks/use-chat-history";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReceiveCallback = (...args: any[]) => void;

declare global {
  interface Window {
    ipcRenderer: {
      on: (channel: string, listener: (...args: unknown[]) => void) => void;
      receive: (channel: string, callback: ReceiveCallback) => () => void;
    };
    electron: {
      openExternal: (url: string) => void;
      getPlatform: () => string;
      openNewWindow: () => void;
      getReorAppVersion: () => Promise<string>;
    };
    contextMenu: {
      showFileItemContextMenu: (filePath: FileInfoNode) => void;
    };
    contextFileMenu: {
      showMenuItemContext: () => void;
    }
    contextChatMenu: {
      showChatItemContext: (chatRow: ChatHistoryMetadata) => void;
    };
    database: {
      search: (
        query: string,
        limit: number,
        filter?: string
      ) => Promise<DBQueryResult[]>;
      searchWithReranking: (
        query: string,
        limit: number,
        filter?: string
      ) => Promise<DBQueryResult[]>;
      deleteLanceDBEntriesByFilePath: (filePath: string) => Promise<void>;
      indexFilesInDirectory: () => Promise<void>;
      augmentPromptWithTemporalAgent: ({
        query,
        llmName,
      }: BasePromptRequirements) => Promise<PromptWithRagResults>;
      augmentPromptWithFlashcardAgent: ({
        query,
        llmName,
        filePathToBeUsedAsContext,
      }: BasePromptRequirements) => Promise<PromptWithRagResults>;
      getDatabaseFields: () => Promise<Record<string, string>>;
    };
    files: {
      openDirectoryDialog: () => Promise<string[]>;
      openFileDialog: (fileExtensions?: string[]) => Promise<string[]>;
      getFilesTreeForWindow: () => Promise<FileInfoTree>;
      writeFile: (writeFileProps: WriteFileProps) => Promise<void>;
      isDirectory: (filepath: string) => Promise<boolean>;
      renameFileRecursive: (renameFileProps: RenameFileProps) => Promise<void>;
      indexFileInDatabase: (filePath: string) => Promise<void>;
      readFile: (filePath: string) => Promise<string>;
      checkFileExists(filePath: string): Promise<boolean>;
      deleteFile: (filePath: string) => Promise<void>;
      createFile: (filePath: string, content: string) => Promise<void>;
      createDirectory: (dirPath: string) => Promise<void>;
      moveFileOrDir: (
        sourcePath: string,
        destinationPath: string
      ) => Promise<void>;
      augmentPromptWithFile: (
        augmentPromptWithFileProps: AugmentPromptWithFileProps
      ) => Promise<PromptWithContextLimit>;
      getFilesystemPathsAsDBItems: (paths: string[]) => Promise<DBEntry[]>;
      generateFlashcardsWithFile: (
        flashcardWithFileProps: AugmentPromptWithFileProps
      ) => Promise<string>;
    };
    path: {
      basename: (pathString: string) => Promise<string>;
      join: (...pathSegments: string[]) => Promise<string>;
      dirname: (pathString: string) => Promise<string>;
      relative: (from: string, to: string) => Promise<string>;
      addExtensionIfNoExtensionPresent: (pathString: string) => Promise<string>;
      pathSep: () => Promise<string>;
      getAllFilenamesInDirectory: (dirName: string) => Promise<string[]>;
      getAllFilenamesInDirectoryRecursively: (
        dirName: string
      ) => Promise<string[]>;
    };
    llm: {
      streamingLLMResponse: (
        llmName: string,
        llmConfig: LLMConfig,
        isJSONMode: boolean,
        chatHistory: ChatHistory
      ) => Promise<string>;
      getLLMConfigs: () => Promise<LLMConfig[]>;
      pullOllamaModel: (modelName: string) => Promise<void>;
      addOrUpdateLLM: (modelConfig: LLMConfig) => Promise<void>;
      removeLLM: (modelNameToDelete: string) => Promise<void>;
      setDefaultLLM: (modelName: string) => void;
      getDefaultLLMName: () => Promise<string>;
      sliceListOfStringsToContextLength: (
        strings: string[],
        llmName: string
      ) => Promise<string[]>;
      sliceStringToContextLength: (
        inputString: string,
        llmName: string
      ) => Promise<string>;
    };
    electronStore: {
      setVaultDirectoryForWindow: (path: string) => Promise<void>;
      getVaultDirectoryForWindow: () => Promise<string>;
      getDefaultEmbeddingModel: () => Promise<string>;
      setDefaultEmbeddingModel: (repoName: string) => void;
      addNewLocalEmbeddingModel: (model: EmbeddingModelWithLocalPath) => void;
      addNewRepoEmbeddingModel: (model: EmbeddingModelWithRepo) => void;
      getEmbeddingModels: () => Promise<Record<string, EmbeddingModelConfig>>;
      updateEmbeddingModel: (
        modelName: string,
        updatedModel: EmbeddingModelWithLocalPath | EmbeddingModelWithRepo
      ) => void;
      removeEmbeddingModel: (modelName: string) => void;
      getNoOfRAGExamples: () => Promise<number>;
      setNoOfRAGExamples: (noOfExamples: number) => void;
      getChunkSize: () => Promise<number>;
      setChunkSize: (chunkSize: number) => void;
      getHardwareConfig: () => Promise<HardwareConfig>;
      setHardwareConfig: (config: HardwareConfig) => void;
      getLLMGenerationParams: () => Promise<LLMGenerationParameters>;
      setLLMGenerationParams: (params: LLMGenerationParameters) => void;
      getAnalyticsMode: () => Promise<boolean>;
      setAnalyticsMode: (isAnalytics: boolean) => void;
      getHasUserOpenedAppBefore: () => boolean;
      setHasUserOpenedAppBefore: () => void;
      getAllChatHistories: () => Promise<ChatHistory[]>;
      updateChatHistory: (chatHistory: ChatHistory) => void;
      getChatHistory: (chatID: string) => Promise<ChatHistory>;
      removeChatHistoryAtID: (chatID: string) => void;
    };
  }
}

contextBridge.exposeInMainWorld("database", {
  search: async (
    query: string,
    limit: number,
    filter?: string
  ): Promise<DBEntry[]> => {
    return ipcRenderer.invoke("search", query, limit, filter);
  },
  searchWithReranking: async (
    query: string,
    limit: number,
    filter?: string
  ): Promise<DBEntry[]> => {
    return ipcRenderer.invoke("search-with-reranking", query, limit, filter);
  },
  deleteLanceDBEntriesByFilePath: async (filePath: string): Promise<void> => {
    return ipcRenderer.invoke("delete-lance-db-entries-by-filepath", filePath);
  },
  indexFilesInDirectory: async () => {
    return ipcRenderer.invoke("index-files-in-directory");
  },
  augmentPromptWithRAG: async (
    prompt: string,
    llmName: string,
    filter?: string
  ): Promise<PromptWithRagResults> => {
    return ipcRenderer.invoke(
      "augment-prompt-with-rag",
      prompt,
      llmName,
      filter
    );
  },
  augmentPromptWithTemporalAgent: async ({
    query,
    llmName,
  }: BasePromptRequirements): Promise<PromptWithRagResults> => {
    return ipcRenderer.invoke("augment-prompt-with-temporal-agent", {
      query,
      llmName,
    });
  },
  augmentPromptWithFlashcardAgent: async ({
    query,
    llmName,
    filePathToBeUsedAsContext,
  }: BasePromptRequirements): Promise<PromptWithRagResults> => {
    console.log(llmName, query);
    return ipcRenderer.invoke("augment-prompt-with-flashcard-agent", {
      query,
      llmName,
      filePathToBeUsedAsContext,
    });
  },
  getDatabaseFields: async (): Promise<Record<string, string>> => {
    return ipcRenderer.invoke("get-database-fields");
  },
});

contextBridge.exposeInMainWorld("electron", {
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  getPlatform: () => ipcRenderer.invoke("get-platform"),
  openNewWindow: () => ipcRenderer.invoke("open-new-window"),
  getReorAppVersion: () => ipcRenderer.invoke("get-reor-app-version"),
});

contextBridge.exposeInMainWorld("electronStore", {
  setVaultDirectoryForWindow: (path: string) => {
    return ipcRenderer.invoke("set-vault-directory-for-window", path);
  },
  getVaultDirectoryForWindow: () => {
    return ipcRenderer.invoke("get-vault-directory-for-window");
  },

  getDefaultEmbeddingModel: () => {
    return ipcRenderer.invoke("get-default-embedding-model");
  },
  setDefaultEmbeddingModel: (repoName: string) => {
    ipcRenderer.invoke("set-default-embedding-model", repoName);
  },

  addNewLocalEmbeddingModel: (model: EmbeddingModelWithLocalPath) => {
    ipcRenderer.invoke("add-new-local-embedding-model", model);
  },
  getEmbeddingModels: () => {
    return ipcRenderer.invoke("get-embedding-models");
  },
  addNewRepoEmbeddingModel: (model: EmbeddingModelWithRepo) => {
    ipcRenderer.invoke("add-new-repo-embedding-model", model);
  },
  updateEmbeddingModel: (
    modelName: string,
    updatedModel: EmbeddingModelWithLocalPath | EmbeddingModelWithRepo
  ) => {
    ipcRenderer.invoke("update-embedding-model", modelName, updatedModel);
  },
  removeEmbeddingModel: (modelName: string) => {
    ipcRenderer.invoke("remove-embedding-model", modelName);
  },

  getNoOfRAGExamples: () => {
    return ipcRenderer.invoke("get-no-of-rag-examples");
  },
  setNoOfRAGExamples: (noOfExamples: number) => {
    ipcRenderer.invoke("set-no-of-rag-examples", noOfExamples);
  },
  getChunkSize: () => {
    return ipcRenderer.invoke("get-chunk-size");
  },
  setChunkSize: (chunkSize: number) => {
    ipcRenderer.invoke("set-chunk-size", chunkSize);
  },
  getHardwareConfig: () => {
    return ipcRenderer.invoke("get-hardware-config");
  },
  setHardwareConfig: (config: HardwareConfig) => {
    ipcRenderer.invoke("set-hardware-config", config);
  },
  getLLMGenerationParams: () => {
    return ipcRenderer.invoke("get-llm-generation-params");
  },
  setLLMGenerationParams: (params: LLMGenerationParameters) => {
    ipcRenderer.invoke("set-llm-generation-params", params);
  },
  getAnalyticsMode: () => {
    return ipcRenderer.invoke("get-analytics-mode");
  },
  setAnalyticsMode: (isAnalytics: boolean) => {
    ipcRenderer.invoke("set-analytics-mode", isAnalytics);
  },
  getHasUserOpenedAppBefore: () => {
    return ipcRenderer.invoke("has-user-opened-app-before");
  },
  setHasUserOpenedAppBefore: () => {
    return ipcRenderer.invoke("set-user-has-opened-app-before");
  },
  getAllChatHistories: () => {
    return ipcRenderer.invoke("get-all-chat-histories");
  },
  updateChatHistory: (chatHistory: ChatHistory) => {
    ipcRenderer.invoke("update-chat-history", chatHistory);
  },
  removeChatHistoryAtID: (chatID: string) => {
    ipcRenderer.invoke("remove-chat-history-at-id", chatID);
  },
  getChatHistory: (chatID: string) => {
    return ipcRenderer.invoke("get-chat-history", chatID);
  },
});

contextBridge.exposeInMainWorld("ipcRenderer", {
  on: ipcRenderer.on,
  receive: (channel: string, callback: (...args: unknown[]) => void) => {
    // this creates a constant copy of the callback, thus ensuring that the removed listener is the same as the one added
    const subscription = (event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);

    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
});

contextBridge.exposeInMainWorld("contextMenu", {
  showFileItemContextMenu: (file: FileInfoNode) => {
    ipcRenderer.invoke("show-context-menu-file-item", file);
  },
});

contextBridge.exposeInMainWorld("contextFileMenu", {
  showMenuItemContext: () => {
    ipcRenderer.invoke("show-context-menu-item");
  },
});

contextBridge.exposeInMainWorld("contextChatMenu", {
  showChatItemContext: (chatRow: ChatHistoryMetadata) => {
    ipcRenderer.invoke("show-chat-menu-item", chatRow.id);
  },
});

contextBridge.exposeInMainWorld("files", {
  openDirectoryDialog: () => ipcRenderer.invoke("open-directory-dialog"),
  openFileDialog: (fileExtensions?: string[]) =>
    ipcRenderer.invoke("open-file-dialog", fileExtensions),
  getFilesTreeForWindow: async (): Promise<FileInfoTree> => {
    return ipcRenderer.invoke("get-files-tree-for-window");
  },

  writeFile: async (writeFileProps: WriteFileProps) => {
    return ipcRenderer.invoke("write-file", writeFileProps);
  },
  isDirectory: async (filePath: string) => {
    return ipcRenderer.invoke("is-directory", filePath);
  },
  renameFileRecursive: async (renameFileProps: RenameFileProps) => {
    return ipcRenderer.invoke("rename-file-recursive", renameFileProps);
  },

  indexFileInDatabase: async (filePath: string) => {
    return ipcRenderer.invoke("index-file-in-database", filePath);
  },

  createFile: async (filePath: string, content: string) => {
    return ipcRenderer.invoke("create-file", filePath, content);
  },

  createDirectory: async (dirPath: string) => {
    return ipcRenderer.invoke("create-directory", dirPath);
  },

  readFile: async (filePath: string) => {
    return ipcRenderer.invoke("read-file", filePath);
  },
  checkFileExists: async (filePath: string) => {
    return ipcRenderer.invoke("check-file-exists", filePath);
  },
  deleteFile: (filePath: string) => {
    return ipcRenderer.invoke("delete-file", filePath);
  },

  moveFileOrDir: async (sourcePath: string, destinationPath: string) => {
    return ipcRenderer.invoke("move-file-or-dir", sourcePath, destinationPath);
  },
  augmentPromptWithFile: async (
    augmentPromptWithFileProps: AugmentPromptWithFileProps
  ): Promise<PromptWithContextLimit> => {
    return ipcRenderer.invoke(
      "augment-prompt-with-file",
      augmentPromptWithFileProps
    );
  },
  getFilesystemPathsAsDBItems: async (paths: string[]): Promise<DBEntry[]> => {
    return ipcRenderer.invoke("get-filesystem-paths-as-db-items", paths);
  },
  generateFlashcardsWithFile: async (
    flashcardWithFileProps: AugmentPromptWithFileProps
  ): Promise<string> => {
    return ipcRenderer.invoke(
      "generate-flashcards-from-file",
      flashcardWithFileProps
    );
  },
});

contextBridge.exposeInMainWorld("path", {
  basename: (pathString: string) => {
    return ipcRenderer.invoke("path-basename", pathString);
  },
  join: (...pathSegments: string[]) =>
    ipcRenderer.invoke("join-path", ...pathSegments),
  dirname: (pathString: string) => {
    return ipcRenderer.invoke("path-dirname", pathString);
  },
  relative: (from: string, to: string) => {
    return ipcRenderer.invoke("path-relative", from, to);
  },
  addExtensionIfNoExtensionPresent: (pathString: string) => {
    return ipcRenderer.invoke(
      "add-extension-if-no-extension-present",
      pathString
    );
  },
  pathSep: () => {
    return ipcRenderer.invoke("path-sep");
  },
  getAllFilenamesInDirectory: (dirName: string) => {
    return ipcRenderer.invoke("get-files-in-directory", dirName);
  },
  getAllFilenamesInDirectoryRecursively: (dirName: string) => {
    return ipcRenderer.invoke("get-files-in-directory-recursive", dirName);
  },
});

contextBridge.exposeInMainWorld("llm", {
  streamingLLMResponse: async (
    llmName: string,
    llmConfig: LLMConfig,
    isJSONMode: boolean,
    chatHistory: ChatHistory
  ) => {
    return await ipcRenderer.invoke(
      "streaming-llm-response",
      llmName,
      llmConfig,
      isJSONMode,
      chatHistory
    );
  },

  getLLMConfigs: async (): Promise<LLMConfig[]> => {
    return ipcRenderer.invoke("get-llm-configs");
  },

  pullOllamaModel: async (modelName: string) => {
    return await ipcRenderer.invoke("pull-ollama-model", modelName);
  },
  addOrUpdateLLM: async (modelConfig: LLMConfig) => {
    return ipcRenderer.invoke("add-or-update-llm", modelConfig);
  },
  removeLLM: async (modelNameToDelete: string) => {
    return await ipcRenderer.invoke("remove-llm", modelNameToDelete);
  },
  setDefaultLLM: (modelName: string) => {
    ipcRenderer.invoke("set-default-llm", modelName);
  },

  getDefaultLLMName: () => {
    return ipcRenderer.invoke("get-default-llm-name");
  },

  sliceListOfStringsToContextLength: (
    strings: string[],
    llmName: string
  ): Promise<string[]> => {
    return ipcRenderer.invoke(
      "slice-list-of-strings-to-context-length",
      strings,
      llmName
    );
  },

  sliceStringToContextLength: (
    inputString: string,
    llmName: string
  ): Promise<string> => {
    return ipcRenderer.invoke(
      "slice-string-to-context-length",
      inputString,
      llmName
    );
  },
});
