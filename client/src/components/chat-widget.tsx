import { useState, useRef, useEffect, act } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChatMessage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { generateSessionId } from "@/lib/chatbot";

interface ChatWidgetProps {
  onLeadCapture: () => void;
}

export function ChatWidget({ onLeadCapture }: ChatWidgetProps) {
  // Always open and fullscreen
  const [isOpen] = useState(true);
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
    onError: (error: any) => {
      setIsTyping(false);

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        content: error?.message?.includes('quota')
          ? "I'm currently experiencing API limits. Please check back later or contact Railey Realty directly for assistance."
          : "Sorry, I'm having trouble responding right now. Please try again or contact our team directly.",
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
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

 const formatMessage = (content: string) => {
  // First split content into paragraphs
  const paragraphs = content.split('\n\n');
  
  return paragraphs.map(paragraph => {
    // Check if this paragraph contains list items
    if (paragraph.includes('\n-')) {
      const items = paragraph.split('\n');
      return items.map(item => {
        // Process bold text
        const boldProcessed = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Check if it's a list item
        if (item.trim().startsWith('-')) {
          return `<li class="mb-1 ml-4">${boldProcessed.replace(/^-\s*/, '')}</li>`;
        }
        
        // Regular paragraph
        return `<p class="mb-2">${boldProcessed}</p>`;
      }).join('');
    }
    
    // Regular paragraph with bold processing
    return `<p class="mb-2">${paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
  }).join('');
};

  const handleQuickAction = (action: string) => {
    if (action === 'contact') {
      const url = 'https://www.railey.com/contact-us/';
      const newWin = window.open(url, '_blank');
      if (newWin) newWin.opener = null; // security
      return;
    }

    if (action === 'find-agent') {
      const url = 'https://www.railey.com/realestate/agents/group/agents/';
      const newWin = window.open(url, '_blank');
      if (newWin) newWin.opener = null; // security
      return;
    }

    if (action === 'mortgage-info') {
      const url = 'https://www.railey.com/financing-a-deep-creek-vacation-home/';
      const newWin = window.open(url, '_blank');
      if (newWin) newWin.opener = null; // security
      return;
    }

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

  // Fullscreen widget (replaces the minimized/button UI)
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col min-h-[100dvh] max-h-[100dvh] overflow-hidden">
      {/* Chat Header */}
      <div className="bg-real-estate-blue text-white p-4 flex items-center justify-between safe-top">
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
        {/* Intentionally no close button — stays fullscreen */}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
            <div className={`${
              message.isUser ? 'bg-real-estate-blue text-white' : 'bg-gray-100 text-real-estate-dark'
            } rounded-xl p-3 max-w-[70%]`}>
              <div 
                className="text-sm"
                dangerouslySetInnerHTML={{ 
                  __html: formatMessage(message.content)
                }}
              />
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
      <div className="px-6 pb-4">
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
            onClick={() => handleQuickAction('find-agent')}
            className="text-xs bg-gray-100 text-real-estate-gray px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            🔎 Find Agent
          </button>
          <button
            onClick={() => handleQuickAction('contact')}
            className="text-xs bg-gray-100 text-real-estate-gray px-3 py-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            👤 Contact
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
      <div className="p-6 border-t bg-gray-50">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about lakefront homes, ski properties..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-real-estate-blue focus:border-transparent text-sm bg-white"
            disabled={sendMessageMutation.isPending}
            autoComplete="off"
            tabIndex={0}
            onKeyPress={handleKeyPress}
          />
          <button
            type="submit"
            disabled={sendMessageMutation.isPending || !inputValue.trim()}
            className="bg-real-estate-blue text-white rounded-full p-3 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
