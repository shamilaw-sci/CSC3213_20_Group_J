import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import AIChatbot from '../../features/assistant/AIChatbot.jsx';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-main antialiased selection:bg-primary/30 selection:text-white">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <AIChatbot />
    </div>
  );
};

export default MainLayout;
