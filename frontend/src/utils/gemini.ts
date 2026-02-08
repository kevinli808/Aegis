import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('VITE_GEMINI_API_KEY is not set in environment variables');
}

export const genAI = new GoogleGenerativeAI(apiKey || '');

export async function getChatResponse(
  conversationHistory: { role: string; content: string }[],
  userMessage: string
) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Format messages for Gemini API
    const history = conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    throw error;
  }
}

export function buildContextPrompt(formData: any): string {
  return `
The user has submitted the following help request:

Name: ${formData.name}
Phone: ${formData.phone}
Location: ${formData.location}
City: ${formData.city}, ${formData.province} ${formData.postalCode}

Situation: ${formData.situation}

Medical Conditions: ${formData.medicalConditions || 'None reported'}
Immediacy Level: ${formData.immediacy}
Number of People Affected: ${formData.numberOfPeople}

Environmental Hazards: ${formData.environmentalHazards || 'None reported'}
Is Child Involved: ${formData.isChild ? 'Yes' : 'No'}
Has Mobility Limitations: ${formData.hasMobilityLimitations ? 'Yes' : 'No'}

You are a trained emergency response assistant. Based on the situation described above, provide:
1. Immediate safety recommendations
2. First aid guidance if applicable
3. Resources and next steps
4. Reassurance and support

Be compassionate, clear, and concise. Focus on actionable advice.
`;
}
