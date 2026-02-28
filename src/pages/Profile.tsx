import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Send, ImagePlus, Phone } from 'lucide-react';

type Ticket = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  phone_number?: string;
};

type Message = {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender_id: string;
  image_url?: string | null;
};

const formatDate = (iso: string) => {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

const Profile = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'account' | 'complaints'>('complaints');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newFirstMessage, setNewFirstMessage] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusBadge = useMemo(() => {
    const s = (activeTicket?.status || '').toLowerCase();
    if (!s) return null;
    if (s === 'solved') return <Badge variant="default">solved</Badge>;
    return <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90">pending</Badge>;
  }, [activeTicket?.status]);

  useEffect(() => { if (authLoading) return; if (!user) navigate('/auth'); }, [authLoading, user, navigate]);

  const fetchTickets = async () => {
    if (!user) return;
    setTicketsLoading(true);
    const { data, error } = await supabase.from('support_tickets').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    setTicketsLoading(false);
    if (error) { toast({ title: 'Error', description: 'Failed to load tickets', variant: 'destructive' }); return; }
    setTickets((data as Ticket[]) || []);
  };

  const fetchMessages = async (ticketId: string) => {
    setMessagesLoading(true);
    const { data, error } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    setMessagesLoading(false);
    if (error) { toast({ title: 'Error', description: 'Failed to load messages', variant: 'destructive' }); return; }
    setMessages((data as Message[]) || []);
  };

  useEffect(() => { if (!user) return; fetchTickets(); }, [user]);

  useEffect(() => {
    if (!activeTicket) return;
    fetchMessages(activeTicket.id);
    const channel = supabase.channel(`profile-ticket-${activeTicket.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${activeTicket.id}` }, () => fetchMessages(activeTicket.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTicket?.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const handleLogout = async () => { await logout(); toast({ title: 'Logged out' }); navigate('/'); };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('ticket-attachments').upload(fileName, file);
    if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); return null; }
    const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImageSelect = (file: File | null) => {
    if (!file) { setImageFile(null); setImagePreview(null); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' }); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreateTicket = async () => {
    if (!user) return;
    if (!newSubject.trim() || !newFirstMessage.trim()) { toast({ title: 'Missing info', description: 'Please add a subject and message.', variant: 'destructive' }); return; }
    setCreating(true);

    let imgUrl: string | null = null;
    if (imageFile) { imgUrl = await uploadImage(imageFile); }

    const { data: ticket, error } = await supabase.from('support_tickets').insert({ user_id: user.id, subject: newSubject.trim(), phone_number: newPhone.trim() || null }).select().single();
    if (error || !ticket) { toast({ title: 'Error', description: 'Failed to create ticket', variant: 'destructive' }); setCreating(false); return; }

    await supabase.from('ticket_messages').insert({ ticket_id: ticket.id, sender_id: user.id, message: newFirstMessage.trim(), is_admin: false, image_url: imgUrl });

    const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (admins?.length) {
      await supabase.from('notifications').insert(admins.map(a => ({ user_id: a.user_id, ticket_id: ticket.id, message: `New support ticket: "${newSubject.trim()}"` })));
    }

    setNewSubject(''); setNewFirstMessage(''); setNewPhone(''); setImageFile(null); setImagePreview(null);
    setCreating(false); await fetchTickets(); setActiveTicket(ticket as Ticket);
    toast({ title: 'Complaint submitted' });
  };

  const handleSendMessage = async () => {
    if (!user || !activeTicket) return;
    if (!newMessage.trim() && !imageFile) return;
    const msg = newMessage.trim();
    setNewMessage('');

    let imgUrl: string | null = null;
    if (imageFile) { imgUrl = await uploadImage(imageFile); }

    const { error } = await supabase.from('ticket_messages').insert({ ticket_id: activeTicket.id, sender_id: user.id, message: msg || '📷 Photo', is_admin: false, image_url: imgUrl });
    if (error) { toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' }); setNewMessage(msg); return; }

    setImageFile(null); setImagePreview(null);

    const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (admins?.length) {
      await supabase.from('notifications').insert(admins.map(a => ({ user_id: a.user_id, ticket_id: activeTicket.id, message: `New reply on: "${activeTicket.subject}"` })));
    }
  };

  if (authLoading) {
    return (<div className="min-h-screen bg-background"><Navbar showSearch={false} /><main className="pt-28 pb-16 container mx-auto px-4">Loading...</main><Footer /></div>);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar showSearch={false} />
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e.target.files?.[0] || null)} />

      <main className="pt-28 pb-16 container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="font-display text-2xl sm:text-3xl">Profile</h1>
          <Button variant="outline" onClick={handleLogout} className="gap-2"><LogOut className="w-4 h-4" /> Logout</Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant={tab === 'complaints' ? 'default' : 'outline'} onClick={() => setTab('complaints')}>My Complaints</Button>
          <Button variant={tab === 'account' ? 'default' : 'outline'} onClick={() => setTab('account')}>Account</Button>
        </div>

        {tab === 'account' && (
          <Card className="shadow-warm">
            <CardHeader><CardTitle>Account</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{user?.email}</span></div>
              <div><span className="text-muted-foreground">User ID:</span> <span className="font-mono text-xs">{user?.id}</span></div>
            </CardContent>
          </Card>
        )}

        {tab === 'complaints' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Tickets list + new ticket */}
            <Card className="lg:col-span-1 shadow-warm">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Tickets</CardTitle>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setActiveTicket(null)}><Plus className="w-4 h-4" /> New</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticketsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading tickets…</p>
                ) : tickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tickets yet. Create one below.</p>
                ) : (
                  <div className="space-y-2">
                    {tickets.map((t) => (
                      <button key={t.id} onClick={() => setActiveTicket(t)} className={`w-full text-left rounded-xl border border-border p-3 hover:bg-secondary/50 transition-colors ${activeTicket?.id === t.id ? 'bg-secondary/50' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium line-clamp-1">{t.subject}</div>
                          {t.status === 'solved' ? (
                            <Badge variant="default" className="shrink-0">solved</Badge>
                          ) : (
                            <Badge className="shrink-0 bg-destructive text-destructive-foreground hover:bg-destructive/90">pending</Badge>
                          )}
                        </div>
                        {t.phone_number && <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />{t.phone_number}</div>}
                        <div className="text-xs text-muted-foreground mt-1">Updated: {formatDate(t.updated_at)}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* New ticket form */}
                {!activeTicket && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <div className="text-sm font-medium">Create a new complaint</div>
                    <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Subject (e.g., Delivery issue)" />
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone number" className="pl-9" type="tel" maxLength={20} />
                    </div>
                    <Textarea value={newFirstMessage} onChange={(e) => setNewFirstMessage(e.target.value)} placeholder="Describe your issue…" rows={3} />
                    <div>
                      <button onClick={() => fileInputRef.current?.click()} className="w-full h-9 rounded-lg border border-dashed border-border bg-background flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                        <ImagePlus className="w-4 h-4" />
                        {imageFile ? imageFile.name : 'Attach photo (optional)'}
                      </button>
                      {imagePreview && (
                        <div className="mt-2 relative inline-block">
                          <img src={imagePreview} alt="Preview" className="h-14 rounded-lg object-cover" />
                          <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs">×</button>
                        </div>
                      )}
                    </div>
                    <Button onClick={handleCreateTicket} disabled={creating} className="w-full">{creating ? 'Submitting…' : 'Submit'}</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Chat */}
            <Card className="lg:col-span-2 shadow-warm">
              <CardHeader className="flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>{activeTicket ? activeTicket.subject : 'Select a ticket'}</CardTitle>
                  {activeTicket && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      {statusBadge}
                      <span>Created: {formatDate(activeTicket.created_at)}</span>
                      {activeTicket.phone_number && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{activeTicket.phone_number}</span>}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!activeTicket ? (
                  <div className="text-sm text-muted-foreground">Pick a ticket from the left to see the full conversation.</div>
                ) : (
                  <div className="flex flex-col h-[520px]">
                    <div className="flex-1 overflow-y-auto rounded-xl border border-border p-3 space-y-3">
                      {messagesLoading ? (
                        <p className="text-sm text-muted-foreground">Loading messages…</p>
                      ) : messages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No messages yet.</p>
                      ) : (
                        messages.map((m) => (
                          <div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm border ${m.is_admin ? 'bg-background border-border mr-auto' : 'bg-primary/10 border-primary/20 ml-auto'}`}>
                            <div className="text-[11px] text-muted-foreground mb-1">{m.is_admin ? 'Support' : 'You'} • {formatDate(m.created_at)}</div>
                            {m.image_url && (
                              <a href={m.image_url} target="_blank" rel="noopener noreferrer" className="block mb-1">
                                <img src={m.image_url} alt="Attachment" className="max-h-40 rounded-lg object-cover" />
                              </a>
                            )}
                            <div className="whitespace-pre-wrap">{m.message}</div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="mt-3">
                      {imagePreview && (
                        <div className="mb-2 relative inline-block">
                          <img src={imagePreview} alt="Preview" className="h-14 rounded-lg object-cover" />
                          <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs">×</button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="h-10 w-10 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors flex-shrink-0">
                          <ImagePlus className="w-4 h-4" />
                        </button>
                        <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your reply…" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                        <Button onClick={handleSendMessage} className="gap-2" disabled={!newMessage.trim() && !imageFile}><Send className="w-4 h-4" /> Send</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
