
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";

interface EmailDomainSelectorProps {
  verifiedDomains: string[];
  fromDomain: string;
  fromName: string;
  onDomainChange: (value: string) => void;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function EmailDomainSelector({
  verifiedDomains,
  fromDomain,
  fromName,
  onDomainChange,
  onNameChange
}: EmailDomainSelectorProps) {
  if (verifiedDomains.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="fromDomain">Send From Domain</Label>
        <Select value={fromDomain} onValueChange={onDomainChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a verified domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Use test email address</SelectItem>
            {verifiedDomains.map(domain => (
              <SelectItem key={domain} value={domain}>{domain}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {fromDomain && fromDomain !== "test" && (
        <div className="grid gap-2">
          <Label htmlFor="fromName">From Name</Label>
          <Input
            id="fromName"
            name="fromName"
            value={fromName}
            onChange={onNameChange}
            placeholder="Your Company Name"
          />
        </div>
      )}
    </div>
  );
}
