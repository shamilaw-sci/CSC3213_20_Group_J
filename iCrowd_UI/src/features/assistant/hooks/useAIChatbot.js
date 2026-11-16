import { useState, useEffect, useRef, useCallback } from 'react';
import { sendChatMessage } from '../api/chatApi';
import { callGeminiChat } from '../api/geminiApi';

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome',
  sender: 'bot',
  text: 'ආයුබෝවන්! 👋 මම **iCrowd AI Smart Assistant**.\n\nඔබට අවශ්‍ය **Smartphones (iPhone, Samsung, Xiaomi)**, **Headsets**, **Fast Chargers**, **PowerBanks**, **Cases** හෝ Delivery/Warranty තොරතුරු පහසුවෙන්ම සොයා ගැනීමට මට සහාය විය හැක. ඔබ සොයන්නේ කුමක්ද?',
  products: null,
  suggestions: ['🍎 Apple iPhones', '📱 Smartphones', '🎧 Headsets', '🔋 PowerBanks', '🚚 Delivery Info'],
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const useAIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem('icrowd_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [isGeminiActive, setIsGeminiActive] = useState(() => {
    const saved = localStorage.getItem('icrowd_gemini_active');
    return saved === null ? Boolean(import.meta.env.VITE_GEMINI_API_KEY) : saved === 'true';
  });
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef(null);

  // Initialize or load session ID
  useEffect(() => {
    let currentSession = sessionStorage.getItem('icrowd_ai_session');
    if (!currentSession) {
      currentSession = 'session_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('icrowd_ai_session', currentSession);
    }
    setSessionId(currentSession);
  }, []);

  const saveGeminiKey = (key) => {
    setGeminiApiKey(key.trim());
    if (key && key.trim()) {
      localStorage.setItem('icrowd_gemini_key', key.trim());
      setIsGeminiActive(true);
      localStorage.setItem('icrowd_gemini_active', 'true');
    } else {
      localStorage.removeItem('icrowd_gemini_key');
      setIsGeminiActive(false);
      localStorage.setItem('icrowd_gemini_active', 'false');
    }
  };

  const toggleGemini = (active) => {
    setIsGeminiActive(active);
    localStorage.setItem('icrowd_gemini_active', active ? 'true' : 'false');
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  const sendMessage = async (text) => {
    if (!text || !text.trim() || loading) return;

    const userText = text.trim();
    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: userText,
      products: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Get current catalog facts before asking an optional language model.
      const response = await sendChatMessage(sessionId, userText);
      let reply = response.reply || 'Please check the product page for the latest details.';
      let isGemini = false;
      let notice = '';
      if (isGeminiActive && geminiApiKey.trim()) {
        try {
          reply = await callGeminiChat(userText, geminiApiKey, messages, response);
          isGemini = true;
        } catch (error) {
          notice = `${error.message} Showing the built-in store assistant's answer.`;
        }
      }
      setMessages(prev => [...prev, {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: reply,
        products: response.products || null,
        suggestions: response.suggestions || null,
        isGemini,
        notice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: 'bot_err_' + Date.now(),
        sender: 'bot',
        text: 'The store assistant is temporarily unavailable. Please check your connection and try again. Current prices and stock cannot be confirmed until the store reconnects.',
        products: null,
        suggestions: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        ...DEFAULT_WELCOME_MESSAGE,
        id: 'welcome_' + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return {
    isOpen,
    setIsOpen,
    messages,
    loading,
    sendMessage,
    clearChat,
    messagesEndRef,
    geminiApiKey,
    saveGeminiKey,
    isGeminiActive,
    toggleGemini,
    showSettings,
    setShowSettings,
  };
};
