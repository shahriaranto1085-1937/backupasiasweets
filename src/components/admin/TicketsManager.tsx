import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle, Clock, ArrowLeft, Bell } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Ticket = { id: string; user_id: string; subject: string; status: string; created_at: string; updated_at: string; };
type Message = { id: string; message: string; is_admin: boolean; created_at: string; sender_id: string; };
type Notification = { id: string; ticket_id: string; message: string; is_read: boolean; };

const TicketsManager = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'solved'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_tickets' }, () => { fetchTickets(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!activeTicket) return;
    fetchMessages(activeTicket.id);
    if (user) {
      supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('ticket_id', activeTicket.id).eq('is_read', false).then(() => fetchNotifications());
    }
    const channel = supabase.channel(`admin-ticket-${activeTicket.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${activeTicket.id}` }, () => fetchMessages(activeTicket.id)).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTicket]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!user || !activeTicket || !newMessage.trim()) return;
    setSending(true);
    await supabase.from('ticket_messages').insert({ ticket_id: activeTicket.id, sender_id: user.id, message: newMessage.trim(), is_admin: true });
    await supabase.from('notifications').insert({ user_id: activeTicket.user_id, ticket_id: activeTicket.id, title: 'Admin Reply', message: `Admin replied to: "${activeTicket.subject}"` });
    setNewMessage(''); setSending(false);
  };

  const toggleStatus = async (ticket: Ticket) => {
    const newStatus = ticket.status === 'pending' ? 'solved' : 'pending';
    await supabase.from('support_tickets').update({ status: newStatus }).eq('id', ticket.id);
    if (activeTicket?.id === ticket.id) setActiveTicket({ ...ticket, status: newStatus });
    fetchTickets();
    toast({ title: `Ticket marked as ${newStatus}` });
  };

  if (activeTicket) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <button onClick={() => setActiveTicket(null)} className="p-2 hover:bg-secondary rounded-lg"><ArrowLeft className="w-4 h-4" /></button>
          <div className="flex-1"><h3 className="font-display font-semibold">{activeTicket.subject}</h3><p className="text-xs text-muted-foreground">User: {activeTicket.user_id.slice(0, 8)}...</p></div>
          <Badge variant={activeTicket.status === 'solved' ? 'default' : 'secondary'}>{activeTicket.status === 'solved' ? <><CheckCircle className="w-3 h-3 mr-1" />Solved</> : <><Clock className="w-3 h-3 mr-1" />Pending</>}</Badge>
          <Button size="sm" variant="outline" onClick={() => toggleStatus(activeTicket)}>{activeTicket.status === 'pending' ? 'Mark Solved' : 'Reopen'}</Button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm ${m.is_admin ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                {!m.is_admin && <span className="text-[10px] font-semibold block mb-0.5 opacity-70">User</span>}
                {m.is_admin && <span className="text-[10px] font-semibold block mb-0.5 opacity-70">You (Admin)</span>}
                <p>{m.message}</p>
                <span className="text-[10px] opacity-60 block mt-1">{new Date(m.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="pt-3 border-t border-border flex gap-2">
          <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Type your reply..." className="flex-1 h-11 rounded-lg border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" maxLength={1000} />
          <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="h-11 px-4"><Send className="w-4 h-4 mr-2" /> Send</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-semibold">Support Tickets</h2>
        <div className="flex gap-2">
          {(['all', 'pending', 'solved'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>
      {tickets.length === 0 ? <p className="text-muted-foreground text-center py-12">No tickets found</p> : (
        <div className="space-y-2">
          {tickets.map(t => {
            const hasUnread = notifications.some(n => n.ticket_id === t.id && !n.is_read);
            return (
              <button key={t.id} onClick={() => setActiveTicket(t)} className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="font-medium text-foreground truncate">{t.subject}</span>{hasUnread && <Bell className="w-4 h-4 text-primary flex-shrink-0 animate-pulse" />}</div>
                  <p className="text-xs text-muted-foreground mt-1">Created: {new Date(t.created_at).toLocaleDateString()} · Updated: {new Date(t.updated_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={t.status === 'solved' ? 'default' : 'secondary'}>{t.status === 'solved' ? 'Solved' : 'Pending'}</Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TicketsManager;
