import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, User, Shield, Sparkles, AlertTriangle, Minimize2, Maximize2, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScanResult, ScanMetadata } from '@/pages/Index';

import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  scanResults: ScanResult[];
  scanMetadata: ScanMetadata | null;
}

export const AiChatSidebar: React.FC<AiChatSidebarProps> = ({
  isOpen,
  onToggle,
  scanResults,
  scanMetadata,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Welcome to HCARF Security Assistant!\n\nI\'m your AI-powered security consultant, here to guide you through:\n\n🔍 **Scan Analysis** - Understanding your security findings\n🛡️ **Best Practices** - Learning industry-standard security measures\n💡 **Remediation** - Step-by-step fixes for vulnerabilities\n📊 **Reports** - Interpreting and exporting security assessments\n🎓 **Education** - Cybersecurity concepts explained simply\n🔧 **Tools & Tips** - Recommendations for your security toolkit\n\nI can help whether you\'re:\n• Analyzing scan results from HCARF Scanner\n• Learning about web security fundamentals\n• Getting advice on specific vulnerabilities\n• Exploring security best practices\n\nFeel free to ask me anything about security! I\'m here to help you build a stronger security posture. 💪',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [aiService, setAiService] = useState<any>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  // Check API key availability (live while open)
  useEffect(() => {
    const checkApiKey = () => {
      const apiKeys = JSON.parse(sessionStorage.getItem('apiKeys') || '{}');
      if (apiKeys.aiApiKey) {
        setApiKeyError(null);
        setAiService({ configured: true });
      } else {
        setApiKeyError('AI API key not configured. Please add your OpenRouter API key in settings.');
        setAiService(null);
      }
    };

    checkApiKey();

    if (!isOpen) return;
    const interval = setInterval(checkApiKey, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Listen for "Ask AI" events from findings
  useEffect(() => {
    const handleAskAboutFinding = () => {
      const pendingQuestion = sessionStorage.getItem('pendingAiQuestion');
      if (pendingQuestion) {
        setInput(pendingQuestion);
        sessionStorage.removeItem('pendingAiQuestion');
        // Auto-scroll to input
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };

    window.addEventListener('askAiAboutFinding', handleAskAboutFinding);
    return () => window.removeEventListener('askAiAboutFinding', handleAskAboutFinding);
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
        typewriterRef.current = setTimeout(typeNextCharacter, 30);
      } else {
        setIsTyping(false);
        callback();
      }
    };

    typeNextCharacter();
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const apiKeys = JSON.parse(sessionStorage.getItem('apiKeys') || '{}');
    if (!apiKeys.aiApiKey) {
      setApiKeyError('AI API key not configured. Please add your OpenRouter API key in settings.');
      return;
    }

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

      // Build context-aware message with scan results if available
      let contextualMessage = userMessage.content;
      
      if (scanResults.length > 0 && scanMetadata) {
        const scanContext = `\n\n[Current Scan Context]
Domain: ${scanMetadata.domain}
Total Findings: ${scanResults.length}
Critical: ${scanResults.filter(r => r.severity === 'Critical').length}
High: ${scanResults.filter(r => r.severity === 'High').length}
Medium: ${scanResults.filter(r => r.severity === 'Medium').length}
Low: ${scanResults.filter(r => r.severity === 'Low').length}

Recent findings include:
${scanResults.slice(0, 3).map(r => `- ${r.severity}: ${r.snippet.substring(0, 100)}...`).join('\n')}`;
        
        contextualMessage += scanContext;
      }

      // Use our new API chat function
      const { handleAiChat } = await import('@/api/ai-chat');
      const response = await handleAiChat({
        message: contextualMessage,
        conversationHistory: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        apiKey: apiKeys.aiApiKey
      });

      if (response.success && response.reply) {
        typewriterEffect(response.reply, () => {
          // Typing effect complete
        });
      } else {
        throw new Error(response.error || 'Failed to get AI response');
      }

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

  // General security questions (always visible)
  const generalQuestions = [
    "What are the most common web security vulnerabilities?",
    "How can I protect my website from hackers?",
    "Explain OWASP Top 10 security risks",
    "What security tools should I use for my project?",
    "How do I implement secure authentication?",
    "What's the difference between encryption and hashing?",
  ];

  // Scan-specific questions (only when scan results exist)
  const scanQuestions = [
    "What's the most critical issue I should fix first?",
    "Generate remediation steps for the high-priority findings",
    "Simulate how an attacker could exploit these vulnerabilities",
    "Check compliance with OWASP/NIST/ISO standards",
    "Explain the business impact of these security issues",
  ];

  const advancedOptions = [
    { label: "🔧 Generate Fix", prompt: "Provide detailed step-by-step remediation instructions for each security finding, including code examples where applicable." },
    { label: "⚔️ Simulate Attacker", prompt: "From an attacker's perspective, explain how each vulnerability could be exploited and what the potential attack scenarios are." },
    { label: "📋 Compliance Check", prompt: "Map these security findings to OWASP Top 10, NIST Cybersecurity Framework, and ISO 27001 standards. Identify any compliance violations." },
  ];

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed right-0 top-0 h-full bg-gradient-to-b from-background via-background/95 to-background/90 backdrop-blur-sm border-l border-primary/20 shadow-2xl shadow-primary/10 transition-all duration-500 ease-out animate-in slide-in-from-right z-[9999]",
      isMinimized ? "w-16" : "w-96"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary/20">
        {!isMinimized ? (
          <>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full" />
              </div>
              <div>
                <h2 className="text-sm font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  HCARF AI Assistant
                </h2>
                <p className="text-xs text-muted-foreground">Your Security Consultant</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {(() => {
                const apiKeys = JSON.parse(sessionStorage.getItem('apiKeys') || '{}');
                return apiKeys.aiApiKey && <Sparkles className="h-4 w-4 text-green-500" />;
              })()}
              <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-2 w-full">
            <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(false)}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {!isMinimized && (
        <>
          {apiKeyError && (
            <div className="p-4">
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-yellow-600 text-xs">
                  {apiKeyError}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 h-[calc(100vh-200px)] px-4">
            <div className="space-y-4 py-4">
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
                            <Shield className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {message.role === 'user' && (
                          <div className="h-5 w-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-60 flex items-center space-x-1">
                            <span>{message.timestamp.toLocaleTimeString()}</span>
                            {message.role === 'assistant' && <Sparkles className="h-2 w-2" />}
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
                          <Shield className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-bounce" />
                          <div className="w-1 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-1 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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

          {/* Quick Questions & Advanced Options */}
          <div className="p-4 space-y-4 bg-gradient-to-r from-background/50 to-muted/30 border-t border-primary/10">
            {/* Show scan-specific options if scan results exist */}
            {scanResults.length > 0 && (
              <>
                {/* Advanced AI Options */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground flex items-center space-x-1">
                    <Shield className="h-3 w-3 text-purple-500" />
                    <span>Scan Analysis:</span>
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {advancedOptions.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setInput(option.prompt)}
                        className="text-xs h-auto py-2 px-2 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all duration-200 justify-start bg-gradient-to-r from-purple-500/5 to-cyan-500/5"
                        disabled={isLoading || isTyping}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Scan-specific Quick Questions */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground flex items-center space-x-1">
                    <Sparkles className="h-3 w-3 text-cyan-500" />
                    <span>About Your Scan:</span>
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    {scanQuestions.slice(0, 3).map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setInput(question)}
                        className="text-xs h-auto py-1 px-2 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 justify-start"
                        disabled={isLoading || isTyping}
                      >
                        {question.length > 35 ? question.substring(0, 35) + '...' : question}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* General Security Questions - Always visible */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground flex items-center space-x-1">
                <Brain className="h-3 w-3 text-green-500" />
                <span>Security Education:</span>
              </p>
              <div className="grid grid-cols-1 gap-1">
                {generalQuestions.slice(0, 3).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(question)}
                    className="text-xs h-auto py-1 px-2 hover:bg-green-500/10 hover:border-green-500/30 transition-all duration-200 justify-start"
                    disabled={isLoading || isTyping}
                  >
                    {question.length > 35 ? question.substring(0, 35) + '...' : question}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 bg-gradient-to-r from-background/60 to-muted/40 border-t border-primary/10">
            <div className="flex space-x-2">
              <Input
                placeholder={(() => {
                  const apiKeys = JSON.parse(sessionStorage.getItem('apiKeys') || '{}');
                  return apiKeys.aiApiKey ? "Ask about security..." : "Configure AI API key...";
                })()}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && !isTyping && handleSendMessage()}
                disabled={isLoading || isTyping || !aiService}
                className="flex-1 bg-background/80 border-primary/20 focus:border-primary/40 focus:ring-primary/20 text-sm"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || isTyping || !aiService}
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white transition-all duration-200"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};