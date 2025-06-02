
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface EmailFormFieldsProps {
  emailData: {
    to: string;
    subject: string;
    message: string;
    copy: boolean;
    markAsSent: boolean;
  };
  invoiceStatus: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCheckboxChange: (name: string, checked: boolean) => void;
}

export default function EmailFormFields({
  emailData,
  invoiceStatus,
  onChange,
  onCheckboxChange
}: EmailFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="to">To</Label>
        <Input
          id="to"
          name="to"
          value={emailData.to}
          onChange={onChange}
          required
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          name="subject"
          value={emailData.subject}
          onChange={onChange}
          required
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          value={emailData.message}
          onChange={onChange}
          rows={8}
          required
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="copy"
            checked={emailData.copy}
            onCheckedChange={(checked) =>
              onCheckboxChange("copy", checked === true)
            }
          />
          <Label htmlFor="copy">
            Send me a copy
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="markAsSent"
            checked={emailData.markAsSent}
            onCheckedChange={(checked) =>
              onCheckboxChange("markAsSent", checked === true)
            }
          />
          <Label htmlFor="markAsSent">
            Mark invoice as {invoiceStatus === 'draft' ? 'pending' : invoiceStatus}
          </Label>
        </div>
      </div>
    </div>
  );
}
