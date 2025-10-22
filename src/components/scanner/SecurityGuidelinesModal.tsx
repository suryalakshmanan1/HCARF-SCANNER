import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Eye, Lock, Scale, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SecurityGuidelinesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SecurityGuidelinesModal: React.FC<SecurityGuidelinesModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const guidelines = [
    {
      icon: <Shield className="h-8 w-8 text-cyan-500" />,
      title: "Responsible Security Testing",
      subtitle: "Ethical Use Only",
      content: [
        "Only scan domains you own or have explicit permission to test",
        "Use this tool for educational and authorized security assessments",
        "Do not use findings to exploit or harm any systems",
        "Report vulnerabilities responsibly through proper channels"
      ],
      color: "from-cyan-500 to-blue-500"
    },
    {
      icon: <Eye className="h-8 w-8 text-purple-500" />,
      title: "Data Privacy & Handling",
      subtitle: "Your Data, Your Control",
      content: [
        "All scans are performed in real-time - no data is permanently stored",
        "API keys are stored locally in your browser session only",
        "Scan results are not transmitted to external servers",
        "Clear your browser data to remove all locally stored information"
      ],
      color: "from-purple-500 to-indigo-500"
    },
    {
      icon: <Scale className="h-8 w-8 text-orange-500" />,
      title: "Legal Compliance",
      subtitle: "Stay Within Legal Boundaries",
      content: [
        "Ensure compliance with local laws and regulations",
        "Respect rate limits and terms of service of external APIs",
        "Do not circumvent security measures or access controls",
        "Use findings only for legitimate security improvement purposes"
      ],
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <BookOpen className="h-8 w-8 text-green-500" />,
      title: "Educational Purpose",
      subtitle: "Learn & Improve Security",
      content: [
        "This tool is designed for learning cybersecurity concepts",
        "Use it to understand common security misconfigurations",
        "Practice responsible disclosure for any findings",
        "Continuously educate yourself on emerging security threats"
      ],
      color: "from-green-500 to-emerald-500"
    }
  ];

  const handleAccept = () => {
    localStorage.setItem('hcarf-security-guidelines-accepted', 'true');
    onOpenChange(false);
  };

  const nextSlide = () => {
    if (currentSlide < guidelines.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80 border border-primary/20 shadow-2xl shadow-primary/10 z-50">
        <DialogHeader className="border-b border-primary/20 pb-4">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="relative">
              <div className="h-12 w-12 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div className="text-center">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                HCARF Security Scanner
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Important Security Guidelines & Responsible Use Policy
              </DialogDescription>
            </div>
          </div>
          
          {/* Progress indicators */}
          <div className="flex justify-center space-x-2">
            {guidelines.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500' 
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          <Card className={`bg-gradient-to-br ${guidelines[currentSlide].color}/10 border-2 border-gradient-to-r ${guidelines[currentSlide].color}/20 shadow-xl`}>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  {guidelines[currentSlide].icon}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {guidelines[currentSlide].title}
                </h3>
                <Badge variant="outline" className="text-muted-foreground">
                  {guidelines[currentSlide].subtitle}
                </Badge>
              </div>
              
              <div className="space-y-4">
                {guidelines[currentSlide].content.map((item, index) => (
                  <div key={index} className="flex items-start space-x-3 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-background/60 to-muted/40 border-t border-primary/10">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="hover:bg-primary/10 hover:border-primary/30"
          >
            Previous
          </Button>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {currentSlide + 1} of {guidelines.length}
            </span>
          </div>
          
          {currentSlide < guidelines.length - 1 ? (
            <Button
              onClick={nextSlide}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleAccept}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              I Understand & Agree
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};