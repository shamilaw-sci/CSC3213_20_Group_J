import React, { useState, useRef, useEffect } from 'react';

const DUMMY_PHONES = [
  { id: 1, name: 'iPhone 15 Pro', price: '350,000', brand: 'Apple', imageUrl: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-bluetitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692846360609' },
  { id: 2, name: 'Samsung Galaxy S24 Ultra', price: '380,000', brand: 'Samsung', imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/lk/2401/gallery/lk-galaxy-s24-s928-sm-s928bztqslk-thumb-539573347' },
  { id: 3, name: 'Xiaomi Redmi Note 13 Pro', price: '120,000', brand: 'Xiaomi', imageUrl: 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1703666068.79093375!500x500.png' }
];

const DUMMY_ACCESSORIES = [
  { id: 101, name: 'Premium Silicone Cover', price: '2,500' },
  { id: 102, name: 'Fast Charging Adapter (20W)', price: '4,000' },
  { id: 103, name: 'Tempered Glass Screen Protector', price: '1,500' }
];

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'ආයුබෝවන්! මම ඔබගේ AI සහායකයා. අද ඔබ සොයන්නේ කුමන මිල පරාසයක (Price range) දුරකථනයක්ද?' }
  ]);
  const [input, setInput] = useState('');
  const [chatState, setChatState] = useState(0); // 0: ask price, 1: ask brand/usage, 2: wait for selection
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const processMessage = (userText) => {
    const msgLower = userText.toLowerCase();
    let replyText = '';
    let products = null;
    let nextState = chatState;

    // "Thinking" for general questions
    if (msgLower.includes('battery') || msgLower.includes('බැටරි')) {
      return { reply: 'Samsung Galaxy S24 Ultra එකේ බැටරිය (5000mAh) ඉතාමත් හොඳයි. එය දවසකටත් වඩා පාවිච්චි කරන්න පුළුවන්!', products: [DUMMY_PHONES[1]] };
    }
    if (msgLower.includes('camera') || msgLower.includes('කැමරාව')) {
      return { reply: 'ඔබ ඡායාරූප ගැනීමට ප්‍රිය කරනවා නම්, iPhone 15 Pro සහ S24 Ultra යන දෙකම විශිෂ්ටයි. iPhone එක වීඩියෝ වලට වඩාත් සුදුසුයි.', products: [DUMMY_PHONES[0], DUMMY_PHONES[1]] };
    }
    if (msgLower.includes('gaming') || msgLower.includes('ගේම්')) {
      return { reply: 'Gaming සඳහා නම් ඉහළ Processor එකක් අවශ්‍යයි. ඒ සඳහා S24 Ultra (Snapdragon 8 Gen 3) සහ iPhone 15 Pro ඉතාම සුදුසුයි.', products: [DUMMY_PHONES[0], DUMMY_PHONES[1]] };
    }
    if (msgLower.includes('hi') || msgLower.includes('hello') || msgLower.includes('හලෝ')) {
      return { reply: 'ආයුබෝවන්! මම iCrowd AI සහායකයා. මම ඔබට අද දුරකථනයක් තෝරාගන්න උදව් කරන්නද? මුලින්ම කියන්න ඔබ කොපමණ මුදලක් වියදම් කරන්නද බලාපොරොත්තු වෙන්නේ?', products: null };
    }

    if (chatState === 0) {
      replyText = 'නියමයි. ඔබ දුරකථනය වැඩිපුර භාවිතා කරන්නේ කුමක් සඳහාද? (උදා: Gaming, කැමරාව) සහ ඔබ කැමති විශේෂ Brand එකක් (උදා: Apple, Samsung) තිබේද?';
      nextState = 1;
    } else if (chatState === 1) {
      replyText = 'මෙන්න ඔබට ගැළපෙන හොඳම දුරකථන කිහිපයක්. ඔබ මින් කුමන දුරකථනයටද වඩාත් කැමති? (නම සඳහන් කරන්න)';
      
      let filteredPhones = DUMMY_PHONES;
      if (msgLower.includes('apple') || msgLower.includes('iphone')) {
        filteredPhones = DUMMY_PHONES.filter(p => p.brand === 'Apple');
      } else if (msgLower.includes('samsung')) {
        filteredPhones = DUMMY_PHONES.filter(p => p.brand === 'Samsung');
      } else if (msgLower.includes('xiaomi') || msgLower.includes('redmi')) {
        filteredPhones = DUMMY_PHONES.filter(p => p.brand === 'Xiaomi');
      }
      
      products = filteredPhones;
      nextState = 2;
    } else if (chatState === 2) {
      replyText = 'සුබපැතුම්! ඉතා හොඳ තේරීමක්. මෙම දුරකථනය සඳහා අප සතුව ඇති Covers සහ අනෙකුත් උපාංග කිහිපයක් පහතින් පෙන්වා ඇත. ඔබට අවශ්‍ය නම් ඒවාද Cart එකට එකතු කරගත හැක.';
      products = DUMMY_ACCESSORIES;
      nextState = 0; 
    }

    setChatState(nextState);
    return { reply: replyText, products: products };
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userText = input;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');

    setMessages(prev => [...prev, { sender: 'bot', text: '...', isTyping: true }]);

    setTimeout(() => {
      const response = processMessage(userText);
      setMessages(prev => {
        const newMsgs = prev.filter(m => !m.isTyping);
        return [...newMsgs, { sender: 'bot', text: response.reply, products: response.products }];
      });
    }, 1000); // 1 second thinking time
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: '500px' }}>
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
                  } ${msg.isTyping ? 'animate-pulse' : ''}`}
                >
                  {msg.text}
                </div>
                
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2 w-full max-w-[85%]">
                    {msg.products.map(product => (
                      <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-2 flex gap-3 items-center shadow-sm hover:shadow-md cursor-pointer transition-shadow">
                        <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                           {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" /> : <span className="text-xs text-gray-400">Item</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs font-bold text-blue-600">Rs {product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full px-4 py-2 text-gray-900 placeholder-gray-500 text-sm transition-all outline-none"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatbot;
