
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Check, AlertTriangle, Plus, Trash2, RefreshCw } from 'lucide-react';
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
  const [isChecking, setIsChecking] = useState<{[key: string]: boolean}>({});
  const [isRemoving, setIsRemoving] = useState<{[key: string]: boolean}>({});
  const [domains, setDomains] = useState<string[]>([]);
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<{[key: string]: 'verified' | 'pending' | 'failed' | null}>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchUserDomains();
  }, []);

  const fetchUserDomains = async () => {
    try {
      setIsLoading(true);
      const userDomains = await getUserDomains();
      setDomains(userDomains);
      
      // Check status for each domain
      for (const domainName of userDomains) {
        const response = await checkDomainStatus(domainName);
        if (response.success && response.status) {
          setVerificationStatus(prev => ({
            ...prev,
            [domainName]: response.status
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setIsLoading(false);
    }
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
    try {
      const response = await addEmailDomain(domain);
      
      if (response.success) {
        toast({
          title: "Domain added",
          description: response.message,
        });
        
        setDomain('');
        await fetchUserDomains();
        
        if (response.dnsRecords && response.dnsRecords.length > 0) {
          setDnsRecords(response.dnsRecords);
          setCurrentDomain(domain);
          
          if (response.status) {
            setVerificationStatus(prev => ({
              ...prev,
              [domain]: response.status
            }));
          }
        } else {
          console.warn('No DNS records received when adding domain:', domain);
          // Try to get DNS records explicitly
          await handleCheckStatus(domain);
        }
      } else {
        toast({
          title: "Error adding domain",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in handleAddDomain:', error);
      toast({
        title: "Error adding domain",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async (domainToCheck: string) => {
    setIsChecking(prev => ({ ...prev, [domainToCheck]: true }));
    setCurrentDomain(domainToCheck);
    
    try {
      const response = await checkDomainStatus(domainToCheck);
      
      if (response.success) {
        if (response.status) {
          setVerificationStatus(prev => ({
            ...prev,
            [domainToCheck]: response.status
          }));
        }
        
        if (response.dnsRecords && response.dnsRecords.length > 0) {
          setDnsRecords(response.dnsRecords);
        } else {
          console.warn('No DNS records received when checking domain:', domainToCheck);
        }
        
        toast({
          title: `Domain status: ${response.status || 'unknown'}`,
          description: response.message,
        });
      } else {
        toast({
          title: "Error checking status",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in handleCheckStatus:', error);
      toast({
        title: "Error checking status",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsChecking(prev => ({ ...prev, [domainToCheck]: false }));
    }
  };

  const handleRemoveDomain = async (domainToRemove: string) => {
    if (confirm(`Are you sure you want to remove "${domainToRemove}"?`)) {
      setIsRemoving(prev => ({ ...prev, [domainToRemove]: true }));
      
      try {
        const response = await removeDomain(domainToRemove);
        
        if (response.success) {
          toast({
            title: "Domain removed",
            description: response.message,
          });
          
          // Remove from local state
          setDomains(domains.filter(d => d !== domainToRemove));
          
          if (currentDomain === domainToRemove) {
            setCurrentDomain(null);
            setDnsRecords([]);
          }
          
          // Remove from verification status
          const newVerificationStatus = { ...verificationStatus };
          delete newVerificationStatus[domainToRemove];
          setVerificationStatus(newVerificationStatus);
        } else {
          toast({
            title: "Error removing domain",
            description: response.message,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error in handleRemoveDomain:', error);
        toast({
          title: "Error removing domain",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setIsRemoving(prev => ({ ...prev, [domainToRemove]: false }));
      }
    }
  };

  const refreshDomains = async () => {
    await fetchUserDomains();
    toast({
      title: "Domains refreshed",
      description: "Domain list has been updated.",
    });
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
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Your Domains</h3>
              <Button variant="outline" size="sm" onClick={refreshDomains}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {isLoading && domains.length === 0 ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : domains.length > 0 ? (
              <div className="space-y-2">
                {domains.map((domainName) => (
                  <div key={domainName} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center space-x-2">
                      <span>{domainName}</span>
                      {verificationStatus[domainName] && (
                        <Badge variant={
                          verificationStatus[domainName] === 'verified' ? 'default' : 
                          verificationStatus[domainName] === 'pending' ? 'outline' : 
                          'destructive'
                        }>
                          {verificationStatus[domainName] === 'verified' && 
                            <Check className="h-3 w-3 mr-1" />
                          }
                          {verificationStatus[domainName]?.charAt(0).toUpperCase() + 
                            verificationStatus[domainName]?.slice(1)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCheckStatus(domainName)}
                        disabled={isChecking[domainName]}
                      >
                        {isChecking[domainName] ? (
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
                        disabled={isRemoving[domainName]}
                      >
                        {isRemoving[domainName] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
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
          </div>
        </CardContent>
      </Card>

      {/* DNS Records */}
      {currentDomain && dnsRecords.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>DNS Verification for {currentDomain}</CardTitle>
              {verificationStatus[currentDomain] && (
                <Badge variant={
                  verificationStatus[currentDomain] === 'verified' ? 'default' : 
                  verificationStatus[currentDomain] === 'pending' ? 'outline' : 
                  'destructive'
                }>
                  {verificationStatus[currentDomain] === 'verified' && <Check className="h-3 w-3 mr-1" />}
                  {verificationStatus[currentDomain]?.charAt(0).toUpperCase() + verificationStatus[currentDomain]?.slice(1)}
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
