import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { generateCaptcha, validateCaptcha } from '@/utils/api/captcha';

interface CaptchaComponentProps {
  onSolved: (solved: boolean) => void;
  ref?: React.RefObject<CaptchaHandle>;
}

export interface CaptchaHandle {
  refreshCaptcha: () => void;
  resetCaptcha: () => void;
}

export const CaptchaComponent = React.forwardRef<CaptchaHandle, CaptchaComponentProps>(
  ({ onSolved }, ref) => {
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchCaptcha = async () => {
    setIsLoading(true);
    try {
      const result = await generateCaptcha();
      if (result.success && result.data) {
        setCaptchaImage(result.data.image);
        setCaptchaId(result.data.id);
        setUserInput('');
        onSolved(false);
      } else {
        throw new Error(result.error || 'Failed to generate CAPTCHA');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load CAPTCHA. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateCaptchaInput = async () => {
    if (!userInput.trim()) return;

    try {
      const result = await validateCaptcha(captchaId, userInput.trim());
      
      if (result.success && result.valid) {
        onSolved(true);
        toast({
          title: "CAPTCHA Solved",
          description: "You can now proceed with the scan.",
        });
      } else {
        onSolved(false);
        toast({
          title: "Incorrect CAPTCHA",
          description: "Please try again.",
          variant: "destructive"
        });
        fetchCaptcha();
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Failed to validate CAPTCHA. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  // Expose refresh and reset methods for parent component
  React.useImperativeHandle(ref, () => ({
    refreshCaptcha: () => {
      fetchCaptcha();
    },
    resetCaptcha: () => {
      onSolved(false);
      setUserInput('');
      setCaptchaImage('');
      setCaptchaId('');
      fetchCaptcha();
    }
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Security Verification</CardTitle>
        <CardDescription>Please solve the CAPTCHA to continue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {captchaImage ? (
              <img
                src={`data:image/svg+xml;base64,${captchaImage}`}
                alt="CAPTCHA"
                className="bg-white rounded border p-2"
                style={{ filter: 'contrast(1.2)' }}
              />
            ) : (
              <div className="w-32 h-12 bg-muted rounded border flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchCaptcha}
            disabled={isLoading}
            title="Refresh CAPTCHA"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Input
            placeholder="Enter CAPTCHA code"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && validateCaptchaInput()}
            className="flex-1"
          />
          <Button onClick={validateCaptchaInput} variant="outline">
            Verify
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

CaptchaComponent.displayName = 'CaptchaComponent';