import React from 'react';
import { MessageSquare, Bot, Sparkles, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingAiButtonProps {
  onClick: () => void;
  hasResults: boolean;
}

export const FloatingAiButton: React.FC<FloatingAiButtonProps> = ({ onClick, hasResults }) => {
  const [apiKeyConfigured, setApiKeyConfigured] = React.useState(false);

  React.useEffect(() => {
    const checkApiKey = () => {
      const apiKeys = JSON.parse(sessionStorage.getItem('apiKeys') || '{}');
      setApiKeyConfigured(!!apiKeys.aiApiKey);
    };
    
    checkApiKey();
    
    // Listen for API key changes
    const interval = setInterval(checkApiKey, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] group">
      <Button 
        onClick={onClick}
        className="relative h-16 w-16 rounded-full bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-2xl shadow-purple-500/30 transition-all duration-300 hover:scale-110 border-0 group-hover:shadow-purple-500/50"
        aria-label="Open HCARF Security Assistant"
      >
        <div className="relative flex items-center justify-center">
          <Shield className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
          
          {/* API Key Status Indicator */}
          {apiKeyConfigured ? (
            <div className="absolute -top-2 -right-2 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-background">
              <div className="h-2 w-2 bg-white rounded-full" />
            </div>
          ) : (
            <div className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-background">
              <div className="h-2 w-2 bg-white rounded-full" />
            </div>
          )}
          
          {/* Results indicator */}
          {hasResults && (
            <div className="absolute -bottom-1 -left-1 h-3 w-3 bg-yellow-400 rounded-full animate-pulse" />
          )}
          
          <Sparkles className="absolute -bottom-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse opacity-80" />
        </div>
      </Button>
      
      {/* Pulse ring animations */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 opacity-20 animate-ping" />
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-10 animate-ping" style={{ animationDelay: '0.5s' }} />
      
      {/* Floating tooltip */}
      <div className="absolute bottom-18 right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-gradient-to-r from-cyan-500/90 to-purple-500/90 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-sm text-white font-medium whitespace-nowrap shadow-lg">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>HCARF AI Security Assistant</span>
          </div>
          <div className="text-xs opacity-80 mt-1 flex items-center space-x-2">
            {apiKeyConfigured ? (
              <>
                <span className="flex items-center">
                  <span className="h-2 w-2 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                  AI Active
                </span>
                {hasResults && <span>• Ready to analyze</span>}
              </>
            ) : (
              <>
                <span className="flex items-center">
                  <span className="h-2 w-2 bg-red-400 rounded-full mr-1.5" />
                  Configure API Key
                </span>
              </>
            )}
          </div>
        </div>
        {/* Tooltip arrow */}
        <div className="absolute top-full right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-500/90" />
      </div>
    </div>
  );
};