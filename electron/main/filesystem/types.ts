export interface FileInfo {
  name: string;
  path: string;
  relativePath: string;
  dateModified: Date;
  dateCreated: Date;
}

export type FileInfoNode = FileInfo & {
  children?: FileInfoNode[];
};

export type FileInfoTree = FileInfoNode[];

export const isFileNodeDirectory = (fileInfo: FileInfoNode): boolean => {
  return fileInfo.children !== undefined;
};

export interface AugmentPromptWithFileProps {
  prompt: string;
  llmName: string;
  filePath: string;
}

export interface WriteFileProps {
  filePath: string;
  content: string;
}

export interface RenameFileProps {
  oldFilePath: string;
  newFilePath: string;
}