import { isFileNodeDirectory } from '@shared/utils'
import { FileInfo, FileInfoTree } from 'electron/main/filesystem/types'

function flattenFileInfoTree(tree: FileInfoTree): FileInfo[] {
  return tree.reduce((flatList: FileInfo[], node) => {
    if (!isFileNodeDirectory(node)) {
      flatList.push({
        name: node.name,
        path: node.path,
        relativePath: node.relativePath,
        dateModified: node.dateModified,
        dateCreated: node.dateCreated,
      })
    }
    if (isFileNodeDirectory(node) && node.children) {
      flatList.push(...flattenFileInfoTree(node.children))
    }
    return flatList
  }, [])
}

export const sortFilesAndDirectories = (fileList: FileInfoTree, currentFilePath: string | null): FileInfoTree => {
  fileList.sort((a, b) => {
    const aIsDirectory = isFileNodeDirectory(a)
    const bIsDirectory = isFileNodeDirectory(b)

    if (aIsDirectory && bIsDirectory) {
      return a.name.localeCompare(b.name)
    }

    if (aIsDirectory && !bIsDirectory) {
      return -1
    }
    if (!aIsDirectory && bIsDirectory) {
      return 1
    }

    if (currentFilePath !== null) {
      if (a.path === currentFilePath) {
        return -1
      }
      if (b.path === currentFilePath) {
        return 1
      }
    }

    return b.dateModified.getTime() - a.dateModified.getTime()
  })

  fileList.forEach((fileInfoNode) => {
    if (fileInfoNode.children && fileInfoNode.children.length > 0) {
      sortFilesAndDirectories(fileInfoNode.children, currentFilePath)
    }
  })

  return fileList
}

export const moveFile = async (sourcePath: string, destinationPath: string) => {
  await window.fileSystem.moveFileOrDir(sourcePath, destinationPath)
}

export const getFilesInDirectory = async (directoryPath: string, filesTree: FileInfo[]): Promise<FileInfo[]> => {
  return filesTree.filter((file) => file.path.startsWith(directoryPath))
}

export function getNextUntitledFilename(existingFilenames: string[]): string {
  const untitledRegex = /^Untitled (\d+)\.md$/

  const existingNumbers = existingFilenames
    .filter((filename) => untitledRegex.test(filename))
    .map((filename) => {
      const match = filename.match(untitledRegex)
      return match ? parseInt(match[1], 10) : 0
    })

  const maxNumber = Math.max(0, ...existingNumbers)

  return `Untitled ${maxNumber + 1}.md`
}

export default flattenFileInfoTree
