import React from 'react';
import ChatLauncher from './component/ChatLauncher';
import ChatWindow from './component/ChatWindow';
import { useAIChatbot } from './hooks/useAIChatbot';

const AIChatbot = () => {
  const {
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
  } = useAIChatbot();

  return (
    <>
      <ChatLauncher isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
      <ChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        loading={loading}
        onSend={sendMessage}
        onClear={clearChat}
        messagesEndRef={messagesEndRef}
        geminiApiKey={geminiApiKey}
        onSaveGeminiKey={saveGeminiKey}
        isGeminiActive={isGeminiActive}
        onToggleGemini={toggleGemini}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />
    </>
  );
};

export default AIChatbot;
