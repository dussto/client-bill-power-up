
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Check, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { 
  addEmailDomain, 
  checkDomainStatus, 
  removeDomain, 
  getUserDomains, 
  DnsRecord 
} from '@/utils/emailDomains';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function EmailDomainManager() {
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [domains, setDomains] = useState<string[]>([]);
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'pending' | 'failed' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserDomains();
  }, []);

  const fetchUserDomains = async () => {
    const userDomains = await getUserDomains();
    setDomains(userDomains);
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!domain) {
      toast({
        title: "Error",
        description: "Please enter a domain name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const response = await addEmailDomain(domain);
    setIsLoading(false);

    if (response.success) {
      toast({
        title: "Domain added",
        description: response.message,
      });
      setDomain('');
      fetchUserDomains();
      
      if (response.dnsRecords) {
        setDnsRecords(response.dnsRecords);
        setCurrentDomain(domain);
        setVerificationStatus('pending');
      }
    } else {
      toast({
        title: "Error adding domain",
        description: response.message,
        variant: "destructive",
      });
    }
  };

  const handleCheckStatus = async (domainToCheck: string) => {
    setIsChecking(true);
    setCurrentDomain(domainToCheck);
    
    const response = await checkDomainStatus(domainToCheck);
    setIsChecking(false);
    
    if (response.success) {
      setVerificationStatus(response.status || null);
      if (response.dnsRecords) {
        setDnsRecords(response.dnsRecords);
      }
      
      toast({
        title: `Domain status: ${response.status}`,
        description: response.message,
      });
    } else {
      toast({
        title: "Error checking status",
        description: response.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveDomain = async (domainToRemove: string) => {
    if (confirm(`Are you sure you want to remove "${domainToRemove}"?`)) {
      const response = await removeDomain(domainToRemove);
      
      if (response.success) {
        toast({
          title: "Domain removed",
          description: response.message,
        });
        fetchUserDomains();
        
        if (currentDomain === domainToRemove) {
          setCurrentDomain(null);
          setDnsRecords([]);
          setVerificationStatus(null);
        }
      } else {
        toast({
          title: "Error removing domain",
          description: response.message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Sending Domains</CardTitle>
          <CardDescription>
            Add and verify your email domains to send invoices from your own email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add domain form */}
          <form onSubmit={handleAddDomain} className="flex space-x-2">
            <Input
              placeholder="yourdomain.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Domain
                </>
              )}
            </Button>
          </form>

          {/* Domains list */}
          {domains.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Your Domains</h3>
              <div className="space-y-2">
                {domains.map((domainName) => (
                  <div key={domainName} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <span>{domainName}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCheckStatus(domainName)}
                        disabled={isChecking && currentDomain === domainName}
                      >
                        {isChecking && currentDomain === domainName ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Check Status"
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveDomain(domainName)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No domains configured</AlertTitle>
              <AlertDescription>
                Add a domain to start sending emails from your own email address.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* DNS Records */}
      {currentDomain && dnsRecords.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>DNS Verification for {currentDomain}</CardTitle>
              {verificationStatus && (
                <Badge variant={
                  verificationStatus === 'verified' ? 'default' : 
                  verificationStatus === 'pending' ? 'outline' : 
                  'destructive'
                }>
                  {verificationStatus === 'verified' && <Check className="h-3 w-3 mr-1" />}
                  {verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)}
                </Badge>
              )}
            </div>
            <CardDescription>
              Add these DNS records to your domain to verify ownership and enable email sending.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Host/Name</TableHead>
                  <TableHead>Value/Content</TableHead>
                  {dnsRecords.some(record => record.priority !== undefined) && (
                    <TableHead>Priority</TableHead>
                  )}
                  {dnsRecords.some(record => record.ttl !== undefined) && (
                    <TableHead>TTL</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dnsRecords.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{record.type}</TableCell>
                    <TableCell>{record.name}</TableCell>
                    <TableCell className="font-mono text-xs break-all">{record.value}</TableCell>
                    {dnsRecords.some(record => record.priority !== undefined) && (
                      <TableCell>{record.priority || 'N/A'}</TableCell>
                    )}
                    {dnsRecords.some(record => record.ttl !== undefined) && (
                      <TableCell>{record.ttl || 'Auto'}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <Separator className="my-4" />
            
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">DNS changes can take up to 24-48 hours to propagate globally.</p>
              <p>Click "Check Status" to verify if your domain has been validated.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
