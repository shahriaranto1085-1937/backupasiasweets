import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Plus, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type Ticket = { id: string; subject: string; status: string; created_at: string; updated_at: string; };
type Message = { id: string; message: string; is_admin: boolean; created_at: string; sender_id: string; };
type Notification = { id: string; ticket_id: string; message: string; is_read: boolean; created_at: string; };

const SupportTicketWidget = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'chat' | 'new'>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newFirstMessage, setNewFirstMessage] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    setTickets((data as Ticket[]) || []);
    setLoadingTickets(false);
  };

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).eq('is_read', false).order('created_at', { ascending: false });
    setNotifications((data as Notification[]) || []);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    setMessages((data as Message[]) || []);
  };

  useEffect(() => { if (isOpen && user) { fetchTickets(); fetchNotifications(); } }, [isOpen, user]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const channel = supabase.channel('user-notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => fetchNotifications()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!activeTicket) return;
    fetchMessages(activeTicket.id);
    if (user) {
      supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('ticket_id', activeTicket.id).eq('is_read', false).then(() => fetchNotifications());
    }
    const channel = supabase.channel(`ticket-${activeTicket.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${activeTicket.id}` }, () => fetchMessages(activeTicket.id)).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeTicket]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleCreateTicket = async () => {
    if (!user || !newSubject.trim() || !newFirstMessage.trim()) return;
    setSending(true);
    const { data: ticket, error } = await supabase.from('support_tickets').insert({ user_id: user.id, subject: newSubject.trim() }).select().single();
    if (error || !ticket) { toast({ title: 'Error', description: 'Failed to create ticket', variant: 'destructive' }); setSending(false); return; }
    await supabase.from('ticket_messages').insert({ ticket_id: ticket.id, sender_id: user.id, message: newFirstMessage.trim(), is_admin: false });
    const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (admins) {
      await supabase.from('notifications').insert(admins.map(a => ({ user_id: a.user_id, ticket_id: ticket.id, title: 'New Ticket', message: `New support ticket: "${newSubject.trim()}"` })));
    }
    setNewSubject(''); setNewFirstMessage(''); setActiveTicket(ticket as Ticket); setView('chat'); setSending(false); fetchTickets();
  };

  const handleSendMessage = async () => {
    if (!user || !activeTicket || !newMessage.trim()) return;
    setSending(true);
    await supabase.from('ticket_messages').insert({ ticket_id: activeTicket.id, sender_id: user.id, message: newMessage.trim(), is_admin: false });
    const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (admins) {
      await supabase.from('notifications').insert(admins.map(a => ({ user_id: a.user_id, ticket_id: activeTicket.id, title: 'New Reply', message: `New reply on: "${activeTicket.subject}"` })));
    }
    setNewMessage(''); setSending(false);
  };

  const toggleStatus = async (ticket: Ticket) => {
    const newStatus = ticket.status === 'pending' ? 'solved' : 'pending';
    await supabase.from('support_tickets').update({ status: newStatus }).eq('id', ticket.id);
    if (activeTicket?.id === ticket.id) setActiveTicket({ ...ticket, status: newStatus });
    fetchTickets();
    toast({ title: `Ticket marked as ${newStatus}` });
  };

  const handleWidgetClick = () => {
    if (!user) { navigate('/auth'); return; }
    setIsOpen(!isOpen);
    if (!isOpen) setView('list');
  };

  if (authLoading) return null;

  return (
    <>
      <button onClick={handleWidgetClick} className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:brightness-110 transition-all flex items-center justify-center" aria-label="Support">
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {unreadCount > 0 && !isOpen && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">{unreadCount}</span>}
      </button>

      {isOpen && user && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[500px] bg-card border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-border bg-primary/5 flex items-center gap-3">
            {view !== 'list' && (<button onClick={() => { setView('list'); setActiveTicket(null); }} className="p-1 hover:bg-secondary rounded"><ArrowLeft className="w-4 h-4" /></button>)}
            <h3 className="font-display font-semibold text-foreground flex-1">
              {view === 'list' && 'Support'}{view === 'new' && 'New Complaint'}{view === 'chat' && activeTicket?.subject}
            </h3>
            {view === 'chat' && activeTicket && (<button onClick={() => toggleStatus(activeTicket)} className="text-xs px-2 py-1 rounded-full border border-border hover:bg-secondary transition-colors">{activeTicket.status === 'pending' ? 'Mark Solved' : 'Reopen'}</button>)}
            {view === 'list' && (<button onClick={() => setView('new')} className="p-1.5 rounded-full bg-primary text-primary-foreground hover:brightness-110" aria-label="New ticket"><Plus className="w-4 h-4" /></button>)}
          </div>

          <div className="flex-1 overflow-y-auto">
            {view === 'list' && (
              <div className="p-2">
                {loadingTickets ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div> : tickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm"><MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />No complaints yet</div>
                ) : tickets.map(t => {
                  const hasUnread = notifications.some(n => n.ticket_id === t.id && !n.is_read);
                  return (
                    <button key={t.id} onClick={() => { setActiveTicket(t); setView('chat'); }} className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="font-medium text-sm text-foreground truncate">{t.subject}</span>{hasUnread && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}</div>
                        <span className="text-xs text-muted-foreground">{new Date(t.updated_at).toLocaleDateString()}</span>
                      </div>
                      <Badge variant={t.status === 'solved' ? 'default' : 'secondary'} className="text-[10px] flex-shrink-0">{t.status === 'solved' ? <><CheckCircle className="w-3 h-3 mr-1" />Solved</> : <><Clock className="w-3 h-3 mr-1" />Pending</>}</Badge>
                    </button>
                  );
                })}
              </div>
            )}

            {view === 'new' && (
              <div className="p-4 space-y-3">
                <div><label className="text-xs font-medium text-muted-foreground">Subject</label><input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Brief subject..." className="w-full mt-1 h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" maxLength={100} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Message</label><textarea value={newFirstMessage} onChange={e => setNewFirstMessage(e.target.value)} placeholder="Describe your issue..." className="w-full mt-1 min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" maxLength={1000} /></div>
                <button onClick={handleCreateTicket} disabled={sending || !newSubject.trim() || !newFirstMessage.trim()} className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:brightness-110 transition-all disabled:opacity-50">{sending ? 'Sending...' : 'Submit Complaint'}</button>
              </div>
            )}

            {view === 'chat' && (
              <div className="flex flex-col h-[340px]">
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${m.is_admin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.is_admin ? 'bg-secondary text-foreground' : 'bg-primary text-primary-foreground'}`}>
                        {m.is_admin && <span className="text-[10px] font-semibold block mb-0.5 opacity-70">Admin</span>}
                        <p>{m.message}</p>
                        <span className="text-[10px] opacity-60 block mt-0.5">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {activeTicket?.status !== 'solved' && (
                  <div className="p-3 border-t border-border flex gap-2">
                    <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} placeholder="Type a message..." className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" maxLength={1000} />
                    <button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:brightness-110 disabled:opacity-50"><Send className="w-4 h-4" /></button>
                  </div>
                )}
                {activeTicket?.status === 'solved' && (
                  <div className="p-3 border-t border-border text-center text-xs text-muted-foreground">This ticket is solved. <button onClick={() => activeTicket && toggleStatus(activeTicket)} className="text-primary hover:underline">Reopen</button></div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SupportTicketWidget;
