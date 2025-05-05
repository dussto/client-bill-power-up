
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Check, AlertTriangle, Plus, Trash2, RefreshCw, Award, ExternalLink, Copy } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
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
  const [verificationStatus, setVerificationStatus] = useState<{[key: string]: 'verified' | 'pending' | 'failed' | 'not_started' | null}>({});
  const [loadingRecords, setLoadingRecords] = useState<{[key: string]: boolean}>({});
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
        await fetchDomainStatus(domainName);
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

  const fetchDomainStatus = async (domainName: string) => {
    try {
      // Mark domain as loading records
      setLoadingRecords(prev => ({...prev, [domainName]: true}));
      
      const response = await checkDomainStatus(domainName);
      if (response.success) {
        if (response.status) {
          setVerificationStatus(prev => ({
            ...prev,
            [domainName]: response.status
          }));
        }
        
        // Store DNS records if they're available
        if (response.dnsRecords && response.dnsRecords.length > 0) {
          setDnsRecords(prev => ({
            ...prev,
            [domainName]: response.dnsRecords || []
          }));
        } else {
          // If no DNS records were found, try to verify the domain to get them
          console.log(`No DNS records found for ${domainName}, trying verification endpoint`);
          const verifyResponse = await verifyDomain(domainName);
          
          if (verifyResponse.success && verifyResponse.dnsRecords && verifyResponse.dnsRecords.length > 0) {
            setDnsRecords(prev => ({
              ...prev,
              [domainName]: verifyResponse.dnsRecords || []
            }));
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching status for domain ${domainName}:`, error);
    } finally {
      // Mark domain as no longer loading records
      setLoadingRecords(prev => ({...prev, [domainName]: false}));
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
        // Show toast with success message
        toast({
          title: "Domain added",
          description: response.dnsRecords && response.dnsRecords.length > 0 
            ? "DNS records are available below. Add these to your domain provider to verify ownership."
            : response.message,
        });
        
        // Always add the domain to the list regardless of DNS records
        setDomains(prev => [...prev, domain]);
        
        // If the API returned DNS records, show them immediately
        if (response.dnsRecords && response.dnsRecords.length > 0) {
          setDnsRecords(prev => ({
            ...prev,
            [domain]: response.dnsRecords || []
          }));
          
          if (response.status) {
            setVerificationStatus(prev => ({
              ...prev,
              [domain]: response.status
            }));
          }
          
          // Show DNS records for the newly added domain
          setCurrentDomain(domain);
        } else {
          // If no DNS records were returned, try to check status immediately
          await handleCheckStatus(domain);
          setCurrentDomain(domain);
        }
        
        // Reset domain input
        setDomain('');
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
    setLoadingRecords(prev => ({ ...prev, [domainToCheck]: true }));
    
    try {
      // First try a simple status check
      let response = await checkDomainStatus(domainToCheck);
      
      // If status check didn't return DNS records, try verification endpoint
      if (response.success && (!response.dnsRecords || response.dnsRecords.length === 0)) {
        console.log(`No DNS records from status check for ${domainToCheck}, trying verification endpoint`);
        const verifyResponse = await verifyDomain(domainToCheck);
        
        if (verifyResponse.success && verifyResponse.dnsRecords && verifyResponse.dnsRecords.length > 0) {
          response = verifyResponse;
        }
      }
      
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
            description: "DNS records loaded successfully.",
          });
        } else {
          toast({
            title: `Domain status: ${response.status || 'pending'}`,
            description: "No DNS records returned. Please try again later.",
            variant: "destructive",
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
      setLoadingRecords(prev => ({ ...prev, [domainToCheck]: false }));
    }
  };

  const handleVerifyDomain = async (domainToVerify: string) => {
    setIsVerifying(prev => ({ ...prev, [domainToVerify]: true }));
    setLoadingRecords(prev => ({ ...prev, [domainToVerify]: true }));
    
    try {
      // Call the verify domain function
      const response = await verifyDomain(domainToVerify);
      
      if (response.success) {
        if (response.status) {
          setVerificationStatus(prev => ({
            ...prev,
            [domainToVerify]: response.status
          }));
          
          toast({
            title: `Domain verification ${response.status === 'verified' ? 'successful' : 'in progress'}`,
            description: response.message || "Verification request submitted",
            variant: response.status === 'verified' ? 'default' : 'default',
          });
        }
        
        if (response.dnsRecords && response.dnsRecords.length > 0) {
          setDnsRecords(prev => ({
            ...prev,
            [domainToVerify]: response.dnsRecords || []
          }));
          setCurrentDomain(domainToVerify);
        } else {
          // If verify didn't return DNS records, try status check
          await handleCheckStatus(domainToVerify);
        }
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
      setLoadingRecords(prev => ({ ...prev, [domainToVerify]: false }));
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: "Text copied to clipboard",
          duration: 2000,
        });
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast({
          title: "Copy failed",
          description: "Could not copy text to clipboard",
          variant: "destructive",
          duration: 2000,
        });
      }
    );
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
    
    // If we don't have DNS records for this domain yet, try to load them
    if (!dnsRecords[domainName] || dnsRecords[domainName].length === 0) {
      handleCheckStatus(domainName);
    }
  };

  // Check if there's a verified domain
  const hasVerifiedDomain = Object.values(verificationStatus).some(status => status === 'verified');

  // Get badge variant based on status
  const getBadgeVariant = (status: string | null) => {
    if (status === 'verified') return 'success';
    if (status === 'pending') return 'outline';
    if (status === 'failed') return 'destructive';
    return 'secondary'; // For 'not_started' or null
  };

  // Format status text
  const formatStatus = (status: string) => {
    if (status === 'not_started') return 'Not Started';
    return status.charAt(0).toUpperCase() + status.slice(1);
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
              disabled={isAdding || (hasVerifiedDomain && domains.length > 0)}
            />
            <Button 
              type="submit" 
              disabled={isAdding || (hasVerifiedDomain && domains.length > 0)}
            >
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

          {hasVerifiedDomain && domains.length > 0 && (
            <Alert className="bg-muted">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Domain Already Verified</AlertTitle>
              <AlertDescription>
                You already have a verified domain that will be used for sending emails. If you want to use a different domain, remove the existing one first.
              </AlertDescription>
            </Alert>
          )}

          {/* Domains list */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Your Domains</h3>
              <div className="flex space-x-2">
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
                <a 
                  href="https://resend.com/domains" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button 
                    variant="outline" 
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Resend Dashboard
                  </Button>
                </a>
              </div>
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
                        <Badge variant={getBadgeVariant(verificationStatus[domainName])}>
                          {verificationStatus[domainName] === 'verified' && 
                            <Check className="h-3 w-3 mr-1" />
                          }
                          {formatStatus(verificationStatus[domainName] || '')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {/* Show DNS records button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showDnsRecords(domainName)}
                        disabled={loadingRecords[domainName]}
                      >
                        {loadingRecords[domainName] ? 
                          <Loader2 className="h-4 w-4 animate-spin" /> : 
                          "Show DNS Records"
                        }
                      </Button>
                      
                      {/* Verify domain button for pending domains */}
                      {verificationStatus[domainName] !== 'verified' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVerifyDomain(domainName)}
                          disabled={isVerifying[domainName] || loadingRecords[domainName]}
                        >
                          {isVerifying[domainName] || loadingRecords[domainName] ? (
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
                        disabled={isChecking[domainName] || loadingRecords[domainName]}
                      >
                        {isChecking[domainName] || loadingRecords[domainName] ? (
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
      {currentDomain && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>DNS Verification for {currentDomain}</CardTitle>
              {verificationStatus[currentDomain] && (
                <Badge variant={getBadgeVariant(verificationStatus[currentDomain])}>
                  {verificationStatus[currentDomain] === 'verified' && <Check className="h-3 w-3 mr-1" />}
                  {formatStatus(verificationStatus[currentDomain] || '')}
                </Badge>
              )}
            </div>
            <CardDescription>
              Add these DNS records to your domain to verify ownership and enable email sending.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRecords[currentDomain] ? (
              <div className="flex flex-col items-center justify-center p-6">
                <Loader2 className="h-10 w-10 animate-spin mb-2" />
                <p className="text-center text-muted-foreground">Loading DNS records...</p>
              </div>
            ) : dnsRecords[currentDomain] && dnsRecords[currentDomain].length > 0 ? (
              <>
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
                      <TableHead>Copy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dnsRecords[currentDomain].map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {record.type}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-1 p-0 h-auto" 
                            onClick={() => copyToClipboard(record.type)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          {record.name}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-1 p-0 h-auto" 
                            onClick={() => copyToClipboard(record.name)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-xs break-all">
                          {record.value}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-1 p-0 h-auto" 
                            onClick={() => copyToClipboard(record.value)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TableCell>
                        {dnsRecords[currentDomain].some(record => record.priority !== undefined) && (
                          <TableCell>
                            {record.priority || 'N/A'}
                            {record.priority && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="ml-1 p-0 h-auto" 
                                onClick={() => record.priority && copyToClipboard(record.priority.toString())}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                        {dnsRecords[currentDomain].some(record => record.ttl !== undefined) && (
                          <TableCell>
                            {record.ttl || 'Auto'}
                            {record.ttl && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="ml-1 p-0 h-auto" 
                                onClick={() => record.ttl && copyToClipboard(record.ttl.toString())}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => copyToClipboard(`Type: ${record.type}\nName: ${record.name}\nValue: ${record.value}${record.priority ? '\nPriority: ' + record.priority : ''}${record.ttl ? '\nTTL: ' + record.ttl : ''}`)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy All
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Add all DNS records shown above, including both required and recommended records for best email deliverability. View your DNS records in the <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline">Resend Dashboard</a> if you need more information.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-6">
                <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
                <p className="text-center text-muted-foreground">DNS records not available. Click "Check Status" to attempt to retrieve them.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCheckStatus(currentDomain)}
                  disabled={isChecking[currentDomain]}
                  className="mt-4"
                >
                  {isChecking[currentDomain] ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Check Status
                </Button>
                
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Alternatively, view your DNS records directly in the <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline">Resend Dashboard</a>
                </p>
              </div>
            )}
            
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
                    disabled={isVerifying[currentDomain] || loadingRecords[currentDomain]}
                  >
                    {isVerifying[currentDomain] || loadingRecords[currentDomain] ? (
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
                    disabled={isChecking[currentDomain] || loadingRecords[currentDomain]}
                  >
                    {isChecking[currentDomain] || loadingRecords[currentDomain] ? (
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
