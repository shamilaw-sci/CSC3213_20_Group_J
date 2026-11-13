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
    return localStorage.getItem('icrowd_gemini_active') === 'true' || Boolean(import.meta.env.VITE_GEMINI_API_KEY);
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
    setGeminiApiKey(key);
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

    // ── Priority 1: External AI Engine (Google Gemini 1.5 Flash) if configured ─
    if (isGeminiActive && geminiApiKey && geminiApiKey.trim()) {
      try {
        const geminiReply = await callGeminiChat(userText, geminiApiKey, messages);
        const botMsg = {
          id: 'bot_gemini_' + Date.now(),
          sender: 'bot',
          text: geminiReply,
          products: null,
          isGemini: true,
          suggestions: ['🍎 Apple iPhones', '📱 Smartphones', '🔋 PowerBanks', '🚚 Delivery Info'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
        setLoading(false);
        return;
      } catch (geminiErr) {
        console.warn('Gemini AI failed, falling back to backend/local engine:', geminiErr);
      }
    }

    // ── Priority 2: Spring Boot Backend Assistant Service ─────────────────────
    try {
      const response = await sendChatMessage(sessionId, userText);
      const botMsg = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: response.reply || 'මෙන්න ඔබගේ සෙවීමට ගැළපෙන හොඳම නිෂ්පාදන:',
        products: response.products || null,
        suggestions: response.suggestions || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.warn('AI Chat API fallback activated:', err);

      const lower = userText.toLowerCase();
      let fallbackText = '';
      let fallbackSuggestions = ['🍎 Apple iPhones', '📱 Smartphones', '🎧 Headsets', '🚚 Delivery Info'];

      // ── Priority 3: Built-in Smart Local Fallback Grounded in iCrowd Store ───
      if (lower.includes('apple') || lower.includes('iphone') || lower.includes('ඇපල්')) {
        fallbackText = '🍎 **Apple iPhone මාදිලි (iCrowd Store Official Lineup):**\n\n' +
          '1. **iPhone 16 Pro Max / 16 Pro:** නවතම A18 Pro Bionic Chip, Grade 5 Titanium නිමාව, Action Button & Camera Control. (iCrowd මිල: රු. 389,000/=) ✅ තොග ඇත\n' +
          '2. **iPhone 15 / 15 Plus:** Dynamic Island, USB-C Port, 48MP Main Camera, සහ A16 Bionic. (iCrowd මිල: රු. 249,000/=) ✅ තොග ඇත\n' +
          '3. **iPhone 14 / 13 Series:** විශිෂ්ට Battery Life සහ Super Retina XDR OLED Display සහිත Budget Flagship විකල්ප.\n' +
          '4. **iPhone SE (3rd Gen):** A15 Bionic සහිත Compact ආර්ථික iPhone මාදිලිය.\n\n' +
          '⚡ **Apple Original Accessories අප සතුව ඇත:**\n' +
          '• Apple MagSafe Silicone Cases (රු. 14,500/=)\n' +
          '• Apple Original USB-C Fast Chargers & Cables\n' +
          '• Apple AirPods Max Wireless Headset (රු. 195,000/=)\n\n' +
          '*(සියලුම iPhone සඳහා වසරක Official Apple Warranty සහ නොමිලේ දිවයින පුරා VIP Insured Delivery හිමිවේ.)*';
        fallbackSuggestions = ['📱 iPhone 16 Pro Max', '📱 iPhone 15', '🛡️ MagSafe Cases', '🚚 Delivery Info'];
      } else if (lower.includes('samsung') || lower.includes('galaxy') || lower.includes('සැම්සුන්ග්')) {
        fallbackText = '📱 **Samsung Galaxy Smartphone මාදිලි (iCrowd Lineup):**\n\n' +
          '1. **Galaxy S24 Ultra (Flagship):** Galaxy AI, 200MP Camera, Titanium Frame, S-Pen Support, Snapdragon 8 Gen 3. (iCrowd මිල: රු. 369,900/=) ✅ තොග ඇත\n' +
          '2. **Galaxy A55 / A35 5G:** Super AMOLED 120Hz Display, IP67 ජල ප්‍රතිරෝධීතාව සහිත Mid-Range Kings.\n' +
          '3. **Galaxy A05s / A05:** රු. 40,000 - 55,000 සීමාවේ විශ්වාසනීය Budget Smartphones.\n\n' +
          '⚡ Samsung සඳහා Fast Chargers, Cases සහ Screen Protectors අප සතුව ඇත.';
        fallbackSuggestions = ['📱 Galaxy S24 Ultra', '🔋 Fast Chargers', '🛡️ Phone Cases', '🚚 Delivery Info'];
      } else if (lower.includes('xiaomi') || lower.includes('redmi') || lower.includes('ශිරෝමි')) {
        fallbackText = '📱 **Xiaomi / Redmi Smartphone මාදිලි (iCrowd Lineup):**\n\n' +
          '1. **Xiaomi 14 Ultra (Flagship):** Leica Quad Camera, 1-inch sensor, 90W HyperCharge. (iCrowd මිල: රු. 349,000/=) ✅ තොග ඇත\n' +
          '2. **Redmi Note 13 Pro+:** 200MP Camera, AMOLED 120Hz, 120W HyperCharge.\n' +
          '3. **Redmi 13C / Redmi 12:** රු. 45,000 - 55,000 සීමාවේ හොඳම Budget Smartphones.';
        fallbackSuggestions = ['📱 Xiaomi 14 Ultra', '🔋 Fast Chargers', '🛡️ Phone Cases', '🚚 Delivery Info'];
      } else if (lower.includes('50000') || lower.includes('50k') || (lower.includes('phone') && (lower.includes('adu') || lower.includes('budget') || lower.includes('ganna')))) {
        fallbackText = '📱 **රු. 50,000 සීමාවේ ලංකාවේ මිලදී ගත හැකි හොඳම Phone Brands & Models:**\n\n' +
          '1. **Xiaomi / Redmi:** Redmi 13C, Redmi 12 (5000mAh Battery & 90Hz Display)\n' +
          '2. **Samsung:** Galaxy A05s, Galaxy A05 (Official Brand Trust & Regular Updates)\n' +
          '3. **Vivo / Oppo:** Vivo Y17s, Oppo A18 (Slim Design & Fast Camera)\n' +
          '4. **Realme:** Realme C53 (Fast 33W Fast Charging)\n\n' +
          '⚡ **iCrowd Store එකෙන් ඔබට ලැබෙන වාසිය:**\n' +
          'අපගේ Store එක මගින් මෙම සියලුම දුරකථන සඳහා අවශ්‍ය **Original Fast Chargers, High-Capacity PowerBanks, සහ Protective Cases** නිල වගකීමක් සහිතව ලබාගත හැක.';
        fallbackSuggestions = ['🔋 Fast Chargers', '🔋 PowerBanks', '🛡️ Phone Cases', '🚚 Delivery Info'];
      } else if (lower.includes('delivery') || lower.includes('diliwari') || lower.includes('ඩිලිවරි') || lower.includes('ගෙනැවිත්')) {
        fallbackText = '🚚 **iCrowd Island-wide Delivery තොරතුරු (නිල ප්‍රතිපත්තිය):**\n\n' +
          '• **Standard Delivery:** රු. 200/= (දින 2-3 ඇතුළත දිවයින පුරා නිවසටම)\n' +
          '• **Fast / Express Delivery:** රු. 500/= (පැය 24 ඇතුළත කඩිනම් බෙදාහැරීම)\n' +
          '• **Cash on Delivery (COD):** භාණ්ඩය ලැබුණු පසු මුදල් ගෙවීමේ පහසුකම දිවයින පුරා ඇත.';
        fallbackSuggestions = ['🛡️ Warranty තොරතුරු', '💳 Payment ක්‍රම', '🎧 Headsets'];
      } else if (lower.includes('warranty') || lower.includes('waranthi') || lower.includes('වොරන්ටි') || lower.includes('ගැරන්ටි')) {
        fallbackText = '🛡️ **iCrowd Official Warranty & Guarantee සහතිකය:**\n\n' +
          '• සියලුම Electronic භාණ්ඩ සඳහා වසරක (1 Year) නිල දේශීය හා ජාත්‍යන්තර වගකීම හිමිවේ.\n' +
          '• දින 7ක් ඇතුළත කිසියම් නිෂ්පාදන දෝෂයක් හඳුනාගතහොත් Instant Replacement පහසුකම හිමිවේ.\n' +
          '• Warranty Claim කිරීම සඳහා Invoice එක හෝ Order අංකය පමණක් ප්‍රමාණවත්ය.';
        fallbackSuggestions = ['🚚 Delivery Info', '🔋 PowerBanks', '🎧 Headsets'];
      } else if (lower.includes('headset') || lower.includes('headphone') || lower.includes('earbud') || lower.includes('sony') || lower.includes('හෙඩ්සෙට්')) {
        fallbackText = '🎧 **iCrowd Headsets & Premium Audio Devices:**\n\n' +
          '• **Sony WH-1000XM5:** Industry-leading Active Noise Cancelling Wireless Headphones (රු. 125,000/=) ✅ තොග ඇත\n' +
          '• **Apple AirPods Max:** Premium Spatial Audio & Computational Audio (රු. 195,000/=)\n\n' +
          'වසරක නිල වගකීමක් සහිතව original audio accessories අපෙන් ලබාගත හැක.';
        fallbackSuggestions = ['🎧 Sony WH-1000XM5', '🍎 AirPods Max', '🚚 Delivery Info'];
      } else if (lower.includes('powerbank') || lower.includes('charger') || lower.includes('anker') || lower.includes('චාජර්') || lower.includes('පවර්බෑන්ක්')) {
        fallbackText = '🔋 **iCrowd PowerBanks & High-Speed Chargers:**\n\n' +
          '• **Anker Prime 20,000mAh (200W Output):** Dual 100W USB-C Ports, Smart TFT Display (රු. 38,500/=) ✅ තොග ඇත\n' +
          '• **Apple / Anker 20W - 140W Fast GaN Chargers:** iPhone & Android සඳහා 100% ආරක්ෂිත වේගවත් ආරෝපණය.';
        fallbackSuggestions = ['🔋 Anker 20,000mAh PowerBank', '⚡ Fast Chargers', '🚚 Delivery Info'];
      } else {
        fallbackText = 'ආයුබෝවන්! 👋 මම iCrowd Smart Assistant.\n\nඅපගේ Store එකෙහි ඇති **Apple iPhones (16 Pro Max, 15), Samsung Galaxy S24, Sony Headsets, Anker PowerBanks** සහ Delivery/Warranty තොරතුරු ලබාගැනීමට පහත Quick Suggestions වලින් තෝරන්න:';
      }

      const fallbackMsg = {
        id: 'bot_fallback_' + Date.now(),
        sender: 'bot',
        text: fallbackText,
        products: null,
        suggestions: fallbackSuggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
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
