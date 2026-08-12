import React from 'react';
import Navbar from './TopNavigation';
import AIChatbot from '../../features/assistant/AIChatbot.jsx';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <AIChatbot />
    </div>
  );
};

export default MainLayout;
