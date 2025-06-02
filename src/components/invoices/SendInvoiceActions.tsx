
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface SendInvoiceActionsProps {
  isSubmitting: boolean;
  fromDomain: string;
  onCancel: () => void;
}

export default function SendInvoiceActions({
  isSubmitting,
  fromDomain,
  onCancel
}: SendInvoiceActionsProps) {
  return (
    <div className="flex justify-end gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            {fromDomain && fromDomain !== "test" ? 'Send Invoice' : 'Send Test Email'}
          </>
        )}
      </Button>
    </div>
  );
}
