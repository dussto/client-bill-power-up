import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import useUserRole from '@/components/auth/UserRole';

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'annually' | 'one-time';
  features: {
    stripeIntegration: boolean;
    sendingDomains: number;
    serviceCreation: boolean;
    paymentOptions: {
      offline: boolean;
      stripe: boolean;
    };
    paymentTerms: {
      oneOffs: boolean;
      monthly: boolean;
      annually: boolean;
    };
  };
}

const defaultPackages: ServicePackage[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Essential features for small businesses',
    price: 9.99,
    billingCycle: 'monthly',
    features: {
      stripeIntegration: false,
      sendingDomains: 1,
      serviceCreation: false,
      paymentOptions: {
        offline: true,
        stripe: false,
      },
      paymentTerms: {
        oneOffs: true,
        monthly: false,
        annually: false,
      },
    },
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'Advanced features for growing businesses',
    price: 29.99,
    billingCycle: 'monthly',
    features: {
      stripeIntegration: true,
      sendingDomains: 3,
      serviceCreation: true,
      paymentOptions: {
        offline: true,
        stripe: true,
      },
      paymentTerms: {
        oneOffs: true,
        monthly: true,
        annually: false,
      },
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Complete solution for established businesses',
    price: 99.99,
    billingCycle: 'monthly',
    features: {
      stripeIntegration: true,
      sendingDomains: 10,
      serviceCreation: true,
      paymentOptions: {
        offline: true,
        stripe: true,
      },
      paymentTerms: {
        oneOffs: true,
        monthly: true,
        annually: true,
      },
    },
  },
];

export default function PackageManager() {
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<ServicePackage | null>(null);
  const [newPackage, setNewPackage] = useState<Partial<ServicePackage>>({
    name: '',
    description: '',
    price: 0,
    billingCycle: 'monthly',
    features: {
      stripeIntegration: false,
      sendingDomains: 1,
      serviceCreation: false,
      paymentOptions: {
        offline: true,
        stripe: false,
      },
      paymentTerms: {
        oneOffs: true,
        monthly: false,
        annually: false,
      },
    },
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load packages from localStorage or use defaults
    const storedPackages = localStorage.getItem('servicePackages');
    if (storedPackages) {
      setPackages(JSON.parse(storedPackages));
    } else {
      setPackages(defaultPackages);
      localStorage.setItem('servicePackages', JSON.stringify(defaultPackages));
    }
  }, []);

  // Save packages to localStorage whenever they change
  useEffect(() => {
    if (packages.length > 0) {
      localStorage.setItem('servicePackages', JSON.stringify(packages));
    }
  }, [packages]);

  const handleAddPackage = () => {
    if (!newPackage.name || !newPackage.description || !newPackage.price) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const packageToAdd: ServicePackage = {
      id: `package-${Date.now()}`,
      name: newPackage.name || '',
      description: newPackage.description || '',
      price: newPackage.price || 0,
      billingCycle: newPackage.billingCycle as 'monthly' | 'annually' | 'one-time' || 'monthly',
      features: newPackage.features || {
        stripeIntegration: false,
        sendingDomains: 1,
        serviceCreation: false,
        paymentOptions: {
          offline: true,
          stripe: false,
        },
        paymentTerms: {
          oneOffs: true,
          monthly: false,
          annually: false,
        },
      },
    };

    setPackages([...packages, packageToAdd]);
    setIsAddDialogOpen(false);
    setNewPackage({
      name: '',
      description: '',
      price: 0,
      billingCycle: 'monthly',
      features: {
        stripeIntegration: false,
        sendingDomains: 1,
        serviceCreation: false,
        paymentOptions: {
          offline: true,
          stripe: false,
        },
        paymentTerms: {
          oneOffs: true,
          monthly: false,
          annually: false,
        },
      },
    });

    toast({
      title: "Package created",
      description: `The ${packageToAdd.name} package has been created.`,
    });
  };

  const handleEditPackage = () => {
    if (!currentPackage) return;

    setPackages(packages.map(pkg => 
      pkg.id === currentPackage.id ? currentPackage : pkg
    ));
    
    setIsEditDialogOpen(false);
    setCurrentPackage(null);

    toast({
      title: "Package updated",
      description: `The ${currentPackage.name} package has been updated.`,
    });
  };

  const handleDeletePackage = (id: string) => {
    setPackages(packages.filter(pkg => pkg.id !== id));

    toast({
      title: "Package deleted",
      description: "The package has been deleted.",
    });
  };

  const formatPrice = (price: number, cycle: string) => {
    return (
      <>
        <span className="text-3xl font-bold">${price}</span>
        <span className="text-muted-foreground">/{cycle === 'one-time' ? '' : cycle}</span>
      </>
    );
  };

  const getCycleDisplay = (cycle: string) => {
    switch(cycle) {
      case 'monthly': return 'month';
      case 'annually': return 'year';
      case 'one-time': return 'one-time';
      default: return cycle;
    }
  };

  if (isRoleLoading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Packages</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Only administrators can manage packages. If you need to make changes, please contact your administrator.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{pkg.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{pkg.description}</p>
                <div className="mt-4">
                  {formatPrice(pkg.price, getCycleDisplay(pkg.billingCycle))}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <h4 className="font-medium mb-2">Features</h4>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    {pkg.features.stripeIntegration ? 
                      <Check className="h-4 w-4 mr-2 text-green-500" /> : 
                      <span className="h-4 w-4 mr-2" />
                    }
                    Stripe Integration
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    {pkg.features.sendingDomains} Sending Domain{pkg.features.sendingDomains > 1 ? 's' : ''}
                  </li>
                  <li className="flex items-center">
                    {pkg.features.serviceCreation ? 
                      <Check className="h-4 w-4 mr-2 text-green-500" /> : 
                      <span className="h-4 w-4 mr-2" />
                    }
                    Service Creation
                  </li>
                  <li>
                    <span className="font-medium">Payment Options:</span>
                    <ul className="pl-6 mt-1 space-y-1">
                      <li className="flex items-center">
                        {pkg.features.paymentOptions.offline ? 
                          <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                          <span className="h-3 w-3 mr-2" />
                        }
                        Offline Payments
                      </li>
                      <li className="flex items-center">
                        {pkg.features.paymentOptions.stripe ? 
                          <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                          <span className="h-3 w-3 mr-2" />
                        }
                        Stripe Payments
                      </li>
                    </ul>
                  </li>
                  <li>
                    <span className="font-medium">Payment Terms:</span>
                    <ul className="pl-6 mt-1 space-y-1">
                      <li className="flex items-center">
                        {pkg.features.paymentTerms.oneOffs ? 
                          <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                          <span className="h-3 w-3 mr-2" />
                        }
                        One-off Payments
                      </li>
                      <li className="flex items-center">
                        {pkg.features.paymentTerms.monthly ? 
                          <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                          <span className="h-3 w-3 mr-2" />
                        }
                        Monthly Subscriptions
                      </li>
                      <li className="flex items-center">
                        {pkg.features.paymentTerms.annually ? 
                          <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                          <span className="h-3 w-3 mr-2" />
                        }
                        Annual Subscriptions
                      </li>
                    </ul>
                  </li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Packages</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create a New Package</DialogTitle>
              <DialogDescription>
                Define the features and pricing for this service package.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Package Name</Label>
                <Input
                  id="name"
                  value={newPackage.name || ''}
                  onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newPackage.description || ''}
                  onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newPackage.price || ''}
                    onChange={(e) => setNewPackage({...newPackage, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Select 
                    value={newPackage.billingCycle || 'monthly'} 
                    onValueChange={(value) => setNewPackage({...newPackage, billingCycle: value as any})}
                  >
                    <SelectTrigger id="billingCycle">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <h4 className="font-medium pt-2">Features</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="stripeIntegration" 
                    checked={newPackage.features?.stripeIntegration} 
                    onCheckedChange={(checked) => 
                      setNewPackage({
                        ...newPackage, 
                        features: {
                          ...newPackage.features!,
                          stripeIntegration: checked === true
                        }
                      })
                    }
                  />
                  <Label htmlFor="stripeIntegration">Stripe Integration</Label>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label htmlFor="sendingDomains">Number of Sending Domains</Label>
                  <Input
                    id="sendingDomains"
                    type="number"
                    min="1"
                    value={newPackage.features?.sendingDomains || 1}
                    onChange={(e) => 
                      setNewPackage({
                        ...newPackage, 
                        features: {
                          ...newPackage.features!,
                          sendingDomains: parseInt(e.target.value)
                        }
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="serviceCreation" 
                    checked={newPackage.features?.serviceCreation} 
                    onCheckedChange={(checked) => 
                      setNewPackage({
                        ...newPackage, 
                        features: {
                          ...newPackage.features!,
                          serviceCreation: checked === true
                        }
                      })
                    }
                  />
                  <Label htmlFor="serviceCreation">Service Creation</Label>
                </div>
                <h5 className="text-sm font-medium pt-2">Payment Options</h5>
                <div className="pl-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="offline" 
                      checked={newPackage.features?.paymentOptions.offline} 
                      onCheckedChange={(checked) => 
                        setNewPackage({
                          ...newPackage, 
                          features: {
                            ...newPackage.features!,
                            paymentOptions: {
                              ...newPackage.features!.paymentOptions,
                              offline: checked === true
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="offline">Offline Payments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="stripe" 
                      checked={newPackage.features?.paymentOptions.stripe} 
                      onCheckedChange={(checked) => 
                        setNewPackage({
                          ...newPackage, 
                          features: {
                            ...newPackage.features!,
                            paymentOptions: {
                              ...newPackage.features!.paymentOptions,
                              stripe: checked === true
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="stripe">Stripe Payments</Label>
                  </div>
                </div>
                <h5 className="text-sm font-medium pt-2">Payment Terms</h5>
                <div className="pl-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="oneOffs" 
                      checked={newPackage.features?.paymentTerms.oneOffs} 
                      onCheckedChange={(checked) => 
                        setNewPackage({
                          ...newPackage, 
                          features: {
                            ...newPackage.features!,
                            paymentTerms: {
                              ...newPackage.features!.paymentTerms,
                              oneOffs: checked === true
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="oneOffs">One-off Payments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="monthly" 
                      checked={newPackage.features?.paymentTerms.monthly} 
                      onCheckedChange={(checked) => 
                        setNewPackage({
                          ...newPackage, 
                          features: {
                            ...newPackage.features!,
                            paymentTerms: {
                              ...newPackage.features!.paymentTerms,
                              monthly: checked === true
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="monthly">Monthly Subscriptions</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="annually" 
                      checked={newPackage.features?.paymentTerms.annually} 
                      onCheckedChange={(checked) => 
                        setNewPackage({
                          ...newPackage, 
                          features: {
                            ...newPackage.features!,
                            paymentTerms: {
                              ...newPackage.features!.paymentTerms,
                              annually: checked === true
                            }
                          }
                        })
                      }
                    />
                    <Label htmlFor="annually">Annual Subscriptions</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddPackage}>Create Package</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{pkg.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{pkg.description}</p>
              <div className="mt-4">
                {formatPrice(pkg.price, getCycleDisplay(pkg.billingCycle))}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <h4 className="font-medium mb-2">Features</h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  {pkg.features.stripeIntegration ? 
                    <Check className="h-4 w-4 mr-2 text-green-500" /> : 
                    <span className="h-4 w-4 mr-2" />
                  }
                  Stripe Integration
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  {pkg.features.sendingDomains} Sending Domain{pkg.features.sendingDomains > 1 ? 's' : ''}
                </li>
                <li className="flex items-center">
                  {pkg.features.serviceCreation ? 
                    <Check className="h-4 w-4 mr-2 text-green-500" /> : 
                    <span className="h-4 w-4 mr-2" />
                  }
                  Service Creation
                </li>
                <li>
                  <span className="font-medium">Payment Options:</span>
                  <ul className="pl-6 mt-1 space-y-1">
                    <li className="flex items-center">
                      {pkg.features.paymentOptions.offline ? 
                        <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                        <span className="h-3 w-3 mr-2" />
                      }
                      Offline Payments
                    </li>
                    <li className="flex items-center">
                      {pkg.features.paymentOptions.stripe ? 
                        <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                        <span className="h-3 w-3 mr-2" />
                      }
                      Stripe Payments
                    </li>
                  </ul>
                </li>
                <li>
                  <span className="font-medium">Payment Terms:</span>
                  <ul className="pl-6 mt-1 space-y-1">
                    <li className="flex items-center">
                      {pkg.features.paymentTerms.oneOffs ? 
                        <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                        <span className="h-3 w-3 mr-2" />
                      }
                      One-off Payments
                    </li>
                    <li className="flex items-center">
                      {pkg.features.paymentTerms.monthly ? 
                        <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                        <span className="h-3 w-3 mr-2" />
                      }
                      Monthly Subscriptions
                    </li>
                    <li className="flex items-center">
                      {pkg.features.paymentTerms.annually ? 
                        <Check className="h-3 w-3 mr-2 text-green-500" /> : 
                        <span className="h-3 w-3 mr-2" />
                      }
                      Annual Subscriptions
                    </li>
                  </ul>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Dialog open={isEditDialogOpen && currentPackage?.id === pkg.id} onOpenChange={(open) => {
                if (open) {
                  setCurrentPackage(pkg);
                }
                setIsEditDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  {currentPackage && (
                    <>
                      <DialogHeader>
                        <DialogTitle>Edit Package</DialogTitle>
                        <DialogDescription>
                          Update the features and pricing for this service package.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-name">Package Name</Label>
                          <Input
                            id="edit-name"
                            value={currentPackage.name}
                            onChange={(e) => setCurrentPackage({...currentPackage, name: e.target.value})}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-description">Description</Label>
                          <Input
                            id="edit-description"
                            value={currentPackage.description}
                            onChange={(e) => setCurrentPackage({...currentPackage, description: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-price">Price</Label>
                            <Input
                              id="edit-price"
                              type="number"
                              value={currentPackage.price}
                              onChange={(e) => setCurrentPackage({...currentPackage, price: parseFloat(e.target.value)})}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-billingCycle">Billing Cycle</Label>
                            <Select 
                              value={currentPackage.billingCycle} 
                              onValueChange={(value) => setCurrentPackage({...currentPackage, billingCycle: value as any})}
                            >
                              <SelectTrigger id="edit-billingCycle">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="annually">Annually</SelectItem>
                                <SelectItem value="one-time">One-time</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {/* Feature editing - same as add dialog */}
                        <h4 className="font-medium pt-2">Features</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="edit-stripeIntegration" 
                              checked={currentPackage.features.stripeIntegration} 
                              onCheckedChange={(checked) => 
                                setCurrentPackage({
                                  ...currentPackage, 
                                  features: {
                                    ...currentPackage.features,
                                    stripeIntegration: checked
                                  }
                                })
                              }
                            />
                            <Label htmlFor="edit-stripeIntegration">Stripe Integration</Label>
                          </div>
                          <div className="grid grid-cols-2 items-center gap-4">
                            <Label htmlFor="edit-sendingDomains">Number of Sending Domains</Label>
                            <Input
                              id="edit-sendingDomains"
                              type="number"
                              min="1"
                              value={currentPackage.features.sendingDomains}
                              onChange={(e) => 
                                setCurrentPackage({
                                  ...currentPackage, 
                                  features: {
                                    ...currentPackage.features,
                                    sendingDomains: parseInt(e.target.value)
                                  }
                                })
                              }
                            />
                          </div>
                          {/* More feature editing fields... similar to Add dialog */}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleEditPackage}>Save Changes</Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDeletePackage(pkg.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
