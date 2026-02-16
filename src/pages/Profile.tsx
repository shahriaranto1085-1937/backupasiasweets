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
import { LogOut, Plus, Send } from 'lucide-react';

type Ticket = { id: string; subject: string; status: string; created_at: string; updated_at: string; };
type Message = { id: string; message: string; is_admin: boolean; created_at: string; sender_id: string; };

const formatDate = (iso: string) => { try { return new Date(iso).toLocaleString(); } catch { return iso; } };

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
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const statusBadge = useMemo(() => {
    const s = (activeTicket?.status || '').toLowerCase();
    if (!s) return null;
    return <Badge variant={s === 'solved' ? 'default' : 'secondary'}>{s}</Badge>;
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
    const channel = supabase.channel(`profile-ticket-${activeTicket.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${activeTicket.id}` }, () => fetchMessages(activeTicket.id)).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTicket?.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const handleLogout = async () => { await logout(); toast({ title: 'Logged out' }); navigate('/'); };

  const handleCreateTicket = async () => {
    if (!user) return;
    if (!newSubject.trim() || !newFirstMessage.trim()) { toast({ title: 'Missing info', description: 'Please add a subject and message.', variant: 'destructive' }); return; }
    setCreating(true);
    const { data: ticket, error } = await supabase.from('support_tickets').insert({ user_id: user.id, subject: newSubject.trim() }).select().single();
    if (error || !ticket) { toast({ title: 'Error', description: 'Failed to create ticket', variant: 'destructive' }); setCreating(false); return; }
    await supabase.from('ticket_messages').insert({ ticket_id: ticket.id, sender_id: user.id, message: newFirstMessage.trim(), is_admin: false });
    const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (admins?.length) {
      await supabase.from('notifications').insert(admins.map(a => ({ user_id: a.user_id, ticket_id: ticket.id, title: 'New Ticket', message: `New support ticket: "${newSubject.trim()}"` })));
    }
    setNewSubject(''); setNewFirstMessage(''); setCreating(false); await fetchTickets(); setActiveTicket(ticket as Ticket);
    toast({ title: 'Complaint submitted' });
  };

  const handleSendMessage = async () => {
    if (!user || !activeTicket) return;
    if (!newMessage.trim()) return;
    const msg = newMessage.trim(); setNewMessage('');
    const { error } = await supabase.from('ticket_messages').insert({ ticket_id: activeTicket.id, sender_id: user.id, message: msg, is_admin: false });
    if (error) { toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' }); setNewMessage(msg); return; }
    const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (admins?.length) {
      await supabase.from('notifications').insert(admins.map(a => ({ user_id: a.user_id, ticket_id: activeTicket.id, title: 'New Reply', message: `New reply on: "${activeTicket.subject}"` })));
    }
  };

  if (authLoading) return (<div className="min-h-screen bg-background"><Navbar showSearch={false} /><main className="pt-28 pb-16 container mx-auto px-4">Loading...</main><Footer /></div>);

  return (
    <div className="min-h-screen bg-background">
      <Navbar showSearch={false} />
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
          <Card className="shadow-warm"><CardHeader><CardTitle>Account</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{user?.email}</span></div>
              <div><span className="text-muted-foreground">User ID:</span> <span className="font-mono text-xs">{user?.id}</span></div>
            </CardContent>
          </Card>
        )}

        {tab === 'complaints' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 shadow-warm">
              <CardHeader className="flex-row items-center justify-between"><CardTitle>Tickets</CardTitle><Button variant="outline" size="sm" className="gap-2" onClick={() => setActiveTicket(null)}><Plus className="w-4 h-4" /> New</Button></CardHeader>
              <CardContent className="space-y-3">
                {ticketsLoading ? <p className="text-sm text-muted-foreground">Loading tickets…</p> : tickets.length === 0 ? <p className="text-sm text-muted-foreground">No tickets yet. Create one below.</p> : (
                  <div className="space-y-2">
                    {tickets.map((t) => (
                      <button key={t.id} onClick={() => setActiveTicket(t)} className={`w-full text-left rounded-xl border border-border p-3 hover:bg-secondary/50 transition-colors ${activeTicket?.id === t.id ? 'bg-secondary/50' : ''}`}>
                        <div className="flex items-center justify-between gap-2"><div className="font-medium line-clamp-1">{t.subject}</div><Badge variant={t.status === 'solved' ? 'default' : 'secondary'} className="shrink-0">{t.status}</Badge></div>
                        <div className="text-xs text-muted-foreground mt-1">Updated: {formatDate(t.updated_at)}</div>
                      </button>
                    ))}
                  </div>
                )}
                {!activeTicket && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <div className="text-sm font-medium">Create a new complaint</div>
                    <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Subject (e.g., Delivery issue)" />
                    <Textarea value={newFirstMessage} onChange={(e) => setNewFirstMessage(e.target.value)} placeholder="Describe your issue…" rows={4} />
                    <Button onClick={handleCreateTicket} disabled={creating} className="w-full">{creating ? 'Submitting…' : 'Submit'}</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 shadow-warm">
              <CardHeader className="flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>{activeTicket ? activeTicket.subject : 'Select a ticket'}</CardTitle>
                  {activeTicket && <div className="text-xs text-muted-foreground flex items-center gap-2">{statusBadge}<span>Created: {formatDate(activeTicket.created_at)}</span></div>}
                </div>
              </CardHeader>
              <CardContent>
                {!activeTicket ? <div className="text-sm text-muted-foreground">Pick a ticket from the left to see the full conversation.</div> : (
                  <div className="flex flex-col h-[520px]">
                    <div className="flex-1 overflow-y-auto rounded-xl border border-border p-3 space-y-3">
                      {messagesLoading ? <p className="text-sm text-muted-foreground">Loading messages…</p> : messages.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p> : messages.map((m) => (
                        <div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm border ${m.is_admin ? 'bg-background border-border mr-auto' : 'bg-primary/10 border-primary/20 ml-auto'}`}>
                          <div className="text-[11px] text-muted-foreground mb-1">{m.is_admin ? 'Support' : 'You'} • {formatDate(m.created_at)}</div>
                          <div className="whitespace-pre-wrap">{m.message}</div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your reply…" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                      <Button onClick={handleSendMessage} className="gap-2" disabled={!newMessage.trim()}><Send className="w-4 h-4" /> Send</Button>
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
