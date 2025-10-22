import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserAgreementModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const UserAgreementModal: React.FC<UserAgreementModalProps> = ({
  open,
  onAccept,
  onDecline,
}) => {
  return (
    <Dialog open={open}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] p-0 gap-0 bg-gradient-to-br from-background via-background to-primary/5 border-primary/30"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-4 border-b border-primary/20 bg-gradient-to-r from-background to-muted/30">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              ⚠️ Ethical Use & User Agreement
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-foreground">
            Please read and accept the following terms before using HCARF Scanner
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4 max-h-[50vh]">
          <div className="space-y-6 text-foreground">
            {/* Main Agreement */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-yellow-400">Educational & Ethical Use Only</h3>
                  <p className="text-sm leading-relaxed">
                    This tool is designed for <strong>educational purposes</strong> and <strong>ethical cybersecurity research</strong> only. 
                    It must be used responsibly and in compliance with all applicable laws and regulations.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>You Agree To:</span>
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start space-x-3">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Only scan domains and systems for which you have <strong>explicit authorization</strong> from the owner.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Use this tool for <strong>legitimate security research, vulnerability assessment, and educational purposes</strong>.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Comply with all applicable <strong>local, state, national, and international laws</strong> regarding computer security.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Report discovered vulnerabilities <strong>responsibly</strong> through proper disclosure channels.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Accept full responsibility for your actions and any consequences resulting from the use of this tool.</span>
                </li>
              </ul>
            </div>

            {/* Prohibited Activities */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span>Strictly Prohibited:</span>
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start space-x-3">
                  <div className="h-1.5 w-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <span><strong>Unauthorized scanning</strong> of systems, networks, or domains without explicit permission.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="h-1.5 w-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Using discovered vulnerabilities to <strong>compromise, damage, or gain unauthorized access</strong> to systems.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="h-1.5 w-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <span><strong>Malicious activities</strong> including data theft, service disruption, or system exploitation.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="h-1.5 w-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Selling, distributing, or sharing vulnerability information for <strong>malicious purposes</strong>.</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="h-1.5 w-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Any activity that violates <strong>Computer Fraud and Abuse Act (CFAA)</strong> or equivalent laws in your jurisdiction.</span>
                </li>
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Disclaimer:</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                The creators and operators of HCARF Scanner are not responsible for any misuse of this tool. 
                Users are solely responsible for their actions and must ensure compliance with all applicable laws. 
                This tool is provided "as-is" without warranties of any kind. Use at your own risk.
              </p>
            </div>

            {/* Legal Notice */}
            <div className="bg-gradient-to-r from-destructive/10 to-orange-500/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-xs leading-relaxed">
                <strong className="text-destructive">Legal Notice:</strong> Unauthorized computer access is a crime under 
                18 U.S.C. § 1030 and similar laws worldwide. Violators may face criminal prosecution, civil liability, 
                and substantial penalties. Always obtain proper authorization before conducting security assessments.
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-4 border-t border-primary/20 bg-gradient-to-r from-background to-muted/30 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDecline}
            className="w-full sm:w-auto border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Decline & Exit
          </Button>
          <Button
            onClick={onAccept}
            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept & Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
