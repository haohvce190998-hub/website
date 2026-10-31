import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QRCodeCanvas } from 'qrcode.react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clapperboard,
  Clock3,
  CreditCard,
  Download,
  Eye,
  FileText,
  Film,
  Fingerprint,
  KeyRound,
  Lightbulb,
  LockKeyhole,
  LogOut,
  MapPin,
  Network,
  Puzzle,
  ScanLine,
  Search,
  Shield,
  Ticket,
  Upload,
  User,
  X
} from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import './styles.css';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : 'Chưa đặt lịch';
}

function getCountdown(value) {
  if (!value) return 'Chờ lịch mở án';
  const diff = new Date(value).getTime() - Date.now();
  if (diff <= 0) return 'Đang diễn ra hoặc đã kết thúc';

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
  if (hours > 0) return `Còn ${hours} giờ ${minutes} phút`;
  return `Còn ${minutes} phút`;
}

function getStatusLabel(status) {
  const labels = {
    reserved: 'Đã giữ chỗ',
    paid: 'Đã thanh toán',
    checked_in: 'Đã check-in',
    cancelled: 'Đã hủy'
  };
  return labels[status] || status || 'Chưa rõ';
}

function getMysteryLevel(event) {
  const text = `${event.title || ''} ${event.description || ''}`.toLowerCase();
  if (text.includes('khó') || text.includes('cao cấp') || Number(event.ticket_price) >= 500000) return 'Khó';
  if (text.includes('nhập môn') || Number(event.ticket_price) <= 100000) return 'Nhập môn';
  return 'Trung bình';
}

function getCaseCode(event) {
  return String(event?.id || 'pending').slice(0, 8).toUpperCase();
}

function getEventClues(event) {
  const description = event?.description || 'Hồ sơ này chưa công bố lời khai chính thức.';
  const fragments = description
    .split(/[.!?\n]/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  return [
    { label: 'Hiện trường', value: event?.location || 'Địa điểm đang được niêm phong' },
    { label: 'Thời gian', value: formatDate(event?.event_date) },
    { label: 'Dấu hiệu', value: fragments[0] || 'Có chi tiết bất thường trong trailer.' },
    { label: 'Mật danh', value: `CASE-${getCaseCode(event)}` },
    { label: 'Độ khó', value: getMysteryLevel(event) }
  ];
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const isAdmin = profile?.role === 'admin' || profile?.role === 'organizer';

  async function loadAll() {
    setLoading(true);
    setLoadError('');

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const currentSession = sessionData?.session ?? null;
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: p, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        setProfile(p ?? { email: currentSession.user.email, role: 'customer' });

        const { data: myTickets, error: ticketError } = await supabase
          .from('tickets')
          .select('*, events(title, event_date, location, ticket_price)')
          .order('created_at', { ascending: false });
        if (ticketError) throw ticketError;
        setTickets(myTickets ?? []);
      } else {
        setProfile(null);
        setTickets([]);
      }

      const { data: eventRows, error: eventError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      if (eventError) throw eventError;
      setEvents(eventRows ?? []);
    } catch (err) {
      setLoadError(err.message || 'Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    const { data: listener } = supabase.auth.onAuthStateChange(() => loadAll());
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-block">
          <span className="eyebrow"><Fingerprint size={16} /> Hồ sơ vụ án gameshow</span>
          <h1>Detective Ticket Bureau</h1>
          <p>Tự do lần theo manh mối, mở gợi ý khi bế tắc và giữ vé bước vào phòng điều tra trực tiếp.</p>
        </div>

        <div className="account">
          {session ? (
            <>
              <span className="badge"><User size={16} /> {profile?.email}</span>
              <span className="badge role"><Shield size={16} /> {profile?.role}</span>
              <button onClick={signOut} className="ghost"><LogOut size={16} /> Đăng xuất</button>
            </>
          ) : null}
        </div>
      </header>

      {!session ? (
        <Auth />
      ) : loading ? (
        <div className="card loading-card">Đang mở hồ sơ...</div>
      ) : loadError ? (
        <div className="card error-card">
          <h2><AlertTriangle size={20} /> Không mở được hồ sơ</h2>
          <p>{loadError}</p>
          <button onClick={loadAll}>Thử lại</button>
        </div>
      ) : (
        <main className="layout">
          <section>
            <InvestigationLab events={events} tickets={tickets} />
            <EventList events={events} tickets={tickets} reload={loadAll} />
            <MyTickets tickets={tickets} />
          </section>

          <aside>
            {isAdmin ? (
              <AdminPanel events={events} reload={loadAll} />
            ) : (
              <AudiencePanel tickets={tickets} />
            )}
          </aside>
        </main>
      )}
    </div>
  );
}

function Auth() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function runScan() {
    setScanning(true);
    window.setTimeout(() => setScanning(false), 1400);
  }

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    setMessage('');
    setSubmitting(true);
    runScan();

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        setMessage(error ? error.message : 'Đăng ký thành công. Kiểm tra email nếu Supabase đang bật xác minh email.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setMessage(error ? error.message : 'Đăng nhập thành công.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth card">
      <div className={`auth-mark ${scanning ? 'is-scanning' : ''}`}><Fingerprint size={30} /></div>
      <h2>{mode === 'login' ? 'Đăng nhập phòng điều tra' : 'Tạo thẻ tham dự'}</h2>
      <form onSubmit={submit}>
        {mode === 'register' && (
          <label>
            Họ tên
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
          </label>
        )}

        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required />
        </label>

        <label>
          Mật khẩu
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength="6" required />
        </label>

        <button type="submit" disabled={submitting}>
          <ScanLine size={16} /> {submitting ? 'Đang xác thực...' : mode === 'login' ? 'Quét dấu vân tay' : 'Tạo tài khoản'}
        </button>
      </form>

      <button className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
      </button>

      {message && <p className="message">{message}</p>}
    </div>
  );
}

function InvestigationLab({ events, tickets }) {
  const [selectedId, setSelectedId] = useState(events[0]?.id || '');
  const [activeView, setActiveView] = useState('board');
  const [hintLevel, setHintLevel] = useState(0);
  const [decoded, setDecoded] = useState(false);
  const [focusedClue, setFocusedClue] = useState(null);

  useEffect(() => {
    if (!selectedId && events[0]?.id) setSelectedId(events[0].id);
  }, [events, selectedId]);

  const selectedEvent = events.find(event => event.id === selectedId) || events[0];
  const clues = getEventClues(selectedEvent);
  const hasTicket = tickets.some(ticket => ticket.event_id === selectedEvent?.id && ticket.status !== 'cancelled');
  const cipher = getCaseCode(selectedEvent).split('').reverse().join('-');

  const hints = [
    'Cấp 1: Hãy bắt đầu từ thời gian và địa điểm. Hai dữ kiện này thường cho biết nhịp của vụ án.',
    `Cấp 2: Manh mối nổi bật nằm ở "${clues[2]?.value || 'trailer giới thiệu'}".`,
    `Cấp 3: Đối chiếu mật danh CASE-${getCaseCode(selectedEvent)} với vé của bạn để không nhầm hồ sơ.`
  ];

  if (!selectedEvent) {
    return (
      <div className="card investigation-lab">
        <h2><Network size={20} /> Bảng điều tra phi tuyến tính</h2>
        <p className="lead">Chưa có hồ sơ nào để ghim manh mối.</p>
      </div>
    );
  }

  return (
    <div className="card investigation-lab">
      <div className="section-head">
        <h2><Network size={20} /> Bảng điều tra phi tuyến tính</h2>
        <select className="small-select" value={selectedEvent.id} onChange={e => {
          setSelectedId(e.target.value);
          setHintLevel(0);
          setDecoded(false);
          setFocusedClue(null);
        }}>
          {events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}
        </select>
      </div>

      <div className="segments lab-tabs">
        <button className={activeView === 'board' ? 'active' : ''} onClick={() => setActiveView('board')}><FileText size={15} /> Bảng ghim</button>
        <button className={activeView === 'cipher' ? 'active' : ''} onClick={() => setActiveView('cipher')}><Puzzle size={15} /> Giải mã</button>
        <button className={activeView === 'hints' ? 'active' : ''} onClick={() => setActiveView('hints')}><Lightbulb size={15} /> Gợi ý</button>
      </div>

      {activeView === 'board' && (
        <div className="pinboard">
          <svg className="thread-lines" viewBox="0 0 600 260" aria-hidden="true">
            <path d="M90 55 C180 20 245 120 318 92 S455 42 520 128" />
            <path d="M118 190 C215 145 260 220 350 178 S470 165 530 215" />
            <path d="M90 55 L118 190 M318 92 L350 178 M520 128 L530 215" />
          </svg>

          {clues.map((clue, index) => (
            <button
              className={`clue-note note-${index + 1} ${focusedClue === index ? 'focused' : ''}`}
              key={clue.label}
              onClick={() => setFocusedClue(focusedClue === index ? null : index)}
            >
              <span>{clue.label}</span>
              <strong>{clue.value}</strong>
            </button>
          ))}

          <div className={`locked-evidence ${hasTicket ? 'unlocked' : ''}`}>
            <LockKeyhole size={18} />
            <span>{hasTicket ? 'Đã mở khóa: bạn có vé cho hồ sơ này.' : 'Bằng chứng phụ bị làm mờ. Giữ vé để mở khóa.'}</span>
          </div>
        </div>
      )}

      {activeView === 'cipher' && (
        <div className="cipher-panel">
          <div>
            <span className="cipher-label">Chuỗi mã thu được</span>
            <strong className={decoded ? 'decoded' : 'scrambled'}>{decoded ? `CASE-${getCaseCode(selectedEvent)}` : cipher}</strong>
          </div>
          <button onClick={() => setDecoded(!decoded)}><Puzzle size={16} /> {decoded ? 'Mã hóa lại' : 'Giải mã hồ sơ'}</button>
        </div>
      )}

      {activeView === 'hints' && (
        <div className="hint-system">
          <div className="hint-meter">
            <span style={{ width: `${(hintLevel / hints.length) * 100}%` }} />
          </div>
          {hintLevel === 0 ? (
            <p className="lead">Bạn có thể tự suy luận trước. Khi mắc kẹt, mở từng gợi ý theo cấp độ.</p>
          ) : (
            hints.slice(0, hintLevel).map((hint, index) => <p className="hint-card" key={hint}>Gợi ý {index + 1}: {hint.replace(/^Cấp \d: /, '')}</p>)
          )}
          <button onClick={() => setHintLevel(Math.min(hintLevel + 1, hints.length))} disabled={hintLevel >= hints.length}>
            <Lightbulb size={16} /> Mở gợi ý tiếp theo
          </button>
        </div>
      )}
    </div>
  );
}

function EventList({ events, tickets, reload }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [buyingId, setBuyingId] = useState('');

  const myTicketEventIds = useMemo(
    () => new Set(tickets.filter(t => t.status !== 'cancelled').map(t => t.event_id)),
    [tickets]
  );

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const haystack = `${event.title || ''} ${event.description || ''} ${event.location || ''}`.toLowerCase();
      const matchesQuery = haystack.includes(query.trim().toLowerCase());
      const hasVideo = Boolean(event.video_url);
      const hasTicket = myTicketEventIds.has(event.id);
      if (filter === 'video' && !hasVideo) return false;
      if (filter === 'available' && hasTicket) return false;
      return matchesQuery;
    });
  }, [events, filter, myTicketEventIds, query]);

  async function buyTicket(eventId) {
    if (buyingId) return;
    setBuyingId(eventId);

    try {
      const { error } = await supabase.rpc('buy_ticket', { p_event_id: eventId });
      if (error) {
        alert(error.message);
        return;
      }
      alert('Đã giữ vé thành công. Vui lòng xem hướng dẫn thanh toán trong mục vé của bạn.');
      await reload();
    } finally {
      setBuyingId('');
    }
  }

  return (
    <div className="stack">
      <div className="section-head">
        <h2><CalendarDays size={20} /> Hồ sơ gameshow đang mở</h2>
        <span>{filteredEvents.length}/{events.length} hồ sơ</span>
      </div>

      <div className="toolbar card compact-card">
        <label className="search-field">
          <Search size={18} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm theo tên, manh mối, địa điểm..." />
        </label>
        <div className="segments" aria-label="Bộ lọc gameshow">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Tất cả</button>
          <button className={filter === 'video' ? 'active' : ''} onClick={() => setFilter('video')}>Có trailer</button>
          <button className={filter === 'available' ? 'active' : ''} onClick={() => setFilter('available')}>Chưa giữ vé</button>
        </div>
      </div>

      {filteredEvents.length === 0 && <div className="card empty-state">Chưa tìm thấy hồ sơ phù hợp.</div>}

      {filteredEvents.map(event => (
        <article className="card event" key={event.id}>
          <div className="case-label">Hồ sơ #{getCaseCode(event)}</div>
          <div className="event-header">
            <div>
              <h3>{event.title}</h3>
              <p className="redacted-copy">{event.description || 'Chưa có mô tả vụ án.'}</p>
            </div>
            <span className="price">{formatMoney(event.ticket_price)}</span>
          </div>

          <div className="meta">
            <span><Clock3 size={14} /> {getCountdown(event.event_date)}</span>
            <span><CalendarDays size={14} /> {formatDate(event.event_date)}</span>
            <span><MapPin size={14} /> {event.location || 'Chưa cập nhật'}</span>
            <span><Ticket size={14} /> {event.capacity} vé</span>
            <span><AlertTriangle size={14} /> Độ khó: {getMysteryLevel(event)}</span>
          </div>

          {event.video_url ? (
            <video className="video" controls src={event.video_url}></video>
          ) : (
            <div className="video-placeholder"><Clapperboard size={30} /> Chưa có trailer bằng chứng</div>
          )}

          <div className="actions split-actions">
            <button className="ghost" onClick={() => setSelectedEvent(event)}><Eye size={16} /> Xem hồ sơ</button>
            {myTicketEventIds.has(event.id) ? (
              <button disabled>Đã giữ vé</button>
            ) : (
              <button onClick={() => buyTicket(event.id)} disabled={buyingId === event.id}>
                <Ticket size={16} /> {buyingId === event.id ? 'Đang giữ vé...' : 'Giữ vé điều tra'}
              </button>
            )}
          </div>
        </article>
      ))}

      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onBuy={buyTicket} hasTicket={myTicketEventIds.has(selectedEvent.id)} />}
    </div>
  );
}

function EventDetailModal({ event, onClose, onBuy, hasTicket }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal card">
        <button className="icon-button close-button" onClick={onClose} aria-label="Đóng"><X size={18} /></button>
        <div className="case-label">Hồ sơ chi tiết #{getCaseCode(event)}</div>
        <h2>{event.title}</h2>
        <p className="lead">{event.description || 'Hồ sơ này đang được cập nhật thêm manh mối.'}</p>

        <div className="dossier-grid">
          <div><strong>Thời gian mở án</strong><span>{formatDate(event.event_date)}</span></div>
          <div><strong>Địa điểm</strong><span>{event.location || 'Chưa cập nhật'}</span></div>
          <div><strong>Giá vé</strong><span>{formatMoney(event.ticket_price)}</span></div>
          <div><strong>Độ khó suy luận</strong><span>{getMysteryLevel(event)}</span></div>
        </div>

        <div className="clue-board">
          <span><Fingerprint size={16} /> Mã hồ sơ: CASE-{getCaseCode(event)}</span>
          <span><Clock3 size={16} /> {getCountdown(event.event_date)}</span>
          <span><Ticket size={16} /> Sức chứa: {event.capacity} điều tra viên</span>
        </div>

        <div className="actions split-actions">
          <button className="ghost" onClick={onClose}>Đóng hồ sơ</button>
          {hasTicket ? (
            <button disabled>Đã giữ vé</button>
          ) : (
            <button onClick={() => onBuy(event.id)}><Ticket size={16} /> Giữ vé ngay</button>
          )}
        </div>
      </div>
    </div>
  );
}

function MyTickets({ tickets }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const visibleTickets = tickets.filter(ticket => statusFilter === 'all' || ticket.status === statusFilter);

  return (
    <div className="stack">
      <div className="section-head">
        <h2><Ticket size={20} /> Bằng chứng vào cổng</h2>
        <select className="small-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">Tất cả vé</option>
          <option value="reserved">Đã giữ chỗ</option>
          <option value="paid">Đã thanh toán</option>
          <option value="checked_in">Đã check-in</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {visibleTickets.length === 0 && <div className="card empty-state">Bạn chưa có vé phù hợp với bộ lọc này.</div>}

      {visibleTickets.map(ticket => {
        const qrValue = JSON.stringify({
          ticket_code: ticket.ticket_code,
          event_id: ticket.event_id,
          status: ticket.status
        });

        return (
          <div className="card ticket-card" key={ticket.id}>
            <div className="ticket-copy">
              <span className={`status-pill ${ticket.status}`}>{getStatusLabel(ticket.status)}</span>
              <h3>{ticket.events?.title ?? 'Gameshow'}</h3>
              <p>Mã vé: <strong>{ticket.ticket_code}</strong></p>
              <p>Thời gian: {formatDate(ticket.events?.event_date)}</p>
              <p>Địa điểm: {ticket.events?.location ?? 'Chưa cập nhật'}</p>
              {ticket.status === 'reserved' && (
                <div className="payment-note">
                  <CreditCard size={16} />
                  <span>Vé đang giữ chỗ. Hãy thanh toán theo hướng dẫn của ban tổ chức để chuyển sang trạng thái đã thanh toán.</span>
                </div>
              )}
            </div>
            <div className="qr-wrap">
              <QRCodeCanvas value={qrValue} size={120} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AudiencePanel({ tickets }) {
  const reservedCount = tickets.filter(t => t.status === 'reserved').length;
  return (
    <div className="card notice">
      <h2><Search size={20} /> Vai trò khán giả</h2>
      <p>Bạn có thể xem trailer, đọc hồ sơ vụ án, ghim manh mối và giữ vé. Vé đã giữ sẽ hiện QR để đối chiếu tại cổng.</p>
      <div className="side-list">
        <span><Ticket size={16} /> {tickets.length} vé trong hồ sơ cá nhân</span>
        <span><CreditCard size={16} /> {reservedCount} vé chờ thanh toán</span>
        <span><CheckCircle2 size={16} /> QR dùng để check-in tại sự kiện</span>
      </div>
    </div>
  );
}

function AdminPanel({ events, reload }) {
  return (
    <div className="stack">
      <AdminStats events={events} />
      <CreateEvent reload={reload} />
      <UploadVideo events={events} reload={reload} />
      <AdminTicketList />
    </div>
  );
}

function AdminStats({ events }) {
  const totalCapacity = events.reduce((sum, event) => sum + Number(event.capacity || 0), 0);
  const pricedEvents = events.filter(event => Number(event.ticket_price) > 0).length;
  const withVideo = events.filter(event => event.video_url).length;

  return (
    <div className="card">
      <h2><BarChart3 size={20} /> Bảng điều tra nhanh</h2>
      <div className="stats-grid">
        <div><strong>{events.length}</strong><span>Hồ sơ gameshow</span></div>
        <div><strong>{totalCapacity}</strong><span>Tổng sức chứa</span></div>
        <div><strong>{withVideo}</strong><span>Hồ sơ có trailer</span></div>
        <div><strong>{pricedEvents}</strong><span>Hồ sơ đã đặt giá</span></div>
      </div>
    </div>
  );
}

function CreateEvent({ reload }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    capacity: 100,
    ticket_price: 0
  });
  const [submitting, setSubmitting] = useState(false);

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const { data: profile } = await supabase.auth.getUser();

      const payload = {
        ...form,
        capacity: Number(form.capacity),
        ticket_price: Number(form.ticket_price),
        event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
        created_by: profile?.user?.id
      };

      const { error } = await supabase.from('events').insert(payload);
      if (error) {
        alert(error.message);
        return;
      }

      setForm({ title: '', description: '', event_date: '', location: '', capacity: 100, ticket_price: 0 });
      await reload();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2><Shield size={20} /> Admin: Lập hồ sơ gameshow</h2>
      <form onSubmit={submit}>
        <label>Tên gameshow<input value={form.title} onChange={e => setField('title', e.target.value)} required /></label>
        <label>Mô tả vụ án<textarea value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Bối cảnh, manh mối chính, độ khó..." /></label>
        <label>Ngày tổ chức<input type="datetime-local" value={form.event_date} onChange={e => setField('event_date', e.target.value)} /></label>
        <label>Địa điểm<input value={form.location} onChange={e => setField('location', e.target.value)} /></label>
        <label>Tổng số vé<input type="number" min="1" value={form.capacity} onChange={e => setField('capacity', e.target.value)} required /></label>
        <label>Giá vé<input type="number" min="0" value={form.ticket_price} onChange={e => setField('ticket_price', e.target.value)} /></label>
        <button type="submit" disabled={submitting}>{submitting ? 'Đang lập hồ sơ...' : 'Lập hồ sơ'}</button>
      </form>
    </div>
  );
}

function UploadVideo({ events, reload }) {
  const [eventId, setEventId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  async function upload(e) {
    e.preventDefault();

    if (!eventId || !file) {
      alert('Chọn gameshow và video.');
      return;
    }

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      alert('Thiếu Cloudinary config trong file .env');
      return;
    }

    if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type)) {
      alert('Chỉ cho phép video mp4, mov hoặc webm.');
      return;
    }

    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', UPLOAD_PRESET);
      fd.append('folder', 'gameshow-videos');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`, {
        method: 'POST',
        body: fd
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.error?.message || 'Upload failed');

      const { error } = await supabase
        .from('events')
        .update({ video_url: result.secure_url, cloudinary_public_id: result.public_id })
        .eq('id', eventId);

      if (error) throw error;

      alert('Upload video thành công!');
      setFile(null);
      setFileInputKey(prev => prev + 1);
      await reload();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="card">
      <h2><Upload size={20} /> Admin: Gắn trailer bằng chứng</h2>
      <form onSubmit={upload}>
        <label>
          Chọn gameshow
          <select value={eventId} onChange={e => setEventId(e.target.value)} required>
            <option value="">-- Chọn --</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </label>

        <label>
          Video giới thiệu
          <input key={fileInputKey} type="file" accept="video/mp4,video/quicktime,video/webm" onChange={e => setFile(e.target.files?.[0] ?? null)} required />
        </label>

        <button type="submit" disabled={uploading}>
          <Film size={16} /> {uploading ? 'Đang upload...' : 'Upload video'}
        </button>
      </form>
    </div>
  );
}

function AdminTicketList() {
  const [tickets, setTickets] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [checkInCode, setCheckInCode] = useState('');
  const [message, setMessage] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(true);

  async function loadTickets() {
    setLoadingTickets(true);
    const { data, error } = await supabase
      .from('tickets')
      .select('*, profiles(email, full_name), events(title, ticket_price, event_date)')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setTickets(data ?? []);
    }
    setLoadingTickets(false);
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = tickets.filter(ticket => {
    const haystack = `${ticket.ticket_code || ''} ${ticket.status || ''} ${ticket.profiles?.email || ''} ${ticket.profiles?.full_name || ''} ${ticket.events?.title || ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase()) && (status === 'all' || ticket.status === status);
  });

  const revenue = tickets
    .filter(ticket => ticket.status === 'paid' || ticket.status === 'checked_in')
    .reduce((sum, ticket) => sum + Number(ticket.events?.ticket_price || 0), 0);

  async function updateTicketStatus(ticketId, nextStatus) {
    if (updatingId) return false;
    setUpdatingId(ticketId);
    const { error } = await supabase.from('tickets').update({ status: nextStatus }).eq('id', ticketId);
    if (error) {
      alert(error.message);
      setUpdatingId('');
      return false;
    }
    await loadTickets();
    setUpdatingId('');
    return true;
  }

  async function checkInTicket(e) {
    e.preventDefault();
    setMessage('');
    const code = checkInCode.trim();
    if (!code) return;

    const target = tickets.find(ticket => ticket.ticket_code?.toLowerCase() === code.toLowerCase());
    if (!target) {
      setMessage('Không tìm thấy mã vé trong sổ theo dõi.');
      return;
    }
    if (target.status === 'cancelled') {
      setMessage('Vé này đã hủy, không thể check-in.');
      return;
    }
    if (target.status === 'checked_in') {
      setMessage(`Vé ${target.ticket_code} đã check-in trước đó.`);
      return;
    }

    const updated = await updateTicketStatus(target.id, 'checked_in');
    if (updated) {
      setCheckInCode('');
      setMessage(`Đã check-in vé ${target.ticket_code}.`);
    }
  }

  function exportCsv() {
    const headers = ['Khách', 'Gameshow', 'Mã vé', 'Trạng thái', 'Giá vé', 'Ngày tổ chức'];
    const rows = filteredTickets.map(ticket => [
      ticket.profiles?.full_name || ticket.profiles?.email || ticket.user_id,
      ticket.events?.title || '',
      ticket.ticket_code || '',
      getStatusLabel(ticket.status),
      Number(ticket.events?.ticket_price || 0),
      ticket.events?.event_date ? new Date(ticket.events.event_date).toISOString() : ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'so-theo-doi-ve.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card">
      <h2><Fingerprint size={20} /> Admin: Sổ theo dõi vé</h2>

      <div className="admin-summary">
        <div><strong>{tickets.length}</strong><span>Tổng vé</span></div>
        <div><strong>{tickets.filter(t => t.status === 'paid').length}</strong><span>Đã thanh toán</span></div>
        <div><strong>{tickets.filter(t => t.status === 'checked_in').length}</strong><span>Đã check-in</span></div>
        <div><strong>{formatMoney(revenue)}</strong><span>Doanh thu ghi nhận</span></div>
      </div>

      <form className="checkin-box" onSubmit={checkInTicket}>
        <label>
          Check-in bằng mã vé
          <input value={checkInCode} onChange={e => setCheckInCode(e.target.value)} placeholder="Nhập mã vé từ QR hoặc danh sách" />
        </label>
        <button type="submit"><CheckCircle2 size={16} /> Check-in</button>
      </form>
      {message && <p className="message">{message}</p>}

      <div className="table-tools">
        <label className="search-field">
          <Search size={18} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm khách, mã vé, gameshow..." />
        </label>
        <select className="small-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="reserved">Đã giữ chỗ</option>
          <option value="paid">Đã thanh toán</option>
          <option value="checked_in">Đã check-in</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <button className="ghost" onClick={exportCsv} type="button"><Download size={16} /> Xuất CSV</button>
      </div>

      {filteredTickets.length === 0 ? (
        <p>{loadingTickets ? 'Đang tải vé...' : 'Chưa có vé phù hợp.'}</p>
      ) : (
        <div className="table">
          <div className="row head">
            <span>Khách</span>
            <span>Gameshow</span>
            <span>Mã vé</span>
            <span>Trạng thái</span>
            <span>Thao tác</span>
          </div>
          {filteredTickets.map(t => (
            <div className="row admin-row" key={t.id}>
              <span>{t.profiles?.full_name || t.profiles?.email || t.user_id}</span>
              <span>{t.events?.title}</span>
              <span>{t.ticket_code}</span>
              <span><span className={`status-pill ${t.status}`}>{getStatusLabel(t.status)}</span></span>
              <span className="row-actions">
                <button className="mini-button" onClick={() => updateTicketStatus(t.id, 'paid')} disabled={updatingId === t.id || t.status === 'cancelled'}>
                  {updatingId === t.id ? 'Đang cập nhật...' : 'Đã thanh toán'}
                </button>
                <button className="mini-button" onClick={() => updateTicketStatus(t.id, 'checked_in')} disabled={updatingId === t.id || t.status === 'cancelled' || t.status === 'checked_in'}>
                  Check-in
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
