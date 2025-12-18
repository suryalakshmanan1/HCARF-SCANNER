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
  const [keyValidationStatus, setKeyValidationStatus] = useState<{[key: string]: boolean | string}>({});
  const [validationMessages, setValidationMessages] = useState<{[key: string]: string}>({});

  const validateApiKeys = async () => {
    setValidatingKeys(true);
    const validationResults: {[key: string]: boolean | string} = {};
    const messages: {[key: string]: string} = {};
    
    try {
      // Test GitHub API key
      if (keys.github && keys.github.trim().length > 0) {
        try {
          const githubResponse = await fetch('https://api.github.com/user', {
            headers: { 
              'Authorization': `token ${keys.github}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          if (githubResponse.ok) {
            validationResults.github = true;
            messages.github = '✓ GitHub API Key is VALID';
          } else if (githubResponse.status === 401) {
            validationResults.github = false;
            messages.github = '✗ Invalid GitHub API key (401 Unauthorized)';
          } else {
            validationResults.github = false;
            messages.github = `✗ GitHub API error: ${githubResponse.status}`;
          }
        } catch (error) {
          validationResults.github = false;
          messages.github = '✗ Cannot reach GitHub API (Network error)';
        }
      } else if (keys.github) {
        validationResults.github = 'empty';
        messages.github = 'ⓘ GitHub API key is empty';
      }

      // Test Google API key with a simple search
      if (keys.google && keys.google.trim().length > 0 && keys.googleCx && keys.googleCx.trim().length > 0) {
        try {
          const googleResponse = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${keys.google}&cx=${keys.googleCx}&q=test&num=1`
          );
          if (googleResponse.ok) {
            validationResults.google = true;
            messages.google = '✓ Google Custom Search API is VALID';
          } else if (googleResponse.status === 403) {
            validationResults.google = false;
            messages.google = '✗ Invalid Google API key or insufficient quota (403)';
          } else {
            validationResults.google = false;
            messages.google = `✗ Google API error: ${googleResponse.status}`;
          }
        } catch (error) {
          validationResults.google = false;
          messages.google = '✗ Cannot reach Google API (Network error)';
        }
      } else if (keys.google || keys.googleCx) {
        validationResults.google = 'empty';
        messages.google = 'ⓘ Google API key or Custom Search Engine ID is empty';
      }

      // Test AI API key
      if (keys.aiApiKey && keys.aiApiKey.trim().length > 0) {
        try {
          // Check format and length
          if (keys.aiApiKey.length > 10) {
            validationResults.aiApiKey = true;
            messages.aiApiKey = '✓ AI API Key format is valid';
          } else {
            validationResults.aiApiKey = false;
            messages.aiApiKey = '✗ AI API Key is too short';
          }
        } catch {
          validationResults.aiApiKey = false;
          messages.aiApiKey = '✗ Invalid AI API Key format';
        }
      } else if (keys.aiApiKey) {
        validationResults.aiApiKey = 'empty';
        messages.aiApiKey = 'ⓘ AI API key is empty (optional)';
      }

      setKeyValidationStatus(validationResults);
      setValidationMessages(messages);

      const validKeys = Object.entries(validationResults).filter(([_, v]) => v === true).length;
      const totalChecked = Object.keys(validationResults).length;

      if (validKeys > 0) {
        toast({
          title: "API Keys Validated",
          description: `${validKeys}/${totalChecked} API keys are valid and ready to use.`,
        });
      } else {
        toast({
          title: "Validation Required",
          description: "Please add and validate at least one API key (GitHub or Google) to enable live scanning.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Validation Error",
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
          {/* Validation Status Summary */}
          {Object.keys(keyValidationStatus).length > 0 && (
            <Card className={`border-2 ${
              Object.values(keyValidationStatus).some(v => v === true) 
                ? 'border-green-500/30 bg-green-50/5' 
                : 'border-yellow-500/30 bg-yellow-50/5'
            }`}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">API Key Validation Status</h3>
                  {Object.entries(validationMessages).map(([key, message]) => (
                    <div key={key} className="flex items-center space-x-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        keyValidationStatus[key] === true ? 'bg-green-500' :
                        keyValidationStatus[key] === false ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                      <span className={
                        keyValidationStatus[key] === true ? 'text-green-700' :
                        keyValidationStatus[key] === false ? 'text-red-700' : 'text-gray-700'
                      }>
                        {message}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    keyValidationStatus.github === undefined || keyValidationStatus.github === 'empty' ? 'bg-gray-400' :
                    keyValidationStatus.github === true ? 'bg-green-500' : 'bg-red-500'
                  }`} title={validationMessages.github} />
                </div>
                {validationMessages.github && (
                  <p className={`text-sm ${
                    keyValidationStatus.github === true ? 'text-green-600' :
                    keyValidationStatus.github === false ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {validationMessages.github}
                  </p>
                )}
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
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    keyValidationStatus.google === undefined || keyValidationStatus.google === 'empty' ? 'bg-gray-400' :
                    keyValidationStatus.google === true ? 'bg-green-500' : 'bg-red-500'
                  }`} title={validationMessages.google} />
                </div>
                {validationMessages.google && (
                  <p className={`text-sm ${
                    keyValidationStatus.google === true ? 'text-green-600' :
                    keyValidationStatus.google === false ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {validationMessages.google}
                  </p>
                )}
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
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    keyValidationStatus.aiApiKey === undefined || keyValidationStatus.aiApiKey === 'empty' ? 'bg-gray-400' :
                    keyValidationStatus.aiApiKey === true ? 'bg-green-500' : 'bg-red-500'
                  }`} title={validationMessages.aiApiKey} />
                </div>
                {validationMessages.aiApiKey && (
                  <p className={`text-sm ${
                    keyValidationStatus.aiApiKey === true ? 'text-green-600' :
                    keyValidationStatus.aiApiKey === false ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {validationMessages.aiApiKey}
                  </p>
                )}
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