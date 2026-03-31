import { useState, useRef, useEffect } from "react";
import { 
  useGetCurrentUser, getGetCurrentUserQueryKey,
  useGetBarberServices, getGetBarberServicesQueryKey,
  useAddBarberService, useUpdateBarberService, useDeleteBarberService
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Scissors, Clock, DollarSign, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function BarberServices() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey() }
  });

  const { data: services, isLoading } = useGetBarberServices(user?.id || 0, {
    query: {
      enabled: !!user?.id,
      queryKey: getGetBarberServicesQueryKey(user?.id || 0)
    }
  });

  const addService = useAddBarberService({
    mutation: {
      onSuccess: () => {
        toast({ title: "Service added successfully" });
        queryClient.invalidateQueries({ queryKey: getGetBarberServicesQueryKey(user?.id || 0) });
        setIsOpen(false);
        resetForm();
      }
    }
  });

  const updateService = useUpdateBarberService({
    mutation: {
      onSuccess: () => {
        toast({ title: "Service updated" });
        queryClient.invalidateQueries({ queryKey: getGetBarberServicesQueryKey(user?.id || 0) });
        setEditingId(null);
      }
    }
  });

  const deleteService = useDeleteBarberService({
    mutation: {
      onSuccess: () => {
        toast({ title: "Service removed" });
        queryClient.invalidateQueries({ queryKey: getGetBarberServicesQueryKey(user?.id || 0) });
      }
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setName("");
    setPrice("");
    setDuration("");
    setDescription("");
    setIsActive(true);
  };

  const handleEdit = (service: any) => {
    setEditingId(service.id);
    setName(service.name);
    setPrice(service.price.toString());
    setDuration(service.durationMinutes.toString());
    setDescription(service.description || "");
    setIsActive(service.isActive);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateService.mutate({
      id: editingId,
      data: {
        price: Number(price),
        durationMinutes: Number(duration),
        description,
        isActive
      }
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if(!user) return;
    addService.mutate({
      barberId: user.id,
      data: {
        name,
        price: Number(price),
        durationMinutes: Number(duration),
        description
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Manage Services</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or disable services you offer.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if(!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              <Plus className="mr-2 h-4 w-4" /> Add New Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Service Name</Label>
                <Input id="name" placeholder="e.g. Premium Haircut" required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input id="price" type="number" min="0" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (mins)</Label>
                  <Input id="duration" type="number" min="5" step="5" required value={duration} onChange={e => setDuration(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (Optional)</Label>
                <Textarea id="desc" placeholder="Describe the service..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <Button type="submit" className="w-full mt-4" disabled={addService.isPending}>
                Save Service
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)
        ) : !services || services.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 border border-dashed rounded-xl">
            <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-primary mb-2">No services added yet</h3>
            <p className="text-muted-foreground">Click the button above to add your first service.</p>
          </div>
        ) : (
          services.map(service => (
            <Card key={service.id} className={`border-border overflow-hidden transition-all ${!service.isActive && editingId !== service.id ? 'opacity-60 grayscale-[0.5]' : ''}`}>
              {editingId === service.id ? (
                <CardContent className="p-6 bg-muted/10">
                  <div className="flex justify-between items-center mb-4 border-b border-border pb-4">
                    <h3 className="font-bold text-lg text-primary">{service.name} <span className="text-xs font-normal text-muted-foreground ml-2">(Name cannot be changed)</span></h3>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input type="number" value={price} onChange={e => setPrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (mins)</Label>
                      <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id={`active-${service.id}`} checked={isActive} onCheckedChange={setIsActive} />
                      <Label htmlFor={`active-${service.id}`}>Service is Active</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                    <Button onClick={handleSaveEdit} disabled={updateService.isPending}><Save className="h-4 w-4 mr-2" /> Save Changes</Button>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-xl text-primary">{service.name}</h3>
                      {!service.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    <p className="text-muted-foreground text-sm max-w-2xl mb-3">
                      {service.description || "No description provided."}
                    </p>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <span className="flex items-center text-accent bg-accent/10 px-2 py-1 rounded">
                        <DollarSign className="h-4 w-4 mr-1" /> {service.price.toFixed(2)}
                      </span>
                      <span className="flex items-center text-primary bg-primary/5 px-2 py-1 rounded">
                        <Clock className="h-4 w-4 mr-1" /> {service.durationMinutes} mins
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto mt-4 md:mt-0">
                    <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={() => handleEdit(service)}>
                      <Edit2 className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 md:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => {
                        if(confirm("Delete this service permanently?")) {
                          deleteService.mutate({ id: service.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
