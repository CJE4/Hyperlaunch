// ============================================================
// HYPERLAUNCH — shared script (loader, nav, animation, AI chat, checkout)
// ============================================================

// ── LOADER ──
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('out');
    setTimeout(() => loader.style.display = 'none', 700);
  }, 900);
});

// ── NAV ──
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
}
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
}
function closeMobile() {
  if (hamburger) hamburger.classList.remove('open');
  if (mobileMenu) mobileMenu.classList.remove('open');
}

// ── SCROLL PROGRESS ──
window.addEventListener('scroll', () => {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
  bar.style.width = pct + '%';
});

// ── COUNTER ANIMATION ──
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const duration = 1400;
  const start = Date.now();
  function update() {
    const progress = Math.min((Date.now() - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(ease * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  update();
}

// ── PARTICLES (hero background) ──
(function () {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  function resize() {
    W = canvas.width = canvas.parentElement.offsetWidth;
    H = canvas.height = canvas.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.4 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = -Math.random() * 0.35 - 0.08;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.7 ? '#7A00FF' : '#1877F2';
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.alpha -= 0.0007;
      if (this.y < -10 || this.alpha <= 0) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  for (let i = 0; i < 70; i++) particles.push(new Particle());
  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();

// ── ACTIVE NAV HIGHLIGHTING (tab-based) ──
function setActiveNavLink(tab) {
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    link.classList.toggle('active', link.dataset.tab === tab);
  });
}

// ── TAB SWITCHING ──
let countersFired = false;
function switchTab(tab) {
  const panels = document.querySelectorAll('.tab-panel');
  const target = document.getElementById('tab-' + tab);
  if (!target) return;

  panels.forEach(p => p.classList.remove('active'));
  target.classList.add('active');
  setActiveNavLink(tab);
  window.scrollTo({ top: 0, behavior: 'auto' });
  history.replaceState(null, '', '#' + tab);

  // Reveal fade-up / card content within the newly shown panel
  const revealEls = target.querySelectorAll('.fade-up, .feature-card, .work-card, .price-card');
  revealEls.forEach((el, i) => {
    el.classList.remove('visible');
    setTimeout(() => el.classList.add('visible'), 30 + i * 70);
  });

  // Fire hero counters once, the first time the Home tab is shown
  if (tab === 'home' && !countersFired) {
    countersFired = true;
    document.querySelectorAll('.stats-bar [data-target]').forEach(animateCounter);
  }
}

// Initialize on load: read hash, default to home
document.addEventListener('DOMContentLoaded', () => {
  const validTabs = ['home', 'services', 'work', 'pricing', 'contact'];
  const hash = window.location.hash.replace('#', '');
  switchTab(validTabs.includes(hash) ? hash : 'home');
  initialGreeting();
});

// ============================================================
// SELLAUTH — embed checkout popup
// ============================================================
const SELL_PRODUCT = 495027;
const SELL_SHOP = 91082;
const VARIANTS = { 'Starter': 732624, 'Growth': 732625, 'LiftOff Pro': 732626 };

function sellAuthCheckout(opts) {
  try {
    if (window.sellAuthEmbed && typeof window.sellAuthEmbed.checkout === 'function') {
      window.sellAuthEmbed.checkout(document.body, {
        cart: opts.cart,
        shopId: opts.shopId || SELL_SHOP,
        modal: true,
        scrollTop: true
      });
      return;
    }
  } catch (err) { console.warn('SellAuth embed failed:', err); }
  const item = opts.cart?.[0];
  const variantQuery = item ? `?variant=${encodeURIComponent(item.variantId || '')}` : '';
  const fallback = `https://hyperlaunch.mysellauth.com/product/hyperlaunch-packages${variantQuery}`;
  window.open(fallback, '_blank', 'noopener,noreferrer');
}
function openSellAuthByLabel(label) {
  const variantId = VARIANTS[label];
  if (!variantId) return sellAuthCheckout({ cart: [{ productId: SELL_PRODUCT, variantId: '', quantity: 1 }] });
  sellAuthCheckout({ cart: [{ productId: SELL_PRODUCT, variantId, quantity: 1 }], shopId: SELL_SHOP });
}

// ============================================================
// CONTACT AI — intake assistant that generates & submits a project summary
// ============================================================
(function contactAI() {
  const chatBody = document.getElementById('chatBody');
  const chatForm = document.getElementById('chatControls');
  const chatInput = document.getElementById('chatInput');
  const hiddenForm = document.getElementById('hiddenContactForm');
  const hidden_ai = document.getElementById('hidden_ai_summary');
  const hidden_project = document.getElementById('hidden_project');
  const hidden_name = document.getElementById('hidden_name');
  const hidden_email = document.getElementById('hidden_email');
  const hidden_prompt = document.getElementById('hidden_prompt');
  const finalSummary = document.getElementById('finalSummary');
  const summaryBlock = document.getElementById('summaryBlock');
  const formSubject = document.getElementById('form_subject');

  if (!chatBody || !chatForm) return; // not on this page

  let chatHistory = [];
  let thinkingEl = null;

  function elMsg(text, who = 'ai', delay = 60, allowHtml = false) {
    const d = document.createElement('div');
    d.className = 'msg ' + (who === 'ai' ? 'ai' : 'user');
    if (allowHtml) d.innerHTML = text; else d.textContent = text;
    chatBody.appendChild(d);
    setTimeout(() => d.classList.add('show'), delay);
    chatBody.scrollTop = chatBody.scrollHeight;
    return d;
  }

  function showTyping() {
    thinkingEl = document.createElement('div');
    thinkingEl.className = 'typing';
    thinkingEl.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatBody.appendChild(thinkingEl);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
  function hideTyping() { if (thinkingEl) { thinkingEl.remove(); thinkingEl = null; } }

  async function callBackend(message) {
    chatHistory.push({ role: 'user', content: message });
    try {
      showTyping();
      const res = await fetch('/api/ai-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: chatHistory, service: 'Contact' })
      });
      const json = await res.json();
      hideTyping();
      const reply = json.reply || json.summary || '⚠️ AI returned no reply.';
      chatHistory.push({ role: 'assistant', content: reply });
      return { reply: reply, summary: json.summary || '' };
    } catch (err) {
      hideTyping();
      console.error('AI error', err);
      return { reply: '⚠️ AI unavailable. Please try again later.', summary: '' };
    }
  }

  function initialGreeting() {
    elMsg("Hey! I'm HyperLaunch Assistant — ready to help plan your dream launch. Shall we begin?", 'ai', 120);
  }
  window.initialGreeting = initialGreeting;

  function parseSummary(text) {
    const out = {};
    const extract = (label) => {
      const re = new RegExp(label + '[:\\-\\s]*([^\\n\\r]+)', 'i');
      const m = text.match(re);
      return m ? m[1].trim() : '';
    };
    out.name = extract('Name');
    out.email = extract('Email');
    out.brand = extract('Brand');
    out.audience = extract('Audience');
    out.goals = extract('Goals');
    out.pages = extract('Pages/Features|Pages');
    out.style = extract('Visual Style');
    out.timeline = extract('Timeline');
    out.package = extract('Package');
    out.extra = extract('Extra Notes|Notes');
    return out;
  }

  function buildAIPrompt(parsed) {
    const lines = [];
    lines.push(`Create a website for "${parsed.brand || '[Brand Name]'}", targeting ${parsed.audience || '[Target Audience]'}.`);
    lines.push(`Main goals: ${parsed.goals || '[Goals]'}.`);
    lines.push(`Pages/features needed: ${parsed.pages || '[Pages/Features]'}.`);
    lines.push(`Visual style: ${parsed.style || '[Visual Style]'}.`);
    lines.push(`Timeline: ${parsed.timeline || '[Timeline]'}.`);
    lines.push(`Package: ${parsed.package || '[Not specified]'}.`);
    if (parsed.extra) lines.push(`Extra notes: ${parsed.extra}.`);
    const prompt = `AI WEB BUILD PROMPT:\n${lines.join(' ')}\n\nPlease output: 1) A short homepage brief (2-3 sentences), 2) A list of pages and their purpose, 3) Primary CTA and form behaviors, 4) Suggested tech stack.`;
    return prompt;
  }

  function handleFinalSummary(aiReply, summaryText) {
    const full = summaryText && summaryText.length ? summaryText : aiReply;
    finalSummary.classList.remove('hidden');
    summaryBlock.textContent = full;
    hidden_ai.value = full;
    hidden_project.value = full;
    const parsed = parseSummary(full);
    hidden_name.value = parsed.name || '';
    hidden_email.value = parsed.email || '';
    const prompt = buildAIPrompt(parsed);
    hidden_prompt.value = prompt;
    const subParts = [];
    if (parsed.name) subParts.push(parsed.name);
    if (parsed.email) subParts.push(`(${parsed.email})`);
    const subject = subParts.length ? `🚀 New Project from ${subParts.join(' ')}` : '🚀 New Project Request';
    formSubject.value = subject;
  }

  async function submitToFormspree() {
    try {
      const fd = new FormData(hiddenForm);
      await fetch(hiddenForm.action, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
      elMsg("🎉 Done — your project was sent to HyperLaunch. We'll be in touch within 48 hours.", 'ai', 80);
    } catch (err) {
      console.error('Formspree submit failed', err);
      alert('Submission failed — please email hyp3rlaunch@gmail.com');
    }
  }

  function checkForSendOffer(aiText, summary) {
    if (/would you like me to send this project request to hyperlaunch/i.test(aiText) || /here.?s your project summary/i.test(aiText) || summary.length > 60) {
      handleFinalSummary(aiText, summary);
      const wrap = document.createElement('div');
      wrap.style.marginTop = '8px';
      const sendBtn = document.createElement('button');
      sendBtn.className = 'btn-primary';
      sendBtn.style.padding = '10px 20px';
      sendBtn.style.fontSize = '.85rem';
      sendBtn.textContent = 'Send to HyperLaunch 🚀';
      sendBtn.onclick = async () => {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
        await submitToFormspree();
        sendBtn.textContent = 'Sent — thank you!';
      };
      wrap.appendChild(sendBtn);
      chatBody.appendChild(wrap);
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = (chatInput.value || '').trim();
    if (!text) return;
    elMsg(text, 'user', 20);
    chatInput.value = '';
    const { reply, summary } = await callBackend(text);
    elMsg(reply, 'ai', 80, true);
    checkForSendOffer(reply, summary || '');
  });

  const resetBtn = document.getElementById('chatReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      chatHistory = [];
      chatBody.innerHTML = '';
      finalSummary.classList.add('hidden');
      summaryBlock.textContent = '';
      initialGreeting();
    });
  }
})();

// ── TESTIMONIAL ROTATION ──
function rotateTestimonials() {
  const testimonials = [
    '"HyperLaunch shipped our site and first launch in under a week — immediate traction." — NovaFit',
    '"They converted our idea to revenue in days." — CreatorWorks',
    '"Fast, honest, great design." — DripCommerce'
  ];
  let idx = 0;
  const el = document.getElementById('testContent');
  if (!el) return;
  setInterval(() => {
    el.style.opacity = 0;
    setTimeout(() => {
      el.textContent = testimonials[idx];
      el.style.opacity = 1;
      idx = (idx + 1) % testimonials.length;
    }, 300);
  }, 6500);
}
window.addEventListener('load', rotateTestimonials);