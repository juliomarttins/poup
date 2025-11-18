

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { Separator } from "@/components/ui/separator";
import { doc, setDoc, collection, arrayUnion } from "firebase/firestore";
import { AvatarSelector } from "./avatar-selector";
import { AvatarColorSelector } from "./avatar-color-selector";
import { AvatarBackgroundSelector } from "./avatar-background-selector";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AvatarIcon } from "../icons/avatar-icon";
import type { Profile, UserProfile } from "@/lib/types";
import { Label } from "../ui/label";
import { useProfile } from "@/contexts/profile-context";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback } from "../ui/avatar";


const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "O nome deve ter pelo menos 2 caracteres.",
    })
    .max(50, {
      message: "O nome não deve ter mais de 50 caracteres.",
    }),
  photoURL: z.string().nullable(),
  avatarColor: z.string().nullable(),
  avatarBackground: z.string().nullable(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function ProfileEditForm({
    profile,
    onSave,
    onCancel,
}: {
    profile: Profile,
    onSave: (data: ProfileFormValues) => void,
    onCancel: () => void,
}) {
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: profile.name || "",
            photoURL: profile.photoURL || null,
            avatarColor: profile.avatarColor || null,
            avatarBackground: profile.avatarBackground || null,
        },
        mode: "onChange",
    });

    const selectedColor = form.watch("avatarColor");
    const selectedIcon = form.watch("photoURL");
    const selectedBackground = form.watch("avatarBackground");
    const currentName = form.watch("name");

    const handleSubmit = (data: ProfileFormValues) => {
        onSave(data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                 <div className="flex justify-center">
                    <Avatar
                        className="h-40 w-40 rounded-full"
                        style={{ background: selectedBackground || 'hsl(var(--muted))' }}
                    >
                        <AvatarIcon
                            iconName={selectedIcon}
                            fallbackName={currentName}
                            className="w-2/3 h-2/3"
                            style={{ color: selectedColor || 'hsl(var(--primary-foreground))' }}
                        />
                    </Avatar>
                </div>

                <FormField
                    control={form.control}
                    name="avatarBackground"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fundo do Avatar</FormLabel>
                            <FormControl>
                                <AvatarBackgroundSelector
                                    selectedBackground={field.value}
                                    onSelectBackground={field.onChange}
                                />
                            </FormControl>
                             <FormDescription>
                                Escolha uma cor ou padrão para o fundo.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="photoURL"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ícone do Avatar</FormLabel>
                            <FormControl>
                                <AvatarSelector
                                    selectedAvatar={field.value}
                                    onSelectAvatar={field.onChange}
                                />
                            </FormControl>
                            <FormDescription>
                                Escolha um ícone para o perfil.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="avatarColor"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cor do Ícone</FormLabel>
                            <FormControl>
                                <AvatarColorSelector
                                    selectedColor={field.value}
                                    onSelectColor={field.onChange}
                                />
                            </FormControl>
                             <FormDescription>
                                Escolha uma cor para o ícone do avatar.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                                <Input placeholder="Nome do perfil" {...field} />
                            </FormControl>
                            <FormDescription>
                                Este é o nome de exibição do perfil.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex gap-2 justify-end">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit">Salvar Perfil</Button>
                </div>
            </form>
        </Form>
    );
}

export function ProfileForm({ userProfile }: { userProfile: UserProfile | null }) {
  const { user } = useUser();
  const { setActiveProfile } = useProfile();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  async function handleSave(data: ProfileFormValues) {
    if (!user || !auth || !firestore || !editingProfile) return;

    try {
        const userRef = doc(firestore, "users", user.uid);
        const currentProfiles = userProfile?.profiles || [];
        
        const isNewProfile = !currentProfiles.some(p => p.id === editingProfile.id);
        
        const updatedProfile = { ...editingProfile, ...data };

        let payload: { profiles: Profile[] | any; name?: string } = { profiles: [] };
        let toastTitle = "";

        if (isNewProfile) {
            payload = { profiles: arrayUnion(updatedProfile) };
            toastTitle = "Perfil adicionado!";
        } else {
            const updatedProfiles = currentProfiles.map(p => 
                p.id === editingProfile.id ? updatedProfile : p
            );
            payload = { profiles: updatedProfiles };
            toastTitle = "Perfil atualizado!";
        }

        if (editingProfile.id === user.uid) {
            if (user.displayName !== data.name) {
                await updateProfile(user, { displayName: data.name });
            }
            payload.name = data.name;
        }
        
        await setDoc(userRef, payload, { merge: true });

      toast({
        title: toastTitle,
        description: `As informações do perfil "${updatedProfile.name}" foram salvas.`,
      });
      setEditingProfile(null);
      // If the currently active profile is the one being edited, update it in the context
      if(editingProfile.id === updatedProfile.id) {
        setActiveProfile(updatedProfile);
      }
      router.refresh();

    } catch(error: any) {
        console.error("Error updating profile: ", error);
         toast({
            variant: "destructive",
            title: "Erro ao atualizar o perfil.",
            description: error.message || "Não foi possível salvar as alterações.",
        });
    }
  }

  const handleDeleteProfile = async (profileId: string) => {
    if (!user || !firestore || !userProfile?.profiles) return;
    if (userProfile.profiles.length <= 1) {
        toast({
            variant: "destructive",
            title: "Não é possível remover",
            description: "Você deve ter pelo menos um perfil na conta.",
        });
        return;
    }
     if (profileId === user.uid) {
         toast({
            variant: "destructive",
            title: "Não é possível remover",
            description: "O perfil principal da conta não pode ser removido.",
        });
        return;
    }

    const updatedProfiles = userProfile.profiles.filter(p => p.id !== profileId);
    try {
      const userRef = doc(firestore, "users", user.uid);
      await setDoc(userRef, { profiles: updatedProfiles }, { merge: true });
      toast({
        title: "Perfil removido!",
        description: "O perfil foi removido com sucesso.",
      });
       if(editingProfile?.id === profileId) {
        setEditingProfile(null);
        setActiveProfile(updatedProfiles[0]);
      }
      router.refresh();
    } catch(error: any) {
         toast({
            variant: "destructive",
            title: "Erro ao remover perfil.",
            description: error.message,
        });
    }
  }

  const handleAddNewProfile = () => {
    if (!firestore) return;
    const newId = doc(collection(firestore, '_')).id;
    const newProfile: Profile = {
        id: newId,
        name: "Novo Perfil",
        photoURL: 'Bot',
        avatarColor: 'hsl(0 0% 100%)', // Default icon color to white
        avatarBackground: 'hsl(var(--primary))', // Default background to primary
    };
    setEditingProfile(newProfile);
  }

  return (
    <Dialog open={!!editingProfile} onOpenChange={(isOpen) => !isOpen && setEditingProfile(null)}>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar Perfis</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Adicione ou edite os perfis da sua conta. Todos os perfis compartilham as mesmas finanças.
                    </p>
                </CardHeader>
                <CardContent className="flex flex-wrap justify-center items-start gap-4 sm:gap-8 mt-6">
                    {userProfile?.profiles?.map(profile => (
                         <div key={profile.id} onClick={() => setEditingProfile(profile)} className="group flex cursor-pointer flex-col items-center gap-3 text-muted-foreground transition-all hover:scale-105 hover:text-foreground w-24 sm:w-32" role="button" tabIndex={0}>
                            <div className="relative">
                                <Avatar
                                    className="h-24 w-24 sm:h-32 sm:w-32 rounded-full"
                                    style={{ background: profile.avatarBackground || 'hsl(var(--muted))' }}
                                >
                                    <AvatarIcon
                                        iconName={profile.photoURL}
                                        fallbackName={profile.name}
                                        className="h-12 w-12 sm:h-16 sm:w-16"
                                        style={{ color: profile.avatarColor || 'hsl(var(--primary-foreground))' }}
                                    />
                                </Avatar>
                                <Button 
                                    size="icon" 
                                    variant="destructive" 
                                    className="absolute -top-1 -right-1 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profile.id); }}
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                            <p className="text-lg font-medium text-center truncate w-full">{profile.name}</p>
                        </div>
                    ))}
                    <div onClick={handleAddNewProfile} className="group flex cursor-pointer flex-col items-center gap-3 text-muted-foreground transition-all hover:scale-105 hover:text-foreground w-24 sm:w-32" role="button" tabIndex={0}>
                        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-2 border-dashed border-muted-foreground/50 transition-all group-hover:border-primary bg-transparent flex items-center justify-center group-hover:bg-muted">
                            <Plus className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-lg font-medium">Adicionar Perfil</p>
                    </div>
                </CardContent>
            </Card>
        
            <Separator />
            
            <form>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">Informações da Conta</h3>
                    </div>
                    <div className="space-y-2">
                        <Label>E-mail</Label>
                        <Input value={user?.email || ""} disabled />
                        <p className="text-sm text-muted-foreground">
                            O e-mail da conta não pode ser alterado.
                        </p>
                    </div>
                     <div className="space-y-2">
                         <Label>Redefinir senha</Label>
                         <p className="text-sm text-muted-foreground">
                            Enviaremos um link para o seu e-mail para que você possa escolher uma nova senha para a conta.
                         </p>
                        <Button variant="outline" type="button" onClick={() => user?.email && auth && sendPasswordResetEmail(auth, user.email)} className="mt-2">
                            Enviar e-mail para redefinição de senha
                        </Button>
                    </div>
                </div>
            </form>
        </div>
        {editingProfile && (
            <DialogContent className="sm:max-w-lg w-[90vw] rounded-md">
                 <DialogHeader>
                    <DialogTitle>{editingProfile.id === user?.uid ? 'Editar Perfil Principal' : (userProfile?.profiles?.some(p => p.id === editingProfile.id) ? 'Editar Perfil' : 'Adicionar Novo Perfil')}</DialogTitle>
                    <DialogDescription>
                        Altere as informações do perfil.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[80vh] sm:max-h-[70vh]">
                     <div className="p-1 sm:p-4">
                        <ProfileEditForm 
                            profile={editingProfile}
                            onSave={handleSave}
                            onCancel={() => setEditingProfile(null)}
                        />
                     </div>
                </ScrollArea>
            </DialogContent>
        )}
    </Dialog>
  );
}
