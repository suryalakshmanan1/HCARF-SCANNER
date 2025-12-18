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
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiService, setAiService] = useState<OpenRouterService | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize AI service with user's API key - CHECK EVERY TIME
  useEffect(() => {
    // Initialize welcome message based on scan results
    if (!hasInitialized && (scanResults.length > 0 || scanMetadata)) {
      const domain = scanMetadata?.domain || 'your domain';
      const findingsCount = scanResults.length;
      
      const welcomeMsg = {
        id: '1',
        role: 'assistant' as const,
        content: `🛡️ Welcome to HACRF Security Assistant!\n\nI've analyzed **${domain}** and found **${findingsCount} security finding${findingsCount !== 1 ? 's' : ''}**.\n\nI'm here to help you:\n• Understand each finding\n• Get step-by-step remediation advice\n• Answer security questions\n• Provide best practices\n\nWhat would you like to know?`,
        timestamp: new Date(),
      };
      
      setMessages([welcomeMsg]);
      setHasInitialized(true);
    }
  }, [scanMetadata?.domain, scanResults.length, hasInitialized]);

  // Initialize AI service with user's API key - CHECK EVERY TIME
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
            console.log('[Chat] AI API key validated successfully');
          } else {
            setApiKeyError('Invalid AI API key. Please check your OpenRouter API key in settings.');
            setIsApiKeyValid(false);
            console.error('[Chat] AI API key validation failed');
          }
        } catch (error) {
          setApiKeyError('Failed to validate AI API key. Please check your configuration.');
          setIsApiKeyValid(false);
          console.error('[Chat] API key check error:', error);
        }
      } else {
        setApiKeyError('AI API key not configured. Please add your OpenRouter API key in API Configuration.');
        setIsApiKeyValid(false);
      }
    };

    // Check immediately when component loads or updates
    initAiService();
    
    // Also check periodically in case user adds key while chat is open
    const interval = setInterval(initAiService, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Listen for "Ask AI" events from findings
  useEffect(() => {
    const handleAskAiEvent = async () => {
      const pendingQuestion = sessionStorage.getItem('pendingAiQuestion');
      if (pendingQuestion && aiService) {
        setIsOpen(true); // Open the sidebar
        
        // Add user message
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: pendingQuestion,
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
            pendingQuestion,
            scanResults,
            scanMetadata,
            [userMessage].map(m => ({ role: m.role, content: m.content }))
          );

          // Use typewriter effect for response
          let currentText = '';
          let currentIndex = 0;
          setIsTyping(true);

          const typeNextCharacter = () => {
            if (currentIndex < response.length) {
              currentText += response[currentIndex];
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
              setIsLoading(false);
            }
          };

          typeNextCharacter();
        } catch (error) {
          console.error('AI response error:', error);
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[newMessages.length - 1]?.role === 'assistant') {
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                content: '⚠️ Unable to generate response. Please check your API key configuration and try again.'
              };
            }
            return newMessages;
          });
          setIsLoading(false);
        }
        
        // Clear the pending question
        sessionStorage.removeItem('pendingAiQuestion');
      }
    };

    window.addEventListener('askAiAboutFinding', handleAskAiEvent);
    return () => window.removeEventListener('askAiAboutFinding', handleAskAiEvent);
  }, [aiService, scanResults, scanMetadata]);

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
        <div className="flex flex-col h-full overflow-hidden">
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
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 w-full pr-4">
              <div className="space-y-4 p-4 pr-0">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                  >
                    <Card className={`max-w-[85%] transition-all duration-300 ${
                      message.role === 'user' 
                        ? 'bg-slate-700 border-slate-600/50 text-foreground' 
                        : 'bg-slate-800 border-slate-600/50'
                    }`}>
                      <CardContent className="p-3">
                        <div className="flex items-start space-x-2">
                          {message.role === 'assistant' && (
                            <div className="h-5 w-5 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Shield className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                          {message.role === 'user' && (
                            <div className="h-5 w-5 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <User className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                          <div className="flex-1 space-y-1">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            <p className="text-xs opacity-50">
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
                    <Card className="bg-slate-800 border-slate-600/50">
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <div className="h-5 w-5 bg-slate-600 rounded-full flex items-center justify-center animate-pulse">
                            <Shield className="h-2.5 w-2.5 text-white" />
                          </div>
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                          <span className="text-xs text-slate-400">Analyzing...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-border/30 bg-background/50 space-y-2">
              {apiKeyError && !isApiKeyValid && (
                <Alert className="py-2 border-amber-500/50 bg-amber-500/10 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-600 ml-2">
                    {apiKeyError}
                  </AlertDescription>
                </Alert>
              )}
              {isApiKeyValid && (
                <div className="py-1.5 px-2 bg-green-500/10 border border-green-500/30 rounded-md flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600">AI API key configured ✓</span>
                </div>
              )}
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder={isApiKeyValid ? "Ask anything about this finding or your project..." : "Configure AI API key to start..."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && !isTyping && isApiKeyValid && handleSendMessage()}
                    disabled={isLoading || isTyping || !isApiKeyValid}
                    className="h-9 text-sm bg-slate-700/50 border border-slate-600/50 focus:border-slate-500 focus:ring-slate-500/20 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading || isTyping || !isApiKeyValid}
                  size="sm"
                  className="h-9 px-3 bg-slate-700 hover:bg-slate-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50"
                >
                  <Send className="h-4 w-4" />
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