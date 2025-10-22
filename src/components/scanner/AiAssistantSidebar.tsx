import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, User, Shield, Sparkles, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScanResult, ScanMetadata } from '@/pages/Index';
import { OpenRouterService } from '@/utils/ai/openRouterService';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiAssistantSidebarProps {
  scanResults: ScanResult[];
  scanMetadata: ScanMetadata | null;
  className?: string;
}

export const AiAssistantSidebar: React.FC<AiAssistantSidebarProps> = ({
  scanResults,
  scanMetadata,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '🛡️ Welcome to HACRF Security Assistant! I\'m your AI-powered cybersecurity expert ready to help you analyze scan results, provide remediation advice, and answer security questions. How can I help secure your domain today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiService, setAiService] = useState<OpenRouterService | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize AI service with user's API key
  useEffect(() => {
    const initAiService = async () => {
      const apiKeys = JSON.parse(sessionStorage.getItem('apiKeys') || '{}');
      if (apiKeys.aiApiKey) {
        try {
          const service = new OpenRouterService(apiKeys.aiApiKey);
          const isValid = await service.validateApiKey();
          if (isValid) {
            setAiService(service);
            setApiKeyError(null);
            setIsApiKeyValid(true);
          } else {
            setApiKeyError('Invalid AI API key. Please check your OpenRouter API key in settings.');
            setIsApiKeyValid(false);
          }
        } catch (error) {
          setApiKeyError('Failed to validate AI API key. Please check your configuration.');
          setIsApiKeyValid(false);
        }
      } else {
        setApiKeyError('AI API key not configured. Please add your OpenRouter API key in API Configuration.');
        setIsApiKeyValid(false);
      }
    };

    initAiService();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const typewriterEffect = (text: string, callback: () => void) => {
    setIsTyping(true);
    let currentText = '';
    let currentIndex = 0;

    const typeNextCharacter = () => {
      if (currentIndex < text.length) {
        currentText += text[currentIndex];
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1]?.role === 'assistant') {
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content: currentText
            };
          }
          return newMessages;
        });
        currentIndex++;
        typewriterRef.current = setTimeout(typeNextCharacter, 20);
      } else {
        setIsTyping(false);
        callback();
      }
    };

    typeNextCharacter();
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !aiService) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Add empty assistant message for typewriter effect
      const assistantMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      const response = await aiService.generateConversationalResponse(
        userMessage.content,
        scanResults,
        scanMetadata,
        messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
      );

      typewriterEffect(response, () => {
        // Typing effect complete
      });

    } catch (error) {
      console.error('AI Assistant error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === 'assistant') {
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: 'I apologize, but I\'m having trouble processing your request right now. Please check your API key configuration and try again.'
          };
        }
        return newMessages;
      });
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "What's the most critical issue?",
    "How can I prevent these vulnerabilities?",
    "Generate additional security payloads",
    "What monitoring tools do you recommend?",
    "Explain the security implications",
    "How to rotate exposed credentials?",
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={toggleSidebar}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-l-xl rounded-r-none bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-2xl shadow-purple-500/30 transition-all duration-300 hover:scale-105",
          isOpen ? "right-96" : "right-0"
        )}
      >
        <div className="relative">
          {isOpen ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
          {scanResults.length > 0 && !isOpen && (
            <div className="absolute -top-1 -left-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-96 bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-md border-l border-primary/20 shadow-2xl shadow-primary/10 transform transition-transform duration-300 z-40",
          isOpen ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-primary/20 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  {isApiKeyValid && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    HACRF Security Assistant
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isApiKeyValid ? 'AI-Powered • Ready to Help' : 'Configure API Key to Start'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isApiKeyValid && <Sparkles className="h-4 w-4 text-green-500" />}
              </div>
            </div>
            
            {scanResults.length > 0 && (
              <div className="text-xs text-muted-foreground bg-background/50 rounded-lg p-2">
                📊 {scanResults.length} findings from {scanMetadata?.domain || 'scan'} • Ready for analysis
              </div>
            )}
          </div>

          {apiKeyError && (
            <div className="p-4">
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-yellow-600 text-sm">
                  {apiKeyError}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                  >
                    <Card className={`max-w-[85%] backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-cyan-500/30 text-foreground shadow-lg shadow-cyan-500/10' 
                        : 'bg-gradient-to-r from-background/80 to-muted/60 border-purple-500/20 shadow-lg shadow-purple-500/5'
                    }`}>
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-2">
                          {message.role === 'assistant' && (
                            <div className="h-5 w-5 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Shield className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                          {message.role === 'user' && (
                            <div className="h-5 w-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <User className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                          <div className="flex-1 space-y-1">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs opacity-60">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
                {(isLoading || isTyping) && (
                  <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                    <Card className="bg-gradient-to-r from-background/80 to-muted/60 border-purple-500/20 shadow-lg shadow-purple-500/5">
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <div className="h-5 w-5 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                            <Shield className="h-2.5 w-2.5 text-white" />
                          </div>
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-1.5 h-1.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                          <span className="text-xs text-muted-foreground">Analyzing...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Questions */}
            {scanResults.length > 0 && (
              <div className="p-3 border-t border-primary/10 bg-gradient-to-r from-background/50 to-muted/30">
                <p className="text-xs font-medium text-foreground flex items-center space-x-2 mb-2">
                  <Sparkles className="h-3 w-3 text-cyan-500" />
                  <span>Quick Questions:</span>
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {quickQuestions.slice(0, 3).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(question)}
                      className="text-xs h-auto py-1.5 px-2 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 justify-start"
                      disabled={isLoading || isTyping || !isApiKeyValid}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-primary/10 bg-gradient-to-r from-background/60 to-muted/40">
              <div className="flex space-x-2">
                <Input
                  placeholder={isApiKeyValid ? "Ask about your security findings..." : "Configure AI API key to start..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && !isTyping && isApiKeyValid && handleSendMessage()}
                  disabled={isLoading || isTyping || !isApiKeyValid}
                  className="flex-1 h-8 text-sm bg-background/80 border-primary/20 focus:border-primary/40 focus:ring-primary/20"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading || isTyping || !isApiKeyValid}
                  size="sm"
                  className="h-8 w-8 p-0 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white transition-all duration-200"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};