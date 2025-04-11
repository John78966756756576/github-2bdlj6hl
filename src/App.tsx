import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface Message {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface MistralResponse {
  response?: {
    content?: string;
    error?: string;
  };
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      content: 'Hi! I\'m MetaJungkok, powered by Jhunpaul. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [messages]);

  const pollForResponse = async (messageId: string, retries = 0) => {
    if (retries > 30) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "I apologize, but I didn't receive a response in time. Please try again.",
        timestamp: new Date()
      }]);
      setIsTyping(false);
      return;
    }

    try {
      const response = await fetch(`https://hook.eu2.make.com/plpujxjbd2przne1po7kolyibx6vqh3g/status/${messageId}`);
      
      if (response.status === 202) {
        pollTimeoutRef.current = setTimeout(() => pollForResponse(messageId, retries + 1), 1000);
        return;
      }

      const contentType = response.headers.get('Content-Type') || '';
      let responseData;

      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const textResponse = await response.text();
        responseData = { response: { content: textResponse } };
      }
      
      setMessages(prev => [...prev, {
        type: 'bot',
        content: responseData.response?.content || "I apologize, but I couldn't understand your request.",
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error polling for response:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "I apologize, but I encountered an error while processing your request.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      type: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('https://hook.eu2.make.com/plpujxjbd2przne1po7kolyibx6vqh3g', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          timestamp: new Date().toISOString(),
          conversation_history: messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        }),
      });

      if (response.ok) {
        const contentType = response.headers.get('Content-Type') || '';
        let data;

        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const textResponse = await response.text();
          data = { messageId: `fallback-${Date.now()}` };
          
          setMessages(prev => [...prev, {
            type: 'bot',
            content: textResponse,
            timestamp: new Date()
          }]);
          setIsTyping(false);
          return;
        }

        if (data.messageId) {
          pollForResponse(data.messageId);
        } else {
          throw new Error('No messageId received in the response');
        }
      } else {
        let errorMessage = `Server error (Status ${response.status}): `;
        
        switch (response.status) {
          case 400:
            errorMessage += 'Invalid request format';
            break;
          case 401:
            errorMessage += 'Unauthorized access';
            break;
          case 403:
            errorMessage += 'Access forbidden';
            break;
          case 429:
            errorMessage += 'Too many requests, please try again later';
            break;
          case 500:
            errorMessage += 'Internal server error';
            break;
          default:
            errorMessage += 'Unexpected error occurred';
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error connecting to Make.com:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: error instanceof Error ? error.message : "An unexpected error occurred. Please try again later.",
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-3xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} px-4 py-3 flex justify-between items-center shadow-sm`}>
          <div className="flex items-center gap-3">
            <img 
              src="https://prgpijirkcfzzupyswsj.supabase.co/storage/v1/object/sign/files/468299231_861026152904225_5304760152410024946_n.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJmaWxlcy80NjgyOTkyMzFfODYxMDI2MTUyOTA0MjI1XzUzMDQ3NjAxNTI0MTAwMjQ5NDZfbi5qcGciLCJpYXQiOjE3NDQzNjU1ODksImV4cCI6MTkxOTc1NzU4OX0.gGVvYNjD4p7gK5zjU5AbtxHtd9gp0hiD5EQFOaQkQt8"
              alt="MetaJungkok Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h1 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>MetaJungkok</h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Active Now</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } transition-all duration-200`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Chat Container */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-end gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'bot' && (
                <img 
                  src="https://prgpijirkcfzzupyswsj.supabase.co/storage/v1/object/sign/files/468299231_861026152904225_5304760152410024946_n.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJmaWxlcy80NjgyOTkyMzFfODYxMDI2MTUyOTA0MjI1XzUzMDQ3NjAxNTI0MTAwMjQ5NDZfbi5qcGciLCJpYXQiOjE3NDQzNjU1ODksImV4cCI6MTkxOTc1NzU4OX0.gGVvYNjD4p7gK5zjU5AbtxHtd9gp0hiD5EQFOaQkQt8"
                  alt="MetaJungkok"
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div className="flex flex-col gap-1">
                <div
                  className={`max-w-[280px] md:max-w-[420px] px-4 py-2 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-white text-gray-900 ml-12'
                      : theme === 'dark'
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-900'
                  } shadow-sm`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                <span className={`text-[10px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'} ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2">
              <img 
                src="https://prgpijirkcfzzupyswsj.supabase.co/storage/v1/object/sign/files/468299231_861026152904225_5304760152410024946_n.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJmaWxlcy80NjgyOTkyMzFfODYxMDI2MTUyOTA0MjI1XzUzMDQ3NjAxNTI0MTAwMjQ5NDZfbi5qcGciLCJpYXQiOjE3NDQzNjU1ODksImV4cCI6MTkxOTc1NzU4OX0.gGVvYNjD4p7gK5zjU5AbtxHtd9gp0hiD5EQFOaQkQt8"
                alt="MetaJungkok"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className={`px-4 py-2 rounded-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className="flex gap-1">
                  <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'} animate-bounce`} />
                  <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'} animate-bounce [animation-delay:0.2s]`} />
                  <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-gray-500' : 'bg-gray-400'} animate-bounce [animation-delay:0.4s]`} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-4 shadow-lg`}>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className={`flex-1 px-4 py-2 rounded-full text-sm ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-gray-600'
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-gray-200'
              } focus:outline-none focus:ring-2`}
            />
            <button
              type="submit"
              className={`p-2 rounded-full ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              } transition-colors duration-200`}
              disabled={!input.trim()}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;