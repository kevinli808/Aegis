import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Loader, Home } from 'lucide-react';

interface FormData {
  name: string;
  phone: string;
  location: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  situation: string;
  medicalConditions: string;
  immediacy: string;
  isChild: boolean;
  hasMobilityLimitations: boolean;
  environmentalHazards: string;
  numberOfPeople: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function GeminiChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get form data from location state
  useEffect(() => {
    const state = location.state as { formData?: FormData } | null;
    if (!state?.formData) {
      navigate('/request-help');
      return;
    }
    setFormData(state.formData);

    // Initialize with welcome message
    const contextMsg: Message = {
      id: '0',
      role: 'assistant',
      content: `Welcome to Aegis Emergency Support! 👋\n\nI'm your AI emergency response assistant, and I've reviewed your help request. I understand you're in a situation that requires immediate attention, and I'm here to provide you with tailored guidance and support.\n\nBased on what you've shared, I can help you with:\n• Immediate safety recommendations\n• First aid and medical guidance\n• Resources and emergency contacts\n• Step-by-step instructions for your specific situation\n• Reassurance and emotional support\n\nPlease feel free to ask me any questions about your situation, request more detailed guidance on any aspect, or let me know if there's anything specific you need help with right now.\n\nWhat would you like to know more about?`,
      timestamp: new Date(),
    };
    setMessages([contextMsg]);
  }, [location, navigate]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !formData) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError('');

    try {
      // Filter out the greeting message (id: '0') for API - only send actual conversation
      const apiMessages = messages.filter((msg) => msg.id !== '0');
      
      // Check if this is the first actual user message
      const isFirstUserMessage = apiMessages.length === 0;

      // Build conversation history for backend
      const conversationHistory = apiMessages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.content,
      }));

      // Call backend API
      const response = await fetch('http://localhost:8000/chat/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_message: inputValue,
          conversation_history: conversationHistory,
          form_data: isFirstUserMessage ? formData : null,
          is_first_message: isFirstUserMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get response');
      }

      const result = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMsg);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 text-white py-4 sm:py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Emergency Support Chat</h1>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm">Home</span>
            </button>
          </div>
          <p className="text-gray-300 text-sm">
            Chat with an AI assistant for tailored guidance on your situation
          </p>
        </div>
      </div>

      {/* Help Request Summary */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">Your Situation</p>
              <p className="text-gray-900 font-medium">{formData.situation}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wide">Immediacy Level</p>
              <p className="text-gray-900 font-medium capitalize">{formData.immediacy}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm sm:text-base whitespace-pre-wrap">
                  {msg.content}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    msg.role === 'user'
                      ? 'text-blue-100'
                      : 'text-gray-500'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg rounded-bl-none">
                <Loader className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">Error: {error}</p>
              <p className="text-xs mt-1">Please try again.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask for guidance or more information..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
