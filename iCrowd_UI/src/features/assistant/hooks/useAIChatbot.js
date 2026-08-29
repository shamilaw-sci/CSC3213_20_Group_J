import { useState, useEffect, useRef, useCallback } from 'react';
import { sendChatMessage } from '../api/chatApi';

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome',
  sender: 'bot',
  text: 'ආයුබෝවන්! 👋 මම iCrowd AI Smart Phone & Accessories සහායකයා. ඔබට Flagship Smartphones (Apple iPhone 15 Pro, Samsung S24 Ultra, Pixel, Xiaomi) හෝ High-Quality Accessories (Headsets, Fast Chargers, MagSafe Cases) තෝරාගැනීමට මම සූදානම්. ඔබ සොයන්නේ කුමක්ද?',
  products: null,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const useAIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  const sendMessage = async (text) => {
    if (!text || !text.trim()) return;

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
      const response = await sendChatMessage(sessionId, userText);
      const botMsg = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: response.reply || 'මෙන්න ඔබගේ සෙවීමට ගැළපෙන හොඳම නිෂ්පාදන:',
        products: response.products || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      // Fallback message if backend isn't responding
      const fallbackMsg = {
        id: 'bot_err_' + Date.now(),
        sender: 'bot',
        text: 'සමාවෙන්න, Backend API සම්බන්ධ කර ගැනීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.',
        products: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
  };

  return {
    isOpen,
    setIsOpen,
    messages,
    loading,
    sendMessage,
    clearChat,
    messagesEndRef,
  };
};
