import * as lancedb from "vectordb";


import { errorToString } from "../Generic/error";

import { EnhancedEmbeddingFunction } from "./Embeddings";
import CreateDatabaseSchema, { isStringifiedSchemaEqual } from "./Schema";

const GetOrCreateLanceTable = async (
  db: lancedb.Connection,
  embedFunc: EnhancedEmbeddingFunction<string>,
  userDirectory: string
): Promise<lancedb.Table<string>> => {
  try {
    const allTableNames = await db.tableNames();
    const intendedSchema = CreateDatabaseSchema(embedFunc.contextLength);
    const tableName = generateTableName(embedFunc.name, userDirectory);

    if (allTableNames.includes(tableName)) {
      const table = await db.openTable(tableName, embedFunc);
      const schema = await table.schema;
      if (!isStringifiedSchemaEqual(schema, intendedSchema)) {
        await db.dropTable(tableName);

        const recreatedTable = await db.createTable({
          name: tableName,
          schema: intendedSchema,
          embeddingFunction: embedFunc,
        });
        return recreatedTable;
      }

      return table;
    }

    const newTable = await db.createTable({
      name: tableName,
      schema: intendedSchema,
      embeddingFunction: embedFunc,
    });
    return newTable;
  } catch (error) {
    const errorMessage = `Error in GetOrCreateLanceTable: ${errorToString(
      error
    )}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

export const generateTableName = (
  embeddingFuncName: string,
  userDirectory: string
): string => {
  const sanitizeForFileSystem = (str: string) => {
    return str.replace(/[<>:"/\\|?*]/g, "_");
  };

  const directoryPathAlias = sanitizeForFileSystem(userDirectory);
  const sanitizedEmbeddingFuncName = sanitizeForFileSystem(embeddingFuncName);

  return `ragnote_table_${sanitizedEmbeddingFuncName}_${directoryPathAlias}`;
};

export default GetOrCreateLanceTable;
