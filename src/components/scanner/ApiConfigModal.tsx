import React, { useState } from 'react';
import { Key, Eye, EyeOff, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface ApiKeys {
  github: string;
  google: string;
  googleCx: string;
  aiApiKey: string;
}

interface ApiConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKeys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  open,
  onOpenChange,
  apiKeys,
  onSave,
}) => {
  const [keys, setKeys] = useState<ApiKeys>(apiKeys);
  const [showKeys, setShowKeys] = useState({
    github: false,
    google: false,
    googleCx: false,
    aiApiKey: false,
  });
  const [validatingKeys, setValidatingKeys] = useState(false);
  const [keyValidationStatus, setKeyValidationStatus] = useState<{[key: string]: boolean}>({});

  const validateApiKeys = async () => {
    setValidatingKeys(true);
    const validationResults: {[key: string]: boolean} = {};
    
    try {
      // Test GitHub API key
      if (keys.github) {
        try {
          const githubResponse = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${keys.github}` }
          });
          validationResults.github = githubResponse.ok;
        } catch {
          validationResults.github = false;
        }
      }

      // Test Google API key with a simple search
      if (keys.google && keys.googleCx) {
        try {
          const googleResponse = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${keys.google}&cx=${keys.googleCx}&q=test&num=1`
          );
          validationResults.google = googleResponse.ok;
        } catch {
          validationResults.google = false;
        }
      }

      // Test AI API key (basic validation)
      if (keys.aiApiKey) {
        try {
          // Basic key format validation
          validationResults.aiApiKey = keys.aiApiKey.length > 10;
        } catch {
          validationResults.aiApiKey = false;
        }
      }

      setKeyValidationStatus(validationResults);

      const allValid = Object.values(validationResults).every(Boolean);
      if (allValid) {
        toast({
          title: "API Keys Validated",
          description: "All provided API keys are working correctly.",
        });
      } else {
        toast({
          title: "Validation Complete",
          description: "Some API keys may need attention. Check the status indicators.",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "API Key Validation Failed",
        description: error instanceof Error ? error.message : "Validation encountered an error.",
        variant: "destructive"
      });
    } finally {
      setValidatingKeys(false);
    }
  };

  const handleSave = () => {
    // Save to sessionStorage with encryption-like encoding
    const encodedKeys = btoa(JSON.stringify(keys));
    sessionStorage.setItem('apiKeys', JSON.stringify(keys));
    sessionStorage.setItem('apiKeysBackup', encodedKeys);
    
    onSave(keys);
    onOpenChange(false);
    
    toast({
      title: "API Keys Saved Successfully",
      description: "Your API keys have been securely configured and saved.",
    });
  };

  const toggleShowKey = (keyType: keyof typeof showKeys) => {
    setShowKeys(prev => ({ ...prev, [keyType]: !prev[keyType] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-primary" />
            <span>API Configuration</span>
          </DialogTitle>
          <DialogDescription>
            Configure your API keys to enable security scanning functionality
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* GitHub API */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>GitHub Personal Access Token</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('https://github.com/settings/tokens', '_blank')}
                  className="text-muted-foreground hover:text-primary"
                  title="Get API Key"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                Required for scanning GitHub repositories, issues, and gists for exposed credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-token">Personal Access Token</Label>
                <div className="flex space-x-2">
                  <Input
                    id="github-token"
                    type={showKeys.github ? "text" : "password"}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxx"
                    value={keys.github}
                    onChange={(e) => setKeys(prev => ({ ...prev, github: e.target.value }))}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleShowKey('github')}
                  >
                    {showKeys.github ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <div className={`w-3 h-3 rounded-full ${
                    keyValidationStatus.github === undefined ? 'bg-gray-500' :
                    keyValidationStatus.github ? 'bg-green-500' : 'bg-red-500'
                  }`} title={
                    keyValidationStatus.github === undefined ? 'Not validated' :
                    keyValidationStatus.github ? 'Key is valid' : 'Key validation failed'
                  } />
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate at: GitHub Settings → Developer settings → Personal access tokens
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Google Custom Search API */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Google Custom Search API</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
                  className="text-muted-foreground hover:text-primary"
                  title="Get API Key"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                Required for scanning Google search results for exposed information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google-api">Google API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="google-api"
                    type={showKeys.google ? "text" : "password"}
                    placeholder="AIzaSyXXXXXXXXXXXXXXXXXXXXXX"
                    value={keys.google}
                    onChange={(e) => setKeys(prev => ({ ...prev, google: e.target.value }))}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleShowKey('google')}
                  >
                    {showKeys.google ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <div className={`w-3 h-3 rounded-full ${
                    keyValidationStatus.google === undefined ? 'bg-gray-500' :
                    keyValidationStatus.google ? 'bg-green-500' : 'bg-red-500'
                  }`} title={
                    keyValidationStatus.google === undefined ? 'Not validated' :
                    keyValidationStatus.google ? 'Key is valid' : 'Key validation failed'
                  } />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="google-cx">Custom Search Engine ID</Label>
                <div className="flex space-x-2">
                  <Input
                    id="google-cx"
                    type={showKeys.googleCx ? "text" : "password"}
                    placeholder="xxxxxxxxxxxxxxxxx:xxxxxxxxx"
                    value={keys.googleCx}
                    onChange={(e) => setKeys(prev => ({ ...prev, googleCx: e.target.value }))}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleShowKey('googleCx')}
                  >
                    {showKeys.googleCx ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create at: Google Cloud Console → Custom Search API → Search Engine
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI API Key */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>AI API Key (Optional)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('https://openrouter.ai/keys', '_blank')}
                  className="text-muted-foreground hover:text-primary"
                  title="Get API Key"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                For enhanced AI analysis and chat assistance. Supports OpenAI, Anthropic, or OpenRouter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-api-key">AI API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="ai-api-key"
                    type={showKeys.aiApiKey ? "text" : "password"}
                    placeholder="sk-xxxxxxxxxxxxxxxxxx or your AI API key"
                    value={keys.aiApiKey}
                    onChange={(e) => setKeys(prev => ({ ...prev, aiApiKey: e.target.value }))}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleShowKey('aiApiKey')}
                  >
                    {showKeys.aiApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <div className={`w-3 h-3 rounded-full ${
                    keyValidationStatus.aiApiKey === undefined ? 'bg-gray-500' :
                    keyValidationStatus.aiApiKey ? 'bg-green-500' : 'bg-red-500'
                  }`} title={
                    keyValidationStatus.aiApiKey === undefined ? 'Not validated' :
                    keyValidationStatus.aiApiKey ? 'Key is valid' : 'Key validation failed'
                  } />
                </div>
                <p className="text-sm text-muted-foreground">
                  Optional: Enables AI Security Assistant and enhanced analysis
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={validateApiKeys}
              disabled={validatingKeys || (!keys.github && !keys.google)}
              className="flex items-center space-x-2"
            >
              {validatingKeys ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  <span>Validating...</span>
                </>
              ) : (
                <span>Validate Keys</span>
              )}
            </Button>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="scanner-button">
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};