
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Check, AlertTriangle, Plus, Trash2, RefreshCw, Award } from 'lucide-react';
import { 
  addEmailDomain, 
  checkDomainStatus, 
  removeDomain, 
  getUserDomains,
  verifyDomain,
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
  const [isAdding, setIsAdding] = useState(false);
  const [isChecking, setIsChecking] = useState<{[key: string]: boolean}>({});
  const [isVerifying, setIsVerifying] = useState<{[key: string]: boolean}>({});
  const [isRemoving, setIsRemoving] = useState<{[key: string]: boolean}>({});
  const [domains, setDomains] = useState<string[]>([]);
  const [currentDomain, setCurrentDomain] = useState<string | null>(null);
  const [dnsRecords, setDnsRecords] = useState<{[key: string]: DnsRecord[]}>({});
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
          
          // Store DNS records for each domain
          if (response.dnsRecords && response.dnsRecords.length > 0) {
            setDnsRecords(prev => ({
              ...prev,
              [domainName]: response.dnsRecords || []
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast({
        title: "Error fetching domains",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
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

    setIsAdding(true);
    try {
      const response = await addEmailDomain(domain);
      
      if (response.success) {
        toast({
          title: "Domain added",
          description: response.message,
        });
        
        // If the API returned DNS records, show them immediately
        if (response.dnsRecords && response.dnsRecords.length > 0) {
          setDnsRecords(prev => ({
            ...prev,
            [domain]: response.dnsRecords || []
          }));
          setCurrentDomain(domain);
          
          if (response.status) {
            setVerificationStatus(prev => ({
              ...prev,
              [domain]: response.status
            }));
          }
        }
        
        // Reset domain input
        setDomain('');
        
        // Refresh domains list
        await fetchUserDomains();
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
      setIsAdding(false);
    }
  };

  const handleCheckStatus = async (domainToCheck: string) => {
    setIsChecking(prev => ({ ...prev, [domainToCheck]: true }));
    
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
          setDnsRecords(prev => ({
            ...prev,
            [domainToCheck]: response.dnsRecords || []
          }));
          setCurrentDomain(domainToCheck);
          
          toast({
            title: `Domain status: ${response.status || 'pending'}`,
            description: "DNS records loaded below. Please add these records to your domain provider.",
          });
        } else {
          toast({
            title: `Domain status: ${response.status || 'pending'}`,
            description: "No DNS records were returned. Please try again later.",
          });
        }
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

  const handleVerifyDomain = async (domainToVerify: string) => {
    setIsVerifying(prev => ({ ...prev, [domainToVerify]: true }));
    
    try {
      const response = await verifyDomain(domainToVerify);
      
      if (response.success) {
        if (response.status) {
          setVerificationStatus(prev => ({
            ...prev,
            [domainToVerify]: response.status
          }));
        }
        
        if (response.dnsRecords && response.dnsRecords.length > 0) {
          setDnsRecords(prev => ({
            ...prev,
            [domainToVerify]: response.dnsRecords || []
          }));
        }
        
        setCurrentDomain(domainToVerify);
        
        toast({
          title: `Domain verification ${response.status === 'verified' ? 'successful' : 'in progress'}`,
          description: response.message,
          variant: response.status === 'verified' ? 'default' : 'default',
        });
      } else {
        toast({
          title: "Error verifying domain",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in handleVerifyDomain:', error);
      toast({
        title: "Error verifying domain",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(prev => ({ ...prev, [domainToVerify]: false }));
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
          
          // Remove domain data from state
          if (currentDomain === domainToRemove) {
            setCurrentDomain(null);
          }
          
          // Remove from verification status
          const newVerificationStatus = { ...verificationStatus };
          delete newVerificationStatus[domainToRemove];
          setVerificationStatus(newVerificationStatus);
          
          // Remove from DNS records
          const newDnsRecords = { ...dnsRecords };
          delete newDnsRecords[domainToRemove];
          setDnsRecords(newDnsRecords);
        } else {
          toast({
            title: "Error removing domain",
            description: response.message,
            variant: "destructive",
          });
          
          // Refresh domain list anyway to ensure UI is in sync
          await fetchUserDomains();
        }
      } catch (error) {
        console.error('Error in handleRemoveDomain:', error);
        toast({
          title: "Error removing domain",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
        
        // Refresh domain list anyway to ensure UI is in sync
        await fetchUserDomains();
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

  const showDnsRecords = (domainName: string) => {
    setCurrentDomain(domainName);
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
              disabled={isAdding}
            />
            <Button type="submit" disabled={isAdding}>
              {isAdding ? (
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshDomains}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </>
                )}
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
                      {/* Show DNS records button */}
                      {dnsRecords[domainName] && verificationStatus[domainName] !== 'verified' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => showDnsRecords(domainName)}
                        >
                          Show DNS Records
                        </Button>
                      )}
                      
                      {/* Verify domain button for pending domains */}
                      {verificationStatus[domainName] === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyDomain(domainName)}
                          disabled={isVerifying[domainName]}
                        >
                          {isVerifying[domainName] ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Award className="h-4 w-4 mr-1" />
                          )}
                          Verify
                        </Button>
                      )}
                      
                      {/* Check status button */}
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
                      
                      {/* Remove domain button */}
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
      {currentDomain && dnsRecords[currentDomain] && dnsRecords[currentDomain].length > 0 && (
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
                  {dnsRecords[currentDomain].some(record => record.priority !== undefined) && (
                    <TableHead>Priority</TableHead>
                  )}
                  {dnsRecords[currentDomain].some(record => record.ttl !== undefined) && (
                    <TableHead>TTL</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dnsRecords[currentDomain].map((record, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{record.type}</TableCell>
                    <TableCell>{record.name}</TableCell>
                    <TableCell className="font-mono text-xs break-all">{record.value}</TableCell>
                    {dnsRecords[currentDomain].some(record => record.priority !== undefined) && (
                      <TableCell>{record.priority || 'N/A'}</TableCell>
                    )}
                    {dnsRecords[currentDomain].some(record => record.ttl !== undefined) && (
                      <TableCell>{record.ttl || 'Auto'}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                <p>DNS changes can take up to 24-48 hours to propagate globally.</p>
              </div>
              {verificationStatus[currentDomain] !== 'verified' && (
                <div className="flex space-x-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleVerifyDomain(currentDomain)}
                    disabled={isVerifying[currentDomain]}
                  >
                    {isVerifying[currentDomain] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Award className="h-4 w-4 mr-1" />
                    )}
                    Verify Domain
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCheckStatus(currentDomain)}
                    disabled={isChecking[currentDomain]}
                  >
                    {isChecking[currentDomain] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Check Status
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
