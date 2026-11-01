const CONFIG = window.THAM_CHINH_CONFIG || {};
let authMode = "login";
let selectedCharacterIndex = 0;
const routeSectionIds = new Set([
  "case",
  "suspects",
  "clues",
  "videos",
  "discussion",
  "leaderboard",
  "detective-profile",
  "admin"
]);

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function getActiveRouteId() {
  const id = decodeURIComponent(window.location.hash.replace("#", ""));
  return routeSectionIds.has(id) ? id : "";
}

function applyRouteView(scrollTop = false) {
  const activeRouteId = getActiveRouteId();
  const isRouteView = Boolean(activeRouteId);

  document.body.classList.toggle("home-view", !isRouteView);
  document.body.classList.toggle("route-view", isRouteView);

  document.querySelectorAll("main > .section").forEach(section => {
    section.classList.toggle("active-route-section", section.id === activeRouteId);
  });

  document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
    link.classList.toggle("active-nav", link.getAttribute("href") === `#${activeRouteId}`);
  });
  document.querySelectorAll("[data-home-link]").forEach(link => {
    link.classList.toggle("active-nav", !isRouteView);
  });

  if (scrollTop) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
}

window.addEventListener("load", () => {
  applyRouteView(true);
});

window.addEventListener("hashchange", () => {
  applyRouteView(true);
});

window.addEventListener("popstate", () => {
  applyRouteView(true);
});

function initDetectiveModel() {
  const model = document.getElementById("detectiveModel");
  if (!model) return;

  let frameId = 0;
  let nextX = 0;
  let nextY = 0;

  function updateModel() {
    model.style.setProperty("--mx", nextX.toFixed(3));
    model.style.setProperty("--my", nextY.toFixed(3));
    frameId = 0;
  }

  window.addEventListener("pointermove", event => {
    const x = (event.clientX / window.innerWidth - 0.5) * 2;
    const y = (event.clientY / window.innerHeight - 0.5) * 2;

    nextX = Math.max(-1, Math.min(1, x));
    nextY = Math.max(-1, Math.min(1, y));

    if (!frameId) {
      frameId = window.requestAnimationFrame(updateModel);
    }
  });

  window.addEventListener("pointerleave", () => {
    nextX = 0;
    nextY = 0;
    if (!frameId) {
      frameId = window.requestAnimationFrame(updateModel);
    }
  });
}

const defaultSuspects = [
  {
    name: "Khang",
    role: "Thám tử chính",
    suspicion: "Khang là người dẫn dắt điều tra, kiểm tra lời khai và tìm sơ hở của Cường.",
    statement: "Tôi sẽ bắt đầu từ lời khai của người báo án, vì người đến đầu tiên thường biết nhiều hơn họ nói.",
    background: "Bình tĩnh, quan sát kỹ hiện trường và luôn đối chiếu lời khai với bằng chứng vật lý.",
    clues: [
      "Ghi nhận Cường là người đầu tiên xuất hiện ở hiện trường.",
      "Phát hiện mốc thời gian trong lời khai của Cường không khớp với video.",
      "Đặt câu hỏi lặp lại để kiểm tra các chi tiết bị thay đổi."
    ],
    status: "Đầu mối điều tra",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=900&auto=format&fit=crop",
    className: ""
  },
  {
    name: "Cường",
    role: "Người báo án, hung thủ cuối cùng",
    suspicion: "Báo án để kiểm soát hướng điều tra, tạo chứng cứ giả và che giấu hành vi thật.",
    statement: "Tôi chỉ thấy một bóng người rời khỏi hiện trường rồi chạy đi báo ngay cho mọi người.",
    background: "Tỏ ra hoảng loạn để nhận vai người giúp điều tra, nhưng lại biết nhiều chi tiết chưa từng được công bố.",
    clues: [
      "Lời khai thay đổi khi bị hỏi lại về thời gian.",
      "Vật chứng phụ xuất hiện trong balo của Cường.",
      "Biết vị trí vật chứng trước khi Khang công bố phát hiện."
    ],
    status: "Nhân vật cần chú ý nhất",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=900&auto=format&fit=crop",
    className: "hunter"
  },
  {
    name: "Nhân chứng phụ",
    role: "Người nhìn thấy một phần hiện trường",
    suspicion: "Lời khai giúp Khang phát hiện Cường nói dối.",
    statement: "Tôi không thấy rõ mặt người đó, nhưng thời điểm tôi nghe tiếng động không giống lời Cường kể.",
    background: "Có mặt gần khu vực xảy ra vụ việc và cung cấp mốc thời gian độc lập cho đội điều tra.",
    clues: [
      "Xác nhận có tiếng động trước lúc Cường báo án.",
      "Không nhìn rõ hung thủ nhưng nhớ hướng di chuyển.",
      "Giúp Khang thu hẹp khoảng thời gian vật chứng biến mất."
    ],
    status: "Nhân chứng hỗ trợ",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=900&auto=format&fit=crop",
    className: ""
  }
];

function cloneDefaultCharacters() {
  return defaultSuspects.map(character => ({
    ...character,
    clues: [...character.clues]
  }));
}

function getUsers() {
  return JSON.parse(localStorage.getItem("thamChinhUsers")) || [];
}

function saveUsers(users) {
  localStorage.setItem("thamChinhUsers", JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("thamChinhCurrentUser"));
}

function setCurrentUser(user) {
  localStorage.setItem("thamChinhCurrentUser", JSON.stringify(user));
}

function addPoints(email, points) {
  if (!email) return;
  const users = getUsers();
  const index = users.findIndex(u => u.email === email);
  if (index !== -1) {
    users[index].points = (users[index].points || 0) + points;
    saveUsers(users);

    const current = getCurrentUser();
    if (current && current.email === email) {
      current.points = users[index].points;
      setCurrentUser(current);
    }
  }

  renderProfile();
  renderLeaderboard();
}

function getRank(points) {
  if (points >= 800) return "Thám tử trưởng";
  if (points >= 300) return "Điều tra viên cao cấp";
  if (points >= 100) return "Điều tra viên";
  return "Tập sự phá án";
}

function getDisplayName(user) {
  const name = (user?.name || "").trim();
  const email = (user?.email || "").trim().toLowerCase();
  const emailName = email.split("@")[0];

  if (!name || name.toLowerCase() === emailName) {
    return "Điều tra viên";
  }

  return name;
}

function normalizeAccountName(name) {
  return (name || "").trim().replace(/\s+/g, " ");
}

function isSameAccountName(firstName, secondName) {
  return normalizeAccountName(firstName).toLowerCase() === normalizeAccountName(secondName).toLowerCase();
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function openAuth(mode) {
  authMode = mode;
  document.getElementById("authModal").classList.remove("hidden");
  document.getElementById("authTitle").innerText = mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản";

  const nameInput = document.getElementById("authName");
  const nameLabel = document.getElementById("authNameLabel");

  if (mode === "register") {
    nameInput.classList.remove("hidden");
    nameLabel.classList.remove("hidden");
    nameInput.required = true;
  } else {
    nameInput.classList.add("hidden");
    nameLabel.classList.add("hidden");
    nameInput.required = false;
  }
}

function closeAuth() {
  document.getElementById("authModal").classList.add("hidden");
  document.getElementById("authForm").reset();
}

async function handleAuth(event) {
  event.preventDefault();

  const name = document.getElementById("authName").value.trim();
  const email = document.getElementById("authEmail").value.trim().toLowerCase();
  const password = document.getElementById("authPassword").value.trim();
  const client = getSupabaseClient();
  if (!client) {
    alert("Chưa kết nối được Supabase Auth.");
    return;
  }

  if (authMode === "register") {
    const cleanName = normalizeAccountName(name);
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: cleanName } }
    });
    if (error) {
      alert(error.message);
      return;
    }
    if (!data.session) {
      alert("Đăng ký thành công. Hãy kiểm tra email xác nhận rồi đăng nhập.");
      closeAuth();
      return;
    }
    await setCurrentUserFromSupabase(data.user);
    alert("Đăng ký và đăng nhập thành công!");
  } else {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      alert("Email hoặc mật khẩu không chính xác.");
      return;
    }
    await setCurrentUserFromSupabase(data.user);
    alert("Đăng nhập thành công!");
  }

  closeAuth();
  refreshAuthUI();
}

async function setCurrentUserFromSupabase(authUser) {
  const client = getSupabaseClient();
  const { data: profile, error } = await client
    .from("profiles")
    .select("email, full_name, role")
    .eq("id", authUser.id)
    .single();
  if (error) throw error;

  const user = {
    id: authUser.id,
    name: profile.full_name || authUser.user_metadata?.full_name || authUser.email.split("@")[0],
    email: profile.email || authUser.email,
    role: profile.role || "customer",
    points: 0
  };
  setCurrentUser(user);

  const users = getUsers().filter(item => item.email !== user.email);
  users.push(user);
  localStorage.setItem("thamChinhUsers", JSON.stringify(users));
  return user;
}

async function restoreSupabaseAuth() {
  const client = getSupabaseClient();
  if (!client) return;
  const { data } = await client.auth.getSession();
  if (!data.session?.user) {
    localStorage.removeItem("thamChinhCurrentUser");
    return;
  }
  await setCurrentUserFromSupabase(data.session.user);
}

async function logout() {
  const client = getSupabaseClient();
  if (client) await client.auth.signOut();
  localStorage.removeItem("thamChinhCurrentUser");
  refreshAuthUI();
}

function refreshAuthUI() {
  const current = getCurrentUser();
  const isAdmin = current && current.role === "admin";

  document.getElementById("openLoginBtn").classList.toggle("hidden", !!current);
  document.getElementById("openRegisterBtn").classList.toggle("hidden", !!current);
  document.getElementById("logoutBtn").classList.toggle("hidden", !current);
  document.getElementById("uploadPanel").classList.toggle("hidden", !isAdmin);
  document.getElementById("admin").classList.toggle("hidden", !isAdmin);
  document.querySelector('a[href="#admin"]').classList.toggle("hidden", !isAdmin);

  renderProfile();
  renderLeaderboard();
  renderComments();
  renderAdminPanel();
}

function renderProfile() {
  const box = document.getElementById("profileBox");
  const user = getCurrentUser();

  if (!user) {
    box.innerHTML = `
      <h3>Khách truy cập</h3>
      <p>Bạn chưa đăng nhập. Hãy đăng ký để trở thành điều tra viên hỗ trợ Khang phá án.</p>
    `;
    return;
  }

  box.innerHTML = `
    <h3>${getDisplayName(user)}</h3>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Vai trò:</strong> ${user.role === "admin" ? "Quản trị viên" : "Điều tra viên"}</p>
    <p><strong>Điểm suy luận:</strong> ${user.points || 0}</p>
    <p><strong>Cấp bậc:</strong> ${getRank(user.points || 0)}</p>
    <p><strong>Nhiệm vụ:</strong> Hỗ trợ Khang tìm ra bằng chứng chứng minh Cường là hung thủ.</p>
  `;
}

function normalizeCharacter(character) {
  const clues = Array.isArray(character.clues)
    ? character.clues
    : String(character.clues || "").split("\n");

  return {
    name: (character.name || "").trim(),
    role: (character.role || "").trim(),
    suspicion: (character.suspicion || "").trim(),
    statement: (character.statement || "").trim(),
    background: (character.background || "").trim(),
    clues: clues.map(clue => clue.trim()).filter(Boolean),
    status: (character.status || "").trim(),
    image: (character.image || "").trim(),
    className: character.className === "hunter" ? "hunter" : ""
  };
}

function getCharacters() {
  const storedCharacters = JSON.parse(localStorage.getItem("thamChinhCharacters")) || [];
  if (storedCharacters.length) {
    return storedCharacters.map(normalizeCharacter).filter(character => character.name);
  }

  const defaults = cloneDefaultCharacters();
  localStorage.setItem("thamChinhCharacters", JSON.stringify(defaults));
  return defaults;
}

function saveCharacters(characters) {
  const normalizedCharacters = characters.map(normalizeCharacter).filter(character => character.name);
  localStorage.setItem("thamChinhCharacters", JSON.stringify(normalizedCharacters));
  saveSupabaseCharacters(normalizedCharacters).catch(error => {
    console.warn(`Không đồng bộ được hồ sơ nhân vật lên Supabase: ${error.message}`);
  });
}

function renderSuspects() {
  const grid = document.getElementById("suspectGrid");
  const characters = getCharacters();
  grid.innerHTML = "";

  if (!characters.length) {
    document.getElementById("characterDetail").innerHTML = "";
    grid.innerHTML = `<div class="empty-video-message"><h3>Chưa có hồ sơ nhân vật</h3></div>`;
    return;
  }

  if (selectedCharacterIndex >= characters.length) selectedCharacterIndex = 0;

  characters.forEach((s, index) => {
    const card = document.createElement("article");
    card.className = `suspect-card ${s.className} ${index === selectedCharacterIndex ? "active" : ""}`;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Xem hồ sơ chi tiết của ${s.name}`);
    card.innerHTML = `
      <img src="${s.image}" alt="${s.name}">
      <h3>${s.name}</h3>
      <p><strong>Vai trò:</strong> ${s.role}</p>
      <p><strong>Hồ sơ:</strong> ${s.suspicion}</p>
    `;
    card.addEventListener("click", () => selectCharacter(index));
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCharacter(index);
      }
    });
    grid.appendChild(card);
  });

  renderCharacterDetail(characters[selectedCharacterIndex]);
}

function selectCharacter(index) {
  selectedCharacterIndex = index;
  renderSuspects();
}

function getCharacterInterview(videos, characterName) {
  return videos.find(video => video.sourceType === "interview" && video.characterName === characterName);
}

async function renderCharacterDetail(character) {
  const detail = document.getElementById("characterDetail");
  if (!detail) return;
  if (!character) {
    detail.innerHTML = "";
    return;
  }

  const videos = await getVideos();
  const interview = getCharacterInterview(videos, character.name);
  const interviewMarkup = interview?.embedUrl
    ? `
      <iframe
        class="character-interview-video"
        src="${interview.embedUrl}"
        title="Video phỏng vấn ${character.name}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
      <p><strong>${interview.title}</strong></p>
      ${interview.desc ? `<p>${interview.desc}</p>` : ""}
    `
    : `
      <div class="character-interview-empty">
        <h4>Video phỏng vấn</h4>
        <p>Chưa có video phỏng vấn cho nhân vật này.</p>
      </div>
    `;

  detail.innerHTML = `
    <div class="character-info">
      <span class="badge">${character.status}</span>
      <h3>Hồ sơ chi tiết: ${character.name}</h3>
      <p><strong>Vai trò:</strong> ${character.role}</p>
      <p><strong>Bối cảnh:</strong> ${character.background}</p>
      <p><strong>Lời khai:</strong> ${character.statement}</p>
      <h4>Manh mối liên quan</h4>
      <ul>
        ${character.clues.map(clue => `<li>${clue}</li>`).join("")}
      </ul>
    </div>

    <div class="character-interview">
      <h4>Video phỏng vấn</h4>
      ${interviewMarkup}
    </div>
  `;
}

function getLocalVideos() {
  const uploaded = JSON.parse(localStorage.getItem("thamChinhVideos")) || [];
  return uploaded.filter(video => video.url && !video.url.startsWith("blob:"));
}

function isSupabaseConfigured() {
  const supabaseConfig = CONFIG.supabase || {};
  return !!(supabaseConfig.url && supabaseConfig.anonKey && supabaseConfig.bucket);
}

function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  const supabaseSDK = window.supabase || window.supabaseJs;

  if (!supabaseSDK?.createClient) {
    throw new Error("Chưa tải được Supabase SDK. Vui lòng kiểm tra mạng hoặc reload trang.");
  }

  if (!window.thamChinhSupabaseClient) {
    window.thamChinhSupabaseClient = supabaseSDK.createClient(
      CONFIG.supabase.url,
      CONFIG.supabase.anonKey
    );
  }

  return window.thamChinhSupabaseClient;
}

function getSupabaseBucket() {
  return CONFIG.supabase?.bucket || "videos";
}

function getSupabaseBucketCandidates() {
  const configuredBucket = getSupabaseBucket();
  return [...new Set([
    configuredBucket,
    configuredBucket.toLowerCase(),
    configuredBucket.toUpperCase(),
    "videos",
    "VIDEOS"
  ])];
}

function getSupabaseFolder() {
  return CONFIG.supabase?.folder || "uploads";
}

function getSupabaseManifestPath() {
  return CONFIG.supabase?.manifestPath || "index.json";
}

function getSupabaseUsersPath() {
  return CONFIG.supabase?.usersPath || "users.json";
}

function getSupabaseCommentsPath() {
  return CONFIG.supabase?.commentsPath || "comments.json";
}

function getSupabaseCharactersPath() {
  return CONFIG.supabase?.charactersPath || "characters.json";
}

function getSupabaseMaxFileSizeMB() {
  return Number(CONFIG.supabase?.maxFileSizeMB || 50);
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return "0MB";
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function getSupabaseUploadErrorMessage(error) {
  const message = error?.message || "Không rõ lỗi";

  if (message.toLowerCase().includes("maximum allowed size")) {
    return `Video vượt quá giới hạn dung lượng của bucket Supabase. Hãy tăng File size limit trong Storage bucket hoặc chọn video nhỏ hơn.`;
  }

  if (message.toLowerCase().includes("bucket not found")) {
    return "Không tìm thấy bucket Supabase. Hãy kiểm tra tên bucket trong config.js và Supabase Storage.";
  }

  return `${message}. Hãy kiểm tra bucket public và Storage policies.`;
}

function getSupabaseProjectRef() {
  const match = (CONFIG.supabase?.url || "").match(/^https:\/\/([^.]+)\.supabase\.co/i);
  return match ? match[1] : "";
}

async function getSupabaseVideos() {
  const client = getSupabaseClient();
  if (!client) return [];

  for (const bucket of getSupabaseBucketCandidates()) {
    const { data, error } = await client.storage
      .from(bucket)
      .download(getSupabaseManifestPath());

    if (error) {
      if (error.message?.toLowerCase().includes("bucket not found")) continue;
      if (error.statusCode === "404" || error.message?.includes("not found")) return [];
      throw new Error(`Không tải được danh sách video từ Supabase: ${error.message}`);
    }

    const text = await data.text();
    if (!text.trim()) return [];

    return JSON.parse(text)
      .filter(video => video.url && !video.url.startsWith("blob:"))
      .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  }

  throw new Error("Không tìm thấy bucket Supabase. Hãy kiểm tra tên bucket là videos hoặc VIDEOS.");
}

async function saveSupabaseVideos(videos, preferredBucket = "") {
  const client = getSupabaseClient();
  if (!client) return false;

  const file = new Blob([JSON.stringify(videos, null, 2)], {
    type: "application/json"
  });

  const buckets = preferredBucket
    ? [preferredBucket, ...getSupabaseBucketCandidates()]
    : getSupabaseBucketCandidates();

  for (const bucket of [...new Set(buckets)]) {
    const { error } = await client.storage
      .from(bucket)
      .upload(getSupabaseManifestPath(), file, {
        cacheControl: "0",
        contentType: "application/json",
        upsert: true
      });

    if (!error) return true;
    if (!error.message?.toLowerCase().includes("bucket not found")) {
      throw new Error(`Không lưu được danh sách video vào Supabase: ${error.message}`);
    }
  }

  throw new Error("Không tìm thấy bucket Supabase để lưu danh sách video.");
}

function normalizeUser(user) {
  return {
    ...user,
    email: (user.email || "").trim().toLowerCase(),
    points: Number(user.points || 0)
  };
}

function mergeUsers(localUsers, remoteUsers) {
  const byEmail = new Map();

  [...remoteUsers, ...localUsers].forEach(rawUser => {
    const user = normalizeUser(rawUser);
    if (!user.email) return;

    const current = byEmail.get(user.email);
    byEmail.set(user.email, {
      ...current,
      ...user,
      points: Math.max(current?.points || 0, user.points || 0)
    });
  });

  return [...byEmail.values()];
}

async function getSupabaseUsers() {
  if (!isSupabaseConfigured()) return [];

  const client = getSupabaseClient();
  for (const bucket of getSupabaseBucketCandidates()) {
    const { data, error } = await client.storage
      .from(bucket)
      .download(getSupabaseUsersPath());

    if (error) {
      if (error.message?.toLowerCase().includes("bucket not found")) continue;
      if (error.statusCode === "404" || error.message?.includes("not found")) return [];
      throw new Error(`Không tải được danh sách tài khoản từ Supabase: ${error.message}`);
    }

    const text = await data.text();
    if (!text.trim()) return [];
    return JSON.parse(text);
  }

  return [];
}

async function saveSupabaseUsers(users) {
  if (!isSupabaseConfigured()) return false;

  const client = getSupabaseClient();
  const file = new Blob([JSON.stringify(users.map(normalizeUser), null, 2)], {
    type: "application/json"
  });

  for (const bucket of getSupabaseBucketCandidates()) {
    const { error } = await client.storage
      .from(bucket)
      .upload(getSupabaseUsersPath(), file, {
        cacheControl: "0",
        contentType: "application/json",
        upsert: true
      });

    if (!error) return true;
    if (!error.message?.toLowerCase().includes("bucket not found")) {
      throw new Error(`Không lưu được danh sách tài khoản vào Supabase: ${error.message}`);
    }
  }

  return false;
}

async function syncUsersFromSupabase() {
  const localUsers = getUsers();
  if (!isSupabaseConfigured()) return localUsers;

  try {
    const remoteUsers = await getSupabaseUsers();
    const mergedUsers = mergeUsers(localUsers, remoteUsers);
    localStorage.setItem("thamChinhUsers", JSON.stringify(mergedUsers));
    const current = getCurrentUser();
    const syncedCurrent = mergedUsers.find(user => user.email === current?.email);
    if (syncedCurrent) setCurrentUser(syncedCurrent);
    if (mergedUsers.length !== remoteUsers.length) {
      await saveSupabaseUsers(mergedUsers);
    }
    return mergedUsers;
  } catch (error) {
    console.warn(`Không đồng bộ được tài khoản từ Supabase: ${error.message}`);
    return localUsers;
  }
}

function normalizeComment(comment) {
  const createdAtMs = Number(comment.createdAtMs || 0) || Date.now();
  return {
    ...comment,
    id: comment.id || `${comment.userEmail || "guest"}-${createdAtMs}-${String(comment.text || "").slice(0, 24)}`,
    userEmail: (comment.userEmail || "").trim().toLowerCase(),
    createdAtMs
  };
}

function mergeComments(localComments, remoteComments) {
  const byId = new Map();

  [...remoteComments, ...localComments].forEach(rawComment => {
    const comment = normalizeComment(rawComment);
    if (!comment.text) return;
    byId.set(comment.id, {
      ...byId.get(comment.id),
      ...comment
    });
  });

  return [...byId.values()].sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
}

async function getSupabaseComments() {
  if (!isSupabaseConfigured()) return [];

  const client = getSupabaseClient();
  for (const bucket of getSupabaseBucketCandidates()) {
    const { data, error } = await client.storage
      .from(bucket)
      .download(getSupabaseCommentsPath());

    if (error) {
      if (error.message?.toLowerCase().includes("bucket not found")) continue;
      if (error.statusCode === "404" || error.message?.includes("not found")) return [];
      throw new Error(`Không tải được danh sách bình luận từ Supabase: ${error.message}`);
    }

    const text = await data.text();
    if (!text.trim()) return [];
    return JSON.parse(text);
  }

  return [];
}

async function saveSupabaseComments(comments) {
  if (!isSupabaseConfigured()) return false;

  const client = getSupabaseClient();
  const file = new Blob([JSON.stringify(comments.map(normalizeComment), null, 2)], {
    type: "application/json"
  });

  for (const bucket of getSupabaseBucketCandidates()) {
    const { error } = await client.storage
      .from(bucket)
      .upload(getSupabaseCommentsPath(), file, {
        cacheControl: "0",
        contentType: "application/json",
        upsert: true
      });

    if (!error) return true;
    if (!error.message?.toLowerCase().includes("bucket not found")) {
      throw new Error(`Không lưu được danh sách bình luận vào Supabase: ${error.message}`);
    }
  }

  return false;
}

async function syncCommentsFromSupabase() {
  const localComments = getComments();
  if (!isSupabaseConfigured()) return localComments;

  try {
    const remoteComments = await getSupabaseComments();
    const mergedComments = mergeComments(localComments, remoteComments);
    localStorage.setItem("thamChinhComments", JSON.stringify(mergedComments));
    if (mergedComments.length !== remoteComments.length) {
      await saveSupabaseComments(mergedComments);
    }
    return mergedComments;
  } catch (error) {
    console.warn(`Không đồng bộ được bình luận từ Supabase: ${error.message}`);
    return localComments;
  }
}

async function getSupabaseCharacters() {
  if (!isSupabaseConfigured()) return [];

  const client = getSupabaseClient();
  for (const bucket of getSupabaseBucketCandidates()) {
    const { data, error } = await client.storage
      .from(bucket)
      .download(getSupabaseCharactersPath());

    if (error) {
      if (error.message?.toLowerCase().includes("bucket not found")) continue;
      if (error.statusCode === "404" || error.message?.includes("not found")) return [];
      throw new Error(`Không tải được hồ sơ nhân vật từ Supabase: ${error.message}`);
    }

    const text = await data.text();
    if (!text.trim()) return [];
    return JSON.parse(text).map(normalizeCharacter).filter(character => character.name);
  }

  return [];
}

async function saveSupabaseCharacters(characters) {
  if (!isSupabaseConfigured()) return false;

  const client = getSupabaseClient();
  const file = new Blob([JSON.stringify(characters.map(normalizeCharacter), null, 2)], {
    type: "application/json"
  });

  for (const bucket of getSupabaseBucketCandidates()) {
    const { error } = await client.storage
      .from(bucket)
      .upload(getSupabaseCharactersPath(), file, {
        cacheControl: "0",
        contentType: "application/json",
        upsert: true
      });

    if (!error) return true;
    if (!error.message?.toLowerCase().includes("bucket not found")) {
      throw new Error(`Không lưu được hồ sơ nhân vật vào Supabase: ${error.message}`);
    }
  }

  return false;
}

async function syncCharactersFromSupabase() {
  const localCharacters = getCharacters();
  if (!isSupabaseConfigured()) return localCharacters;

  try {
    const remoteCharacters = await getSupabaseCharacters();
    const characters = remoteCharacters.length ? remoteCharacters : localCharacters;
    localStorage.setItem("thamChinhCharacters", JSON.stringify(characters));
    if (!remoteCharacters.length && characters.length) {
      await saveSupabaseCharacters(characters);
    }
    return characters;
  } catch (error) {
    console.warn(`Không đồng bộ được hồ sơ nhân vật từ Supabase: ${error.message}`);
    return localCharacters;
  }
}

async function getVideos() {
  if (!isSupabaseConfigured()) return getLocalVideos();

  try {
    return await getSupabaseVideos();
  } catch (error) {
    console.warn(error.message);
    return getLocalVideos();
  }
}

async function saveVideo(video) {
  if (isSupabaseConfigured()) {
    try {
      const videos = await getSupabaseVideos();
      videos.unshift(video);
      await saveSupabaseVideos(videos, video.bucket);
      return;
    } catch (error) {
      console.warn(`Không lưu được video lên Supabase, chuyển sang lưu local: ${error.message}`);
    }
  }

  const videos = getLocalVideos();
  videos.unshift(video);
  localStorage.setItem("thamChinhVideos", JSON.stringify(videos));
}

function getVideoKey(video) {
  return [
    video.sourceType || "",
    video.title || "",
    video.createdAtMs || "",
    video.publicId || "",
    video.url || ""
  ].join("|");
}

async function replaceVideos(videos) {
  if (isSupabaseConfigured()) {
    try {
      await saveSupabaseVideos(videos);
      return;
    } catch (error) {
      console.warn(`Không cập nhật được danh sách video trên Supabase, chuyển sang lưu local: ${error.message}`);
    }
  }

  localStorage.setItem("thamChinhVideos", JSON.stringify(videos));
}

async function deleteVideoByKey(encodedKey) {
  const current = getCurrentUser();
  if (!current || current.role !== "admin") {
    alert("Chỉ admin mới được xóa video.");
    return;
  }

  if (!confirm("Bạn chắc chắn muốn xóa video này khỏi website?")) return;

  try {
    const videos = await getVideos();
    const nextVideos = videos.filter(video => encodeURIComponent(getVideoKey(video)) !== encodedKey);

    if (nextVideos.length === videos.length) {
      alert("Không tìm thấy video cần xóa.");
      return;
    }

    await replaceVideos(nextVideos);
    renderVideos();
    renderCharacterDetail(getCharacters()[selectedCharacterIndex]);
    renderAdminPanel();
    alert("Đã xóa video khỏi website.");
  } catch (error) {
    alert(`Không xóa được video: ${error.message}`);
  }
}

async function saveCharacterInterviewVideo(video) {
  if (isSupabaseConfigured()) {
    try {
      const videos = await getSupabaseVideos();
      const filteredVideos = videos.filter(item => {
        return !(item.sourceType === "interview" && item.characterName === video.characterName);
      });
      filteredVideos.unshift(video);
      await saveSupabaseVideos(filteredVideos, video.bucket);
      return;
    } catch (error) {
      console.warn(`Không lưu được video phỏng vấn lên Supabase, chuyển sang lưu local: ${error.message}`);
    }
  }

  const videos = getLocalVideos();
  const filteredVideos = videos.filter(item => {
    return !(item.sourceType === "interview" && item.characterName === video.characterName);
  });
  filteredVideos.unshift(video);
  localStorage.setItem("thamChinhVideos", JSON.stringify(filteredVideos));
}

async function uploadToSupabaseStorage(file, onProgress) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Chưa cấu hình Supabase trong config.js. Cần điền url, anonKey và bucket.");
  }

  if (!file.type.startsWith("video/")) {
    throw new Error("File được chọn không phải video. Vui lòng chọn file video hợp lệ.");
  }

  const maxFileSizeMB = getSupabaseMaxFileSizeMB();
  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
  if (file.size > maxFileSizeBytes) {
    throw new Error(`Video ${formatFileSize(file.size)} vượt quá giới hạn ${maxFileSizeMB}MB đang cấu hình. Hãy chọn video nhỏ hơn hoặc tăng File size limit của bucket Supabase.`);
  }

  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `${getSupabaseFolder()}/${Date.now()}-${safeName}`;
  onProgress(20);

  if (file.size > 6 * 1024 * 1024) {
    return uploadLargeVideoToSupabase(file, path, onProgress);
  }

  let uploadedData = null;
  let uploadedBucket = "";

  for (const bucket of getSupabaseBucketCandidates()) {
    const { data, error } = await client.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || "video/mp4",
        upsert: false
      });

    if (!error) {
      uploadedData = data;
      uploadedBucket = bucket;
      break;
    }

    if (!error.message?.toLowerCase().includes("bucket not found")) {
      throw new Error(`Upload Supabase Storage thất bại: ${getSupabaseUploadErrorMessage(error)}`);
    }
  }

  if (!uploadedData || !uploadedBucket) {
    throw new Error("Không tìm thấy bucket Supabase. Hãy tạo bucket tên videos hoặc VIDEOS.");
  }

  onProgress(80);

  const { data: publicData } = client.storage
    .from(uploadedBucket)
    .getPublicUrl(uploadedData.path);

  if (!publicData?.publicUrl) {
    throw new Error("Không lấy được public URL từ Supabase Storage.");
  }

  onProgress(100);

  return {
    url: publicData.publicUrl,
    publicId: uploadedData.path,
    bucket: uploadedBucket,
    duration: 0,
    size: file.size,
    type: file.type
  };
}

async function uploadLargeVideoToSupabase(file, path, onProgress) {
  const projectRef = getSupabaseProjectRef();
  const anonKey = CONFIG.supabase?.anonKey;

  if (!projectRef || !anonKey) {
    throw new Error("Thiếu Supabase project URL hoặc anonKey để upload video lớn.");
  }

  if (!window.tus?.Upload) {
    throw new Error("Chưa tải được tus-js-client. Vui lòng kiểm tra mạng hoặc reload trang.");
  }

  let lastError = null;

  for (const bucket of getSupabaseBucketCandidates()) {
    try {
      await uploadLargeVideoToBucket(file, bucket, path, projectRef, anonKey, onProgress);

      const client = getSupabaseClient();
      const { data: publicData } = client.storage
        .from(bucket)
        .getPublicUrl(path);

      if (!publicData?.publicUrl) {
        throw new Error("Không lấy được public URL từ Supabase Storage.");
      }

      return {
        url: publicData.publicUrl,
        publicId: path,
        bucket,
        duration: 0,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      lastError = error;
      if (!error.message?.toLowerCase().includes("bucket")) break;
    }
  }

  throw new Error(`Upload video lớn thất bại: ${getSupabaseUploadErrorMessage(lastError || new Error("Không rõ lỗi"))}`);
}

function uploadLargeVideoToBucket(file, bucket, path, projectRef, anonKey, onProgress) {
  return new Promise((resolve, reject) => {
    const upload = new window.tus.Upload(file, {
      endpoint: `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 6 * 1024 * 1024,
      removeFingerprintOnSuccess: true,
      uploadDataDuringCreation: true,
      headers: {
        authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        "x-upsert": "false"
      },
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: file.type || "video/mp4",
        cacheControl: "3600"
      },
      onError(error) {
        reject(error);
      },
      onProgress(bytesUploaded, bytesTotal) {
        const percent = Math.min(99, Math.round((bytesUploaded / bytesTotal) * 100));
        onProgress(percent);
      },
      onSuccess() {
        onProgress(100);
        resolve();
      }
    });

    upload.findPreviousUploads().then(previousUploads => {
      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    }).catch(reject);
  });
}

async function saveUploadedVideo(uploadedVideo, current, title, desc) {
  await saveVideo({
    title,
    desc,
    url: uploadedVideo.url,
    embedUrl: uploadedVideo.embedUrl || "",
    sourceType: uploadedVideo.sourceType || "file",
    publicId: uploadedVideo.publicId,
    duration: uploadedVideo.duration,
    size: uploadedVideo.size || 0,
    type: uploadedVideo.type || "video/mp4",
    author: current.email,
    authorName: getDisplayName(current),
    createdAtMs: Date.now(),
    createdAt: new Date().toLocaleString("vi-VN")
  });

  renderVideos();
  renderAdminPanel();
}

function getYouTubeEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;

      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
      if (parts[0] === "embed" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
    }
  } catch (error) {
    return "";
  }

  return "";
}

function getYouTubeVideoId(url) {
  const embedUrl = getYouTubeEmbedUrl(url);
  if (!embedUrl) return "";
  return embedUrl.split("/embed/")[1]?.split("?")[0] || "";
}

function createLinkedVideo(url) {
  const embedUrl = getYouTubeEmbedUrl(url);
  if (!embedUrl) {
    throw new Error("Vui lòng dán link YouTube hợp lệ, ví dụ https://youtu.be/... hoặc https://www.youtube.com/watch?v=...");
  }
  const youtubeId = getYouTubeVideoId(url);

  return {
    url,
    embedUrl,
    thumbnailUrl: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : "",
    sourceType: "youtube",
    publicId: url,
    duration: 0,
    size: 0,
    type: "text/youtube"
  };
}

async function renderVideos() {
  const list = document.getElementById("videoList");
  list.innerHTML = "";

  const videos = (await getVideos()).filter(video => video.sourceType !== "interview");

  if (!videos.length) {
    list.innerHTML = `
      <div class="empty-video-message">
        <h3>Hiện tại chưa có video</h3>
      </div>
    `;
    return;
  }

  videos.forEach(video => {
    const card = document.createElement("article");
    card.className = "video-card";

    const media = video.sourceType === "youtube" && video.embedUrl
      ? `
        <a class="youtube-preview" href="${video.url}" target="_blank" rel="noopener">
          <img src="${video.thumbnailUrl || ""}" alt="${video.title}" onerror="this.src='https://img.youtube.com/vi/${getYouTubeVideoId(video.url)}/hqdefault.jpg'">
          <span class="youtube-title">${video.title}</span>
          <span class="youtube-play" aria-hidden="true"></span>
          <span class="youtube-watch">Xem trên YouTube</span>
        </a>
      `
      : `<video controls src="${video.url}"></video>`;

    card.innerHTML = `
      ${media}
      <div class="card-body">
        <h3>${video.title}</h3>
        <p>${video.desc}</p>
        <span class="badge">${video.sourceType === "youtube" ? "YouTube" : "Video đã upload"}</span>
      </div>
    `;

    list.appendChild(card);
  });
}

function setUploadStatus({ visible, text = "", percent = 0, isError = false }) {
  const status = document.getElementById("uploadStatus");
  const statusText = document.getElementById("uploadStatusText");
  const percentText = document.getElementById("uploadPercent");
  const progressBar = document.getElementById("uploadProgressBar");

  status.classList.toggle("hidden", !visible);
  status.classList.toggle("error", isError);
  statusText.innerText = text;
  percentText.innerText = `${percent}%`;
  progressBar.style.width = `${percent}%`;
}

function setUploadBusy(isBusy) {
  const button = document.getElementById("uploadSubmitBtn");
  const form = document.getElementById("uploadForm");

  button.disabled = isBusy;
  button.innerText = isBusy ? "Đang lưu..." : "Lưu video";
  form.classList.toggle("is-uploading", isBusy);
}

async function handleVideoUpload(event) {
  event.preventDefault();

  const current = getCurrentUser();
  if (!current) {
    alert("Bạn cần đăng nhập để upload video.");
    return;
  }

  if (current.role !== "admin") {
    alert("Chỉ admin mới được upload video để hiển thị cho toàn bộ người dùng.");
    return;
  }

  const title = document.getElementById("videoTitle").value.trim();
  const desc = document.getElementById("videoDesc").value.trim();
  const videoUrl = document.getElementById("videoUrl").value.trim();

  if (!videoUrl) {
    alert("Vui lòng dán link YouTube.");
    return;
  }

  try {
    setUploadBusy(true);

    setUploadStatus({
      visible: true,
      text: "Đang lưu link YouTube lên website...",
      percent: 100
    });

    await saveUploadedVideo(createLinkedVideo(videoUrl), current, title, desc);
    alert("Đã lưu video YouTube thành công.");
    event.target.reset();
  } catch (error) {
    setUploadStatus({
      visible: true,
      text: error.message,
      percent: 0,
      isError: true
    });
    setTimeout(() => alert(error.message), 50);
  } finally {
    setUploadBusy(false);
  }
}

function getComments() {
  return JSON.parse(localStorage.getItem("thamChinhComments")) || [];
}

function saveComments(comments) {
  localStorage.setItem("thamChinhComments", JSON.stringify(comments));
  saveSupabaseComments(comments).catch(error => {
    console.warn(`Không đồng bộ được bình luận lên Supabase: ${error.message}`);
  });
}

async function renderComments() {
  const list = document.getElementById("commentList");
  const comments = (await syncCommentsFromSupabase()).slice().reverse();
  const current = getCurrentUser();
  const isAdmin = current && current.role === "admin";

  if (!comments.length) {
    list.innerHTML = "<p>Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ suy nghĩ để tìm ra manh mối.</p>";
    return;
  }

  if (!isAdmin) {
    list.innerHTML = "";
    return;
  }

  list.innerHTML = comments.map(c => `
    <div class="comment-item">
      <strong>${c.userName} • ${c.createdAt}</strong>
      <p>${c.text}</p>
    </div>
  `).join("");
}

async function handleComment(event) {
  event.preventDefault();

  const current = getCurrentUser();
  if (!current) {
    alert("Bạn cần đăng nhập để bình luận.");
    return;
  }

  const text = document.getElementById("commentText").value.trim();
  const createdAtMs = Date.now();
  const comments = await syncCommentsFromSupabase();

  comments.push({
    id: `${current.email}-${createdAtMs}`,
    userName: getDisplayName(current),
    userEmail: current.email,
    text,
    createdAtMs,
    createdAt: new Date().toLocaleString("vi-VN")
  });

  saveComments(comments);
  addPoints(current.email, 10);
  renderComments();
  renderAdminPanel();
  alert("Đã gửi bình luận. Bạn nhận được 10 điểm.");
  event.target.reset();
}

function renderLeaderboard() {
  const body = document.getElementById("leaderboardBody");
  const users = getUsers()
    .filter(u => u.role !== "admin" && (u.points || 0) > 0)
    .sort((a, b) => (b.points || 0) - (a.points || 0));

  if (!users.length) {
    body.innerHTML = `
      <tr>
        <td colspan="4">Chưa có người tham gia bình luận.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = users.map((u, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${getDisplayName(u)}</td>
      <td>${u.points || 0}</td>
      <td>${getRank(u.points || 0)}</td>
    </tr>
  `).join("");
}

function getTickets() {
  return JSON.parse(localStorage.getItem("thamChinhTickets")) || [];
}

function saveTickets(tickets) {
  localStorage.setItem("thamChinhTickets", JSON.stringify(tickets));
}

function createVietQR(amount, content) {
  const bankId = CONFIG.vietqr?.bankId || "MB";
  const accountNo = CONFIG.vietqr?.accountNo || "0123456789";
  const accountName = encodeURIComponent(CONFIG.vietqr?.accountName || "THAM CHINH GAME SHOW");
  const addInfo = encodeURIComponent(content);

  return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
}

function formatTime(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function renderTimeSlots() {
  const grid = document.getElementById("timeSlotGrid");
  const selectedInput = document.getElementById("timeSlot");
  if (!grid || !selectedInput) return;

  const start = 8 * 60;
  const end = 17 * 60;
  const duration = 30;

  grid.innerHTML = "";
  for (let time = start; time < end; time += duration) {
    const slot = `${formatTime(time)} ~ ${formatTime(time + duration)}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "time-slot-btn";
    button.textContent = slot;
    button.addEventListener("click", () => {
      selectedInput.value = slot;
      grid.querySelectorAll(".time-slot-btn").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
    });
    grid.appendChild(button);
  }
}

function prefillTicketMemberInfo() {
  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  if (!fullNameInput || !emailInput) return;

  const current = getCurrentUser();
  if (!current || current.role === "admin") return;

  fullNameInput.value = getDisplayName(current);
  emailInput.value = current.email || "";
}

function handleTicket(event) {
  event.preventDefault();

  const current = getCurrentUser();
  if (!current || current.role === "admin") {
    alert("Bạn cần đăng nhập tài khoản thành viên để đặt vé.");
    return;
  }

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const ticketSelect = document.getElementById("ticketType");
  const ticketType = ticketSelect.value;
  const price = Number(ticketSelect.selectedOptions[0].dataset.price || 0);
  const timeSlot = document.getElementById("timeSlot").value;
  const quantity = Number(document.getElementById("quantity").value);
  const total = price * quantity;
  const code = `TC-${Date.now().toString().slice(-6)}`;

  if (!timeSlot) {
    alert("Vui lòng chọn khung giờ tham gia.");
    return;
  }

  const ticket = {
    fullName,
    email,
    phone,
    ticketType,
    timeSlot,
    quantity,
    total,
    code,
    createdAt: new Date().toLocaleString("vi-VN")
  };

  const tickets = getTickets();
  tickets.push(ticket);
  saveTickets(tickets);

  document.getElementById("ticketResult").classList.remove("hidden");
  document.getElementById("ticketResult").innerHTML = `
    <strong>Đăng ký vé thành công!</strong><br>
    Họ tên: ${fullName}<br>
    Loại vé: ${ticketType}<br>
    Khung giờ: ${timeSlot}<br>
    Số lượng: ${quantity}<br>
    Tổng tiền: ${total.toLocaleString("vi-VN")}đ<br>
    Mã giữ chỗ: ${code}
  `;

  const qrUrl = createVietQR(total, code);
  document.getElementById("qrBox").classList.remove("hidden");
  document.getElementById("qrBox").innerHTML = `
    <strong>Quét QR VietQR để thanh toán</strong>
    <img src="${qrUrl}" alt="QR VietQR">
    <p><strong>Nội dung chuyển khoản:</strong> ${code}</p>
    <p><strong>MoMo:</strong> ${CONFIG.momo?.phone || "0900000000"} - ${CONFIG.momo?.accountName || "THAM CHINH GAME SHOW"}</p>
  `;

  renderAdminPanel();
  renderLeaderboard();
  event.target.reset();
  document.getElementById("timeSlot").value = "";
  document.querySelectorAll(".time-slot-btn").forEach(item => item.classList.remove("active"));
  prefillTicketMemberInfo();
}

async function handleCharacterInterviewSubmit(event) {
  if (event.target.id !== "characterInterviewForm") return;
  event.preventDefault();

  const current = getCurrentUser();
  if (!current || current.role !== "admin") {
    alert("Chỉ admin mới được cập nhật video phỏng vấn nhân vật.");
    return;
  }

  try {
    const characterName = document.getElementById("interviewCharacter").value;
    const videoUrl = document.getElementById("interviewVideoUrl").value.trim();
    const note = document.getElementById("interviewNote").value.trim();
    const linkedVideo = createLinkedVideo(videoUrl);

    await saveCharacterInterviewVideo({
      title: `Phỏng vấn ${characterName}`,
      desc: note,
      url: linkedVideo.url,
      embedUrl: linkedVideo.embedUrl,
      sourceType: "interview",
      characterName,
      publicId: linkedVideo.publicId,
      duration: linkedVideo.duration,
      size: 0,
      type: linkedVideo.type,
      author: current.email,
      authorName: getDisplayName(current),
      createdAtMs: Date.now(),
      createdAt: new Date().toLocaleString("vi-VN")
    });

    alert(`Đã lưu video phỏng vấn cho ${characterName}.`);
    event.target.reset();
    renderCharacterDetail(getCharacters()[selectedCharacterIndex]);
    renderVideos();
    renderAdminPanel();
  } catch (error) {
    alert(`Không lưu được video phỏng vấn: ${error.message}`);
  }
}

function handleAdminPanelClick(event) {
  const deleteButton = event.target.closest("[data-delete-video]");
  if (deleteButton) {
    deleteVideoByKey(deleteButton.dataset.deleteVideo);
    return;
  }

  const editCharacterButton = event.target.closest("[data-edit-character]");
  if (editCharacterButton) {
    fillCharacterForm(editCharacterButton.dataset.editCharacter);
    return;
  }

  const deleteCharacterButton = event.target.closest("[data-delete-character]");
  if (deleteCharacterButton) {
    deleteCharacterByName(deleteCharacterButton.dataset.deleteCharacter);
    return;
  }

  const resetCharacterButton = event.target.closest("[data-reset-character-form]");
  if (resetCharacterButton) {
    resetCharacterForm();
  }
}

function resetCharacterForm() {
  const form = document.getElementById("characterProfileForm");
  if (!form) return;

  form.reset();
  const preview = document.getElementById("characterImagePreview");
  if (preview) {
    preview.classList.add("hidden");
    preview.removeAttribute("src");
  }
  document.getElementById("characterOriginalName").value = "";
  document.getElementById("characterFormTitle").innerText = "Thêm hồ sơ nhân vật";
}

function fillCharacterForm(name) {
  const character = getCharacters().find(item => item.name === name);
  if (!character) return;

  document.getElementById("characterOriginalName").value = character.name;
  document.getElementById("characterFormTitle").innerText = `Sửa hồ sơ: ${character.name}`;
  document.getElementById("characterName").value = character.name;
  document.getElementById("characterRole").value = character.role;
  document.getElementById("characterStatus").value = character.status;
  document.getElementById("characterImage").value = character.image;
  document.getElementById("characterTheme").value = character.className || "";
  document.getElementById("characterSuspicion").value = character.suspicion;
  document.getElementById("characterBackground").value = character.background;
  document.getElementById("characterStatement").value = character.statement;
  document.getElementById("characterClues").value = character.clues.join("\n");
  const preview = document.getElementById("characterImagePreview");
  if (preview && character.image) {
    preview.src = character.image;
    preview.classList.remove("hidden");
  }
}

function readCharacterImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Không đọc được file ảnh."));
    reader.readAsDataURL(file);
  });
}

function handleCharacterImageFileChange(event) {
  if (event.target.id !== "characterImageFile") return;

  const file = event.target.files?.[0];
  const preview = document.getElementById("characterImagePreview");
  if (!preview) return;

  if (!file) {
    preview.classList.add("hidden");
    preview.removeAttribute("src");
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Vui lòng chọn file ảnh.");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert("Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB để website lưu ổn định.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function deleteCharacterByName(name) {
  const current = getCurrentUser();
  if (!current || current.role !== "admin") {
    alert("Chỉ admin mới được xóa hồ sơ nhân vật.");
    return;
  }

  if (!confirm(`Bạn chắc chắn muốn xóa hồ sơ nhân vật "${name}"?`)) return;

  const characters = getCharacters().filter(character => character.name !== name);
  saveCharacters(characters);
  selectedCharacterIndex = 0;
  renderSuspects();
  renderAdminPanel();
  alert("Đã xóa hồ sơ nhân vật.");
}

async function handleCharacterProfileSubmit(event) {
  if (event.target.id !== "characterProfileForm") return;
  event.preventDefault();

  const current = getCurrentUser();
  if (!current || current.role !== "admin") {
    alert("Chỉ admin mới được chỉnh hồ sơ nhân vật.");
    return;
  }

  const originalName = document.getElementById("characterOriginalName").value;
  const imageFile = document.getElementById("characterImageFile")?.files?.[0];
  let characterImage = document.getElementById("characterImage").value.trim();

  if (imageFile) {
    if (!imageFile.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }

    if (imageFile.size > 2 * 1024 * 1024) {
      alert("Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB.");
      return;
    }

    try {
      characterImage = await readCharacterImageFile(imageFile);
    } catch (error) {
      alert(error.message);
      return;
    }
  }

  const character = normalizeCharacter({
    name: document.getElementById("characterName").value,
    role: document.getElementById("characterRole").value,
    status: document.getElementById("characterStatus").value,
    image: characterImage,
    className: document.getElementById("characterTheme").value,
    suspicion: document.getElementById("characterSuspicion").value,
    background: document.getElementById("characterBackground").value,
    statement: document.getElementById("characterStatement").value,
    clues: document.getElementById("characterClues").value
  });

  if (!character.name || !character.role || !character.suspicion) {
    alert("Vui lòng nhập tên, vai trò và hồ sơ nhân vật.");
    return;
  }

  const characters = getCharacters();
  const duplicateName = characters.some(item => {
    return item.name.toLowerCase() === character.name.toLowerCase() && item.name !== originalName;
  });

  if (duplicateName) {
    alert("Tên nhân vật đã tồn tại.");
    return;
  }

  const nextCharacters = originalName
    ? characters.map(item => item.name === originalName ? character : item)
    : [...characters, character];

  saveCharacters(nextCharacters);
  selectedCharacterIndex = nextCharacters.findIndex(item => item.name === character.name);
  resetCharacterForm();
  renderSuspects();
  renderAdminPanel();
  alert("Đã lưu hồ sơ nhân vật.");
}

async function renderAdminPanel() {
  const panel = document.getElementById("adminPanel");
  const current = getCurrentUser();

  if (!current || current.role !== "admin") {
    panel.innerHTML = "";
    return;
  }

  const tickets = getTickets();
  const videos = await getVideos();
  const caseVideos = videos.filter(video => video.sourceType !== "interview");
  const interviewVideos = videos.filter(video => video.sourceType === "interview");
  const comments = await syncCommentsFromSupabase();
  const users = getUsers();
  const characters = getCharacters();

  panel.innerHTML = `
    <div class="admin-grid">
      <div class="admin-card">
        <h3>Tổng quan</h3>
        <p><strong>Người dùng:</strong> ${users.length}</p>
        <p><strong>Vé đã đăng ký:</strong> ${tickets.length}</p>
        <p><strong>Video vụ án:</strong> ${caseVideos.length}</p>
        <p><strong>Video phỏng vấn:</strong> ${interviewVideos.length}</p>
        <p><strong>Bình luận:</strong> ${comments.length}</p>
      </div>

      <div class="admin-card">
        <h3>Quản lý vé</h3>
        ${tickets.length ? tickets.map(t => `
          <p>${t.code} - ${t.fullName} - ${t.ticketType}${t.timeSlot ? ` - ${t.timeSlot}` : ""} - ${t.total.toLocaleString("vi-VN")}đ</p>
        `).join("") : "<p>Chưa có vé.</p>"}
      </div>

      <div class="admin-card admin-card-wide">
        <h3>Quản lý hồ sơ nhân vật</h3>
        <div class="admin-character-list">
          ${characters.length ? characters.map(character => `
            <div class="admin-video-row">
              <p><strong>${escapeHtml(character.name)}</strong> - ${escapeHtml(character.role)}</p>
              <div class="admin-row-actions">
                <button class="btn small" type="button" data-edit-character="${escapeHtml(character.name)}">Sửa</button>
                <button class="btn small danger" type="button" data-delete-character="${escapeHtml(character.name)}">Xóa</button>
              </div>
            </div>
          `).join("") : "<p>Chưa có hồ sơ nhân vật.</p>"}
        </div>

        <form id="characterProfileForm" class="admin-mini-form admin-character-form">
          <h4 id="characterFormTitle">Thêm hồ sơ nhân vật</h4>
          <input type="hidden" id="characterOriginalName">

          <label for="characterName">Tên nhân vật</label>
          <input type="text" id="characterName" placeholder="VD: Khang" required>

          <label for="characterRole">Vai trò</label>
          <input type="text" id="characterRole" placeholder="VD: Thám tử chính" required>

          <label for="characterStatus">Trạng thái / nhãn</label>
          <input type="text" id="characterStatus" placeholder="VD: Đầu mối điều tra">

          <label for="characterImage">Link ảnh nhân vật</label>
          <input type="text" id="characterImage" placeholder="https://... hoặc ảnh đã upload">

          <label for="characterImageFile">Hoặc chọn ảnh từ máy</label>
          <input type="file" id="characterImageFile" accept="image/*">
          <img id="characterImagePreview" class="admin-image-preview hidden" alt="Xem trước ảnh nhân vật">

          <label for="characterTheme">Màu thẻ</label>
          <select id="characterTheme">
            <option value="">Sáng</option>
            <option value="hunter">Tối</option>
          </select>

          <label for="characterSuspicion">Hồ sơ ngắn</label>
          <textarea id="characterSuspicion" rows="3" placeholder="Tóm tắt hồ sơ nhân vật" required></textarea>

          <label for="characterBackground">Bối cảnh</label>
          <textarea id="characterBackground" rows="3" placeholder="Bối cảnh nhân vật"></textarea>

          <label for="characterStatement">Lời khai</label>
          <textarea id="characterStatement" rows="3" placeholder="Lời khai của nhân vật"></textarea>

          <label for="characterClues">Manh mối liên quan</label>
          <textarea id="characterClues" rows="4" placeholder="Mỗi dòng là một manh mối"></textarea>

          <div class="admin-row-actions">
            <button class="btn dark" type="submit">Lưu hồ sơ</button>
            <button class="btn" type="button" data-reset-character-form>Thêm mới</button>
          </div>
        </form>
      </div>

      <div class="admin-card">
        <h3>Video phỏng vấn nhân vật</h3>
        <form id="characterInterviewForm" class="admin-mini-form">
          <label for="interviewCharacter">Nhân vật</label>
          <select id="interviewCharacter" required>
            ${characters.map(character => `
              <option value="${character.name}">${character.name}</option>
            `).join("")}
          </select>

          <label for="interviewVideoUrl">Link YouTube phỏng vấn</label>
          <input type="url" id="interviewVideoUrl" placeholder="https://www.youtube.com/watch?v=..." required>

          <label for="interviewNote">Ghi chú hiển thị</label>
          <textarea id="interviewNote" rows="3" placeholder="VD: Buổi phỏng vấn tại hiện trường"></textarea>

          <button class="btn dark" type="submit">Lưu video phỏng vấn</button>
        </form>

        <div class="admin-character-list">
          ${characters.map(character => {
            const interview = getCharacterInterview(videos, character.name);
            return `
              <div class="admin-video-row">
                <p><strong>${character.name}:</strong> ${interview ? interview.title : "Chưa có video"}</p>
                ${interview ? `
                  <button
                    class="btn small danger"
                    type="button"
                    data-delete-video="${encodeURIComponent(getVideoKey(interview))}">
                    Xóa video
                  </button>
                ` : ""}
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <div class="admin-card">
        <h3>Quản lý video</h3>
        ${caseVideos.length ? caseVideos.map(v => `
          <div class="admin-video-row">
            <p>${v.title} - ${v.author || "Không rõ"} - ${v.createdAt || ""}</p>
            <button
              class="btn small danger"
              type="button"
              data-delete-video="${encodeURIComponent(getVideoKey(v))}">
              Xóa
            </button>
          </div>
        `).join("") : "<p>Chưa có video upload.</p>"}
      </div>

      <div class="admin-card">
        <h3>Quản lý bình luận</h3>
        ${comments.length ? comments.map(c => `
          <p><strong>${c.userName}:</strong> ${c.text}</p>
        `).join("") : "<p>Chưa có bình luận.</p>"}
      </div>
    </div>
  `;
}

document.getElementById("openLoginBtn").addEventListener("click", () => openAuth("login"));
document.getElementById("openRegisterBtn").addEventListener("click", () => openAuth("register"));
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("closeAuthBtn").addEventListener("click", closeAuth);
document.getElementById("authForm").addEventListener("submit", handleAuth);
document.getElementById("uploadForm").addEventListener("submit", handleVideoUpload);
document.getElementById("commentForm").addEventListener("submit", handleComment);
document.getElementById("ticketForm")?.addEventListener("submit", handleTicket);
document.addEventListener("submit", handleCharacterInterviewSubmit);
document.addEventListener("submit", handleCharacterProfileSubmit);
document.addEventListener("click", handleAdminPanelClick);
document.addEventListener("change", handleCharacterImageFileChange);
document.querySelectorAll(".logo, [data-home-link]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    history.pushState(null, "", window.location.pathname + window.location.search);
    applyRouteView(true);
  });
});
document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
  link.addEventListener("click", event => {
    const targetHash = link.getAttribute("href");
    const targetId = targetHash.replace("#", "");

    if (!routeSectionIds.has(targetId)) return;

    event.preventDefault();
    history.pushState(null, "", targetHash);
    applyRouteView(true);
  });
});
document.getElementById("backToTopBtn").addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

getUsers();
initDetectiveModel();
renderSuspects();
renderVideos();
renderTimeSlots();
prefillTicketMemberInfo();
Promise.all([
  restoreSupabaseAuth(),
  syncCommentsFromSupabase(),
  syncCharactersFromSupabase()
]).finally(() => {
  renderSuspects();
  renderComments();
  renderLeaderboard();
  refreshAuthUI();
  prefillTicketMemberInfo();
});
