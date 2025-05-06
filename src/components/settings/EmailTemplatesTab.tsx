
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/context/DataContext';
import { EmailTemplate } from '@/context/DataContextTypes';

export function EmailTemplatesTab() {
  const { emailTemplates, updateEmailTemplate, addEmailTemplate, deleteEmailTemplate } = useData();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate>>({});
  
  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditingTemplate(template);
  };
  
  const handleUpdateTemplate = () => {
    if (selectedTemplate && (editingTemplate.subject || editingTemplate.body)) {
      updateEmailTemplate(selectedTemplate.id, editingTemplate);
      toast({
        title: "Template updated",
        description: `The ${selectedTemplate.name} template has been updated.`,
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Customize the email templates for different invoice actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Available Templates</h3>
              <div className="space-y-2">
                {emailTemplates.map(template => (
                  <Button 
                    key={template.id}
                    variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="md:col-span-2">
              {selectedTemplate ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Edit Template: {selectedTemplate.name}</h3>
                  
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input 
                        id="subject"
                        value={editingTemplate.subject || ''}
                        onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="body">Email Body</Label>
                      <Textarea 
                        id="body"
                        value={editingTemplate.body || ''}
                        onChange={(e) => setEditingTemplate({...editingTemplate, body: e.target.value})}
                        rows={10}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <h4 className="font-medium">Available Variables</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-muted p-2 rounded">{'{{invoiceNumber}}'}</div>
                        <div className="bg-muted p-2 rounded">{'{{companyName}}'}</div>
                        <div className="bg-muted p-2 rounded">{'{{clientName}}'}</div>
                        <div className="bg-muted p-2 rounded">{'{{amount}}'}</div>
                        <div className="bg-muted p-2 rounded">{'{{dueDate}}'}</div>
                        <div className="bg-muted p-2 rounded">{'{{userName}}'}</div>
                      </div>
                    </div>
                    
                    <Button onClick={handleUpdateTemplate}>
                      Save Template
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Select a template to edit</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
