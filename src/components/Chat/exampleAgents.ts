import { createNoteToolDefinition, searchToolDefinition } from './tools'
import { AgentConfig, PromptTemplate } from './types'

const defaultAgentPromptTemplate: PromptTemplate = [
  {
    role: 'system',
    content: `You are a helpful assistant helping a user organize and manage their personal knowledge and notes. 
  You will answer the user's question and help them with their request. 
  You can search the knowledge base by using the search tool and create new notes by using the create note tool.
  
  An initial query has been made and the context is already provided for you (so please do not call the search tool initially).`,
  },
  {
    role: 'user',
    content: `Context retrieved from your knowledge base for the query below: \n{CONTEXT}\n\n\nQuery for context above:\n{QUERY}`,
  },
]

const researchAgentPromptTemplate: PromptTemplate = [
  {
    role: 'system',
    content: `You are a helpful assistant helping a user organize and manage their personal knowledge and notes. 
  You will answer the user's question and help them with their request. 
  You can search the knowledge base by using the search tool and create new notes by using the create note tool.`,
  },
  {
    role: 'user',
    content: `{QUERY}`,
  },
]

const dailyNoteAgentPromptTemplate: PromptTemplate = [
  {
    role: 'system',
    content: `You are a helpful assistant helping a user organize and manage their personal knowledge and notes. 
The user will write quick notes about their day to which you will respond with relevant information from things they have written before in that day and (if relevant) information from their knowledge base.

- Try not to provide advice, nor be verbose. 
- The focus is entirely on the user and their thoughts, not you or your opinions.
- You can use the search tool to find information from the user's knowledge base.
- You can use the create note tool to create a new note for the user.
- If you deem it necessary, you should motivate the user to be determined and keep working hard.
When the user asks, you will create a note for them with all the relevant things they have noted in the day.`,
  },
  {
    role: 'user',
    content: `{QUERY}`,
  },
]

const exampleAgents: AgentConfig[] = [
  {
    files: [],
    limit: 15,
    minDate: new Date(0),
    maxDate: new Date(),
    name: 'Default',
    toolDefinitions: [searchToolDefinition, createNoteToolDefinition],
    promptTemplate: defaultAgentPromptTemplate,
  },
  {
    files: [],
    limit: 15,
    minDate: new Date(0),
    maxDate: new Date(),
    name: 'Research Agent',
    toolDefinitions: [searchToolDefinition, createNoteToolDefinition],
    promptTemplate: researchAgentPromptTemplate,
  },
  {
    files: [],
    limit: 15,
    minDate: new Date(0),
    maxDate: new Date(),
    name: 'Daily Note Agent',
    toolDefinitions: [searchToolDefinition, createNoteToolDefinition],
    promptTemplate: dailyNoteAgentPromptTemplate,
  },
]

export default exampleAgents
