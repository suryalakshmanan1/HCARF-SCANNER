import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, User, Shield, Sparkles, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScanResult, ScanMetadata } from '@/pages/Index';
import { OpenRouterService } from '@/utils/ai/openRouterService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanResults: ScanResult[];
  scanMetadata: ScanMetadata | null;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({
  open,
  onOpenChange,
  scanResults,
  scanMetadata,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m HCARF Security Assistant, your AI-powered cybersecurity expert. I can help you understand your scan results, provide remediation advice, generate additional security payloads, and answer questions about cybersecurity best practices. How can I help you secure your domain today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiService, setAiService] = useState<OpenRouterService | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize AI service with user's API key
  useEffect(() => {
    const initAiService = async () => {
      const apiKeys = JSON.parse(sessionStorage.getItem('apiKeys') || '{}');
      if (apiKeys.aiApiKey) {
        const service = new OpenRouterService(apiKeys.aiApiKey);
        const isValid = await service.validateApiKey();
        if (isValid) {
          setAiService(service);
          setApiKeyError(null);
        } else {
          setApiKeyError('Invalid AI API key. Please check your OpenRouter API key in settings.');
        }
      } else {
        setApiKeyError('AI API key not configured. Please add your OpenRouter API key in settings.');
      }
    };

    if (open) {
      initAiService();
    }
  }, [open]);

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
        typewriterRef.current = setTimeout(typeNextCharacter, 30);
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
            content: 'I apologize, but I\'m having trouble processing your request right now. Please check your API key and try again.'
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
    "What's the most critical issue I should fix first?",
    "How can I prevent these vulnerabilities?",
    "Generate additional security payloads for this domain",
    "What tools do you recommend for monitoring?",
    "Explain the security implications of these findings",
    "How do I rotate exposed credentials safely?",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[700px] flex flex-col bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80 border border-primary/20 shadow-2xl shadow-primary/10">
        <DialogHeader className="border-b border-primary/20 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  HCARF Security Assistant
                </h2>
                <p className="text-xs text-muted-foreground">Powered by AI • Real-time Security Analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {aiService && <Sparkles className="h-4 w-4 text-green-500" />}
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {apiKeyError && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-600">
              {apiKeyError}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 flex flex-col space-y-4">
          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 p-4">
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
                     <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {message.role === 'assistant' && (
                          <div className="h-6 w-6 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Shield className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {message.role === 'user' && (
                          <div className="h-6 w-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-60 flex items-center space-x-2">
                            <span>{message.timestamp.toLocaleTimeString()}</span>
                            {message.role === 'assistant' && <Sparkles className="h-3 w-3" />}
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
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-6 w-6 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                          <Shield className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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
            <div className="space-y-3 p-4 bg-gradient-to-r from-background/50 to-muted/30 rounded-lg border border-primary/10">
              <p className="text-sm font-medium text-foreground flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-cyan-500" />
                <span>Quick Security Questions:</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(question)}
                    className="text-xs h-auto py-2 px-3 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                    disabled={isLoading || isTyping}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex space-x-3 p-4 bg-gradient-to-r from-background/60 to-muted/40 rounded-lg border border-primary/10">
            <Input
              placeholder={aiService ? "Ask me about your security scan results..." : "Configure AI API key to start chatting..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && !isTyping && aiService && handleSendMessage()}
              disabled={isLoading || isTyping || !aiService}
              className="flex-1 bg-background/80 border-primary/20 focus:border-primary/40 focus:ring-primary/20"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || isTyping || !aiService}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-6 transition-all duration-200"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};