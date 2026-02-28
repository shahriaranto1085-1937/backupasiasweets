import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle, Clock, ArrowLeft, Bell, Phone, ImagePlus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  phone_number?: string | null;
};

type Message = {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender_id: string;
  image_url?: string | null;
};

type Notification = {
  id: string;
  ticket_id: string;
  message: string;
  is_read: boolean;
};

const TicketsManager = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'solved'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTickets = async () => {
    let query = supabase.from('support_tickets').select('*').order('updated_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setTickets((data as Ticket[]) || []);
  };

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).eq('is_read', false);
    setNotifications((data as Notification[]) || []);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    setMessages((data as Message[]) || []);
  };

  useEffect(() => { fetchTickets(); fetchNotifications(); }, [filter]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('admin-ticket-notifs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => { fetchNotifications(); fetchTickets(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' }, () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!activeTicket) return;
    fetchMessages(activeTicket.id);
    if (user) { supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('ticket_id', activeTicket.id).eq('is_read', false).then(() => fetchNotifications()); }
    const channel = supabase.channel(`admin-ticket-${activeTicket.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${activeTicket.id}` }, () => fetchMessages(activeTicket.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTicket]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `admin-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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

  const handleSend = async () => {
    if (!user || !activeTicket || (!newMessage.trim() && !imageFile)) return;
    setSending(true);

    let imgUrl: string | null = null;
    if (imageFile) { imgUrl = await uploadImage(imageFile); }

    await supabase.from('ticket_messages').insert({ ticket_id: activeTicket.id, sender_id: user.id, message: newMessage.trim() || '📷 Photo', is_admin: true, image_url: imgUrl });
    await supabase.from('notifications').insert({ user_id: activeTicket.user_id, ticket_id: activeTicket.id, message: `Admin replied to: "${activeTicket.subject}"` });

    setNewMessage(''); setImageFile(null); setImagePreview(null); setSending(false);
  };

  const toggleStatus = async (ticket: Ticket) => {
    const newStatus = ticket.status === 'pending' ? 'solved' : 'pending';
    await supabase.from('support_tickets').update({ status: newStatus }).eq('id', ticket.id);
    if (activeTicket?.id === ticket.id) setActiveTicket({ ...ticket, status: newStatus });
    fetchTickets();
    toast({ title: `Ticket marked as ${newStatus}` });
  };

  const deleteTicket = async (ticket: Ticket) => {
    if (!confirm('Delete this ticket permanently? This will also delete all messages.')) return;

    // Best-effort cleanup (works even if DB does not have cascading deletes)
    const [{ error: mErr }, { error: nErr }, { error: tErr }] = await Promise.all([
      supabase.from('ticket_messages').delete().eq('ticket_id', ticket.id),
      supabase.from('notifications').delete().eq('ticket_id', ticket.id),
      supabase.from('support_tickets').delete().eq('id', ticket.id),
    ]);

    if (mErr || nErr || tErr) {
      toast({
        title: 'Failed to delete ticket',
        description: (mErr || nErr || tErr)?.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Ticket deleted' });
    if (activeTicket?.id === ticket.id) setActiveTicket(null);
    await fetchTickets();
    await fetchNotifications();
  };

  if (activeTicket) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]">
        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e.target.files?.[0] || null)} />

        {/* Header */}
        <div className="pb-4 border-b border-border space-y-2">
          <div className="flex items-center gap-2">
            <button onClick={() => { setActiveTicket(null); setImageFile(null); setImagePreview(null); }} className="p-2 hover:bg-secondary rounded-lg flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="font-display font-semibold text-sm sm:text-base truncate flex-1">{activeTicket.subject}</h3>
            <button
              onClick={() => deleteTicket(activeTicket)}
              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive flex-shrink-0"
              title="Delete ticket"
              aria-label="Delete ticket"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 pl-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">User: {activeTicket.user_id.slice(0, 8)}...</p>
              {activeTicket.phone_number && (
                <a href={`tel:${activeTicket.phone_number}`} className="flex items-center gap-1 text-xs text-primary font-medium mt-0.5">
                  <Phone className="w-3 h-3" />{activeTicket.phone_number}
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {activeTicket.status === 'solved' ? (
                <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Solved</Badge>
              ) : (
                <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
              )}
              <Button size="sm" variant="outline" onClick={() => toggleStatus(activeTicket)} className="text-xs">
                {activeTicket.status === 'pending' ? 'Mark Solved' : 'Reopen'}
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[70%] rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm ${m.is_admin ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                {!m.is_admin && <span className="text-[10px] font-semibold block mb-0.5 opacity-70">User</span>}
                {m.is_admin && <span className="text-[10px] font-semibold block mb-0.5 opacity-70">You (Admin)</span>}
                {m.image_url && (
                  <a href={m.image_url} target="_blank" rel="noopener noreferrer" className="block mb-1">
                    <img src={m.image_url} alt="Attachment" className="max-h-40 rounded-lg object-cover" />
                  </a>
                )}
                <p>{m.message}</p>
                <span className="text-[10px] opacity-60 block mt-1">{new Date(m.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply */}
        <div className="pt-3 border-t border-border">
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-14 rounded-lg object-cover" />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs">×</button>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="h-10 sm:h-11 w-10 sm:w-11 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors flex-shrink-0">
              <ImagePlus className="w-4 h-4" />
            </button>
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Type your reply..." className="flex-1 h-10 sm:h-11 rounded-lg border border-border bg-background px-3 sm:px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" maxLength={1000} />
            <Button onClick={handleSend} disabled={sending || (!newMessage.trim() && !imageFile)} className="h-10 sm:h-11 px-3 sm:px-4">
              <Send className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-display font-semibold">Support Tickets</h2>
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'solved'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tickets.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No tickets found</p>
      ) : (
        <div className="space-y-2">
          {tickets.map(t => {
            const hasUnread = notifications.some(n => n.ticket_id === t.id && !n.is_read);
            return (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveTicket(t)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setActiveTicket(t);
                }}
                className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">{t.subject}</span>
                    {hasUnread && <Bell className="w-4 h-4 text-primary flex-shrink-0 animate-pulse" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created: {new Date(t.created_at).toLocaleDateString()} · Updated: {new Date(t.updated_at).toLocaleDateString()}
                  </p>
                  {t.phone_number && (
                    <a href={`tel:${t.phone_number}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-1">
                      <Phone className="w-3 h-3" />{t.phone_number}
                    </a>
                  )}
                </div>
                {t.status === 'solved' ? (
                  <Badge variant="default">Solved</Badge>
                ) : (
                  <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Pending</Badge>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTicket(t);
                  }}
                  className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:border-destructive/40 hover:bg-destructive/10 text-destructive"
                  title="Delete ticket"
                  aria-label="Delete ticket"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TicketsManager;
