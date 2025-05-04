
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from '@/components/ui/sonner';
import { useVideoChat } from '@/contexts/VideoChatContext';

const ReportDialog: React.FC = () => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [open, setOpen] = useState(false);
  const { endChat } = useVideoChat();

  const handleSubmit = () => {
    // In a real app, this would send the report to a server
    toast.success("Report submitted. Thank you for helping keep our community safe.");
    setOpen(false);
    endChat();
    
    // Reset form
    setReason('');
    setDetails('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Inappropriate Behavior</DialogTitle>
          <DialogDescription>
            Please let us know why you're reporting this user. 
            Your report will be reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason</Label>
            <RadioGroup 
              id="report-reason" 
              value={reason} 
              onValueChange={setReason}
              className="gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inappropriate_content" id="r1" />
                <Label htmlFor="r1">Inappropriate content</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="harassment" id="r2" />
                <Label htmlFor="r2">Harassment or bullying</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="underage" id="r3" />
                <Label htmlFor="r3">Underage user</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="r4" />
                <Label htmlFor="r4">Other</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea 
              id="details" 
              placeholder="Provide any additional information..." 
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reason}
            className="bg-destructive hover:bg-destructive/90"
          >
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
