import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChatMessage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { generateSessionId } from "@/lib/chatbot";

interface ChatWidgetProps {
  onLeadCapture: () => void;
}

export function ChatWidget({ onLeadCapture }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sessionId] = useState(() => generateSessionId());
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", {
        sessionId,
        message,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(data.messages);
      setIsTyping(false);
      
      // Check if response suggests lead capture
      const lastBotMessage = data.messages[data.messages.length - 1];
      if (!lastBotMessage.isUser && (
        lastBotMessage.content.includes('contact information') ||
        lastBotMessage.content.includes('name and phone') ||
        lastBotMessage.content.includes('connect you')
      )) {
        setTimeout(() => {
          onLeadCapture();
        }, 1000);
      }
    },
    onError: () => {
      setIsTyping(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chat opens
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        content: "Hello! I'm your Railey Realty assistant specializing in Deep Creek Lake and Garrett County properties. I can help you find lakefront homes, ski properties, mountain retreats, and connect you with our local experts. What type of property interests you?",
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
    
    // Focus the input when chat opens
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = () => {
    const message = inputValue.trim();
    if (!message || sendMessageMutation.isPending) return;

    setInputValue("");
    setIsTyping(true);
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    const actionMessages = {
      'search-properties': 'I want to search for properties',
      'schedule-showing': "I'd like to schedule a property showing",
      'contact-agent': 'I want to contact an agent',
      'mortgage-info': 'Can you provide mortgage information?'
    };
    
    const message = actionMessages[action as keyof typeof actionMessages];
    if (message) {
      setInputValue(message);
      setTimeout(() => handleSendMessage(), 100);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-real-estate-blue hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-105"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
        </button>
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-semibold">1</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-96 bg-white rounded-xl shadow-2xl z-50 transform transition-all duration-300">
      {/* Chat Header */}
      <div className="bg-real-estate-blue text-white p-4 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Railey Realty Assistant</h3>
            <p className="text-xs opacity-75">Online now</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      {/* Chat Messages Area */}
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`flex items-start space-x-3 ${message.isUser ? 'justify-end' : ''}`}
          >
            {!message.isUser && (
              <div className="w-8 h-8 bg-real-estate-blue rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            )}
            <div className={`${message.isUser ? 'bg-real-estate-blue text-white' : 'bg-gray-100 text-real-estate-dark'} rounded-xl p-3 max-w-xs`}>
              <p className="text-sm">{message.content}</p>
            </div>
            {message.isUser && (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-real-estate-blue rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="bg-gray-100 rounded-xl p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-2">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => handleQuickAction('search-properties')}
            className="text-xs bg-gray-100 text-real-estate-gray px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            🏠 Search Properties
          </button>
          <button 
            onClick={() => handleQuickAction('schedule-showing')}
            className="text-xs bg-gray-100 text-real-estate-gray px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            📅 Schedule Showing
          </button>
          <button 
            onClick={() => handleQuickAction('contact-agent')}
            className="text-xs bg-gray-100 text-real-estate-gray px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            👤 Contact Agent
          </button>
          <button 
            onClick={() => handleQuickAction('mortgage-info')}
            className="text-xs bg-gray-100 text-real-estate-gray px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            💰 Mortgage Info
          </button>
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-gray-50">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center space-x-2">
          <input 
            ref={inputRef}
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about lakefront homes, ski properties..." 
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-real-estate-blue focus:border-transparent text-sm bg-white"
            disabled={sendMessageMutation.isPending}
            autoComplete="off"
            tabIndex={0}
          />
          <button 
            type="submit"
            disabled={sendMessageMutation.isPending || !inputValue.trim()}
            className="bg-real-estate-blue text-white rounded-full p-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {sendMessageMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
