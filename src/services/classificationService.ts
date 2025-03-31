import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { env } from '../config';
import logger from '../utils/logger';
import { ClassificationResult, MessageContext } from '../types';
import { EmergencyCategory } from '../models/flaggedMessage';

// Initialize the OpenAI model
const model = new ChatOpenAI({
  openAIApiKey: env.OPENAI_API_KEY,
  modelName: 'gpt-4o',
  temperature: 0.1,
});

// Create a parser for the output
const outputParser = new StringOutputParser();

// Create a prompt template for emergency detection
const promptTemplate = PromptTemplate.fromTemplate(`
You are an emergency detection system that specializes in identifying potential emergency situations in WhatsApp messages.
Your task is to analyze the message and determine if it indicates any of the following emergency categories:

1. MENTAL_HEALTH: Messages indicating depression, suicidal thoughts, severe anxiety, or other mental health crises.
2. MEDICAL: Messages indicating physical health emergencies, requests for medical assistance, or reports of injury.
3. CONFLICT: Messages indicating violent situations, abuse, threats, or severe aggressive behavior.
4. OTHER: Other types of emergencies not covered by the above categories.

If the message does not indicate an emergency, classify it as safe.

Here is the message to analyze:
"{messageContent}"

Context (previous messages in the group chat):
{context}

Analyze the text carefully and return a JSON object with the following fields:
- isEmergency: Boolean indicating if this is an emergency situation
- emergencyCategory: One of "MENTAL_HEALTH", "MEDICAL", "CONFLICT", "OTHER", or null if not an emergency
- confidenceScore: Number between 0 and 1 indicating your confidence in the classification
- explanation: Brief explanation of your classification

Response format:
{{
  "isEmergency": boolean,
  "emergencyCategory": string | null,
  "confidenceScore": number,
  "explanation": string
}}
`);

/**
 * Classify a message to determine if it represents an emergency
 * @param messageContext The message and its context to classify
 * @returns Classification result
 */
export async function classifyMessage(
  messageContext: MessageContext,
): Promise<ClassificationResult> {
  try {
    const { message, previousMessages } = messageContext;

    // Format previous messages as context
    const contextString = previousMessages.length
      ? previousMessages.map((m) => `${m.author || m.from}: ${m.body}`).join('\n')
      : 'No previous messages available';

    // Create the chain
    const chain = promptTemplate.pipe(model).pipe(outputParser);

    // Execute the chain
    const result = await chain.invoke({
      messageContent: message.body,
      context: contextString,
    });

    // Parse the JSON response
    try {
      const parsedResult = JSON.parse(result) as ClassificationResult;
      logger.debug('Message classification result', {
        messageId: message.id,
        result: parsedResult,
      });
      return parsedResult;
    } catch (parseError) {
      logger.error('Failed to parse classification result', {
        error: parseError,
        rawResult: result,
      });

      // Return a default result in case of parsing failure
      return {
        isEmergency: false,
        emergencyCategory: null,
        confidenceScore: 0,
        explanation: 'Failed to parse classification result',
      };
    }
  } catch (error) {
    logger.error('Error classifying message', error);
    throw error;
  }
}
