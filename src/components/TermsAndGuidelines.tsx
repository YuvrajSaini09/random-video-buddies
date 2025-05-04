
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const TermsAndGuidelines: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="text-xs text-muted-foreground hover:text-primary">
          Terms & Guidelines
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms of Use & Guidelines</DialogTitle>
          <DialogDescription>
            Please read and follow these guidelines when using our platform.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          <section>
            <h3 className="font-medium text-base">Community Guidelines</h3>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Be respectful and kind to other users</li>
              <li>Do not engage in harassment, hate speech, or bullying</li>
              <li>Do not share inappropriate content or nudity</li>
              <li>Respect others' privacy and do not record conversations without consent</li>
              <li>Users must be at least 18 years old</li>
              <li>Report any violations or concerning behavior immediately</li>
            </ul>
          </section>
          
          <section>
            <h3 className="font-medium text-base">Privacy & Safety</h3>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Do not share personal information (address, phone number, etc.)</li>
              <li>We recommend using a nickname rather than your real name</li>
              <li>You can disconnect from any conversation at any time</li>
              <li>Use the report feature if you encounter inappropriate behavior</li>
              <li>Conversations are not recorded or stored by our service</li>
            </ul>
          </section>
          
          <section>
            <h3 className="font-medium text-base">Terms of Service</h3>
            <p className="mt-2">
              By using this service, you agree not to misuse the platform or violate any applicable laws.
              We reserve the right to ban users who violate our guidelines or terms of service.
              This platform is provided "as is" without warranties of any kind.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAndGuidelines;
