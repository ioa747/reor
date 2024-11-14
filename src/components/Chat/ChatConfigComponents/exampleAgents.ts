import { AgentConfig, PromptTemplate } from '../../../lib/llm/types'

const defaultAgentPromptTemplate: PromptTemplate = [
  {
    role: 'system',
    content: `You are a helpful assistant responding to the user's query. You are operating within the context of the user's personal knowledge base.

Here are some guidelines you must follow:
- Always respond in the same language as the user's query and context.
- You may be given context from the user's knowledge base that is relevant to the user's query. If so, please use it.
- The date and time of the query is {TODAY}.`,
  },
  {
    role: 'user',
    content: `{QUERY}`,
  },
]

// const researchAgentPromptTemplate: PromptTemplate = [
//   {
//     role: 'system',
//     content: `You are a helpful assistant helping a user organize and manage their personal knowledge and notes.
//   You will answer the user's question and help them with their request.
//   You can search the knowledge base by using the search tool and create new notes by using the create note tool.`,
//   },
//   {
//     role: 'user',
//     content: `{QUERY}`,
//   },
// ]

// const dailyNoteAgentPromptTemplate: PromptTemplate = [
//   {
//     role: 'system',
//     content: `You are a helpful assistant helping a user organize and manage their personal knowledge and notes.
// The user will write quick notes about their day to which you will respond with relevant information from things they have written before in that day and (if relevant) information from their knowledge base.

// - Try not to provide advice, nor be verbose.
// - The focus is entirely on the user and their thoughts, not you or your opinions.
// - You can use the search tool to find information from the user's knowledge base.
// - You can use the create note tool to create a new note for the user.
// - If you deem it necessary, you should motivate the user to be determined and keep working hard.
// When the user asks, you will create a note for them with all the relevant things they have noted in the day.`,
//   },
//   {
//     role: 'user',
//     content: `{QUERY}`,
//   },
// ]

// const reasoningAgentPromptTemplate: PromptTemplate = [
//   {
//     role: 'system',
//     content: `You an advanced reasoning agent. You think logically and critically and help the user think through their thoughts.`,
//   },
//   {
//     role: 'user',
//     content: `{QUERY}`,
//   },
// ]
const exampleAgents: AgentConfig[] = [
  {
    files: [],
    name: 'Default',
    dbSearchFilters: {
      limit: 20,
      minDate: undefined,
      maxDate: undefined,
      passFullNoteIntoContext: true,
    },
    toolDefinitions: [],
    promptTemplate: defaultAgentPromptTemplate,
  },
  // {
  //   files: [],
  //   name: 'Research Agent',
  //   toolDefinitions: [searchToolDefinition, createNoteToolDefinition],
  //   promptTemplate: researchAgentPromptTemplate,
  // },
  // {
  //   files: [],
  //   dbSearchFilters: {
  //     limit: 15,
  //     minDate: undefined,
  //     maxDate: undefined,
  //   },
  //   name: 'Daily Note Agent',
  //   toolDefinitions: [searchToolDefinition, createNoteToolDefinition],
  //   promptTemplate: dailyNoteAgentPromptTemplate,
  // },
  // {
  //   files: [],
  //   name: 'Reasoning Agent',
  //   toolDefinitions: [searchToolDefinition, createNoteToolDefinition],
  //   promptTemplate: reasoningAgentPromptTemplate,
  // },
]

export default exampleAgents
