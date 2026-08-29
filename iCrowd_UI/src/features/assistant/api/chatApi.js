import { apiClient } from '../../../lib/axios';

/**
 * Sends a message to the Spring Boot AI assistant endpoint /api/ai/chat.
 */
export const sendChatMessage = async (sessionId, message) => {
  try {
    const response = await apiClient.post('/ai/chat', {
      sessionId,
      message,
    });
    return response.data; // { reply: string, products: Product[] }
  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    throw error;
  }
};
