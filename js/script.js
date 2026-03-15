/**
 * Zyon Capital — Página de Captura
 * Tracking, Webhook e Interações
 */

// ===================================
// CONSTANTES
// ===================================
var EXPERT_ID = 'zyoncapital';
var WEBHOOK_URL = 'https://whkn8n.meumenu2023.uk/webhook/fbclid-landingpage';

// ===================================
// COOKIE HELPERS
// ===================================
function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name, value, days) {
    var expires = '';
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
}

// ===================================
// FACEBOOK PARAMETER CAPTURE
// ===================================
function getFacebookBrowserId() {
    var fbp = getCookie('_fbp');
    if (fbp) return fbp;
    var timestamp = Date.now();
    var random = Math.floor(Math.random() * 10000000000);
    fbp = 'fb.1.' + timestamp + '.' + random;
    setCookie('_fbp', fbp, 90);
    return fbp;
}

function getFacebookClickId() {
    var fbc = getCookie('_fbc');
    if (fbc) return fbc;
    var params = new URLSearchParams(window.location.search);
    var fbclid = params.get('fbclid');
    if (!fbclid) return null;
    fbc = 'fb.1.' + Date.now() + '.' + fbclid;
    setCookie('_fbc', fbc, 90);
    return fbc;
}

// ===================================
// URL PARAMETERS
// ===================================
function getAllUrlParameters() {
    var params = {};
    var searchParams = new URLSearchParams(window.location.search);
    searchParams.forEach(function(value, key) {
        params[key] = value;
    });
    return params;
}

// ===================================
// SHA-256 HASH
// ===================================
async function sha256(message) {
    if (!message) return null;
    var msgBuffer = new TextEncoder().encode(message);
    var hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

// ===================================
// SEND DATA & REDIRECT
// ===================================
function sendDataAndRedirect(data, redirectUrl) {
    var fbp = getFacebookBrowserId();
    var fbc = getFacebookClickId();

    data.fbp = fbp;
    if (fbc) data.fbc = fbc;

    // Nunca enviar fbclid direto — já está no fbc
    delete data.fbclid;

    fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(data),
        mode: 'no-cors'
    }).then(function() {
        window.location.href = redirectUrl;
    }).catch(function() {
        window.location.href = redirectUrl;
    });
}

// ===================================
// CTA TRACKING
// ===================================
function initCTATracking() {
    var buttons = document.querySelectorAll('.cta-button');

    buttons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            var redirectUrl = button.getAttribute('href');

            // GTM dataLayer — Lead event (tag configurada no GTM)
            if (typeof dataLayer !== 'undefined') {
                dataLayer.push({
                    event: 'generate_lead',
                    expert: EXPERT_ID,
                    destination: redirectUrl
                });
            }

            // Montar payload do webhook
            var params = getAllUrlParameters();
            var data = Object.assign({ expert: EXPERT_ID }, params);

            sendDataAndRedirect(data, redirectUrl);
        });
    });
}

// ===================================
// SCROLL ANIMATIONS
// ===================================
function initScrollAnimations() {
    var elements = document.querySelectorAll('.fade-in');
    if (elements.length === 0) return;

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(function(el) {
        observer.observe(el);
    });
}

// ===================================
// STATS BAR — CONTAGEM ANIMADA AO SCROLL
// ===================================
function formatNumber(n) {
    return n.toLocaleString('pt-BR');
}

function animateCount(el, target, duration) {
    var start = 0;
    var startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        // easeOutExpo
        var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        var current = Math.floor(eased * target);
        el.textContent = formatNumber(current);
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = formatNumber(target);
        }
    }

    requestAnimationFrame(step);
}

function initStatsAnimation() {
    var statsBar = document.querySelector('.stats-bar');
    if (!statsBar) return;

    var animated = false;
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting && !animated) {
                animated = true;
                var counters = statsBar.querySelectorAll('[data-count]');
                counters.forEach(function(el) {
                    var target = parseInt(el.getAttribute('data-count'), 10);
                    animateCount(el, target, 2000);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    observer.observe(statsBar);
}

// ===================================
// CONTADOR "PESSOAS ENTRARAM HOJE"
// ===================================
function getTodayCount() {
    var now = new Date();
    var hour = now.getHours();
    var minute = now.getMinutes();
    // Gera número baseado na hora do dia (cresce ao longo do dia)
    // ~15 às 00h, ~200 às 23h
    var base = Math.floor((hour * 60 + minute) / 1440 * 185) + 15;
    // Pequena variação por dia (seed baseado na data)
    var daySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    var variation = ((daySeed * 9301 + 49297) % 233280) / 233280;
    var offset = Math.floor(variation * 30) - 15;
    return Math.max(12, base + offset);
}

function initTodayCounter() {
    var el = document.getElementById('today-count');
    if (!el) return;

    var count = getTodayCount();
    el.textContent = count;

    // Incrementa aleatoriamente a cada 15-45 segundos
    setInterval(function() {
        if (Math.random() > 0.4) {
            count += 1;
            el.textContent = count;
        }
    }, Math.floor(Math.random() * 30000) + 15000);
}

// ===================================
// INIT
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    // Captura fbp/fbc imediatamente
    getFacebookBrowserId();
    getFacebookClickId();

    // Scroll CTA (não é tracking — só scroll suave)
    var scrollCta = document.getElementById('scroll-cta');
    if (scrollCta) {
        scrollCta.addEventListener('click', function(e) {
            e.preventDefault();
            var target = document.getElementById('problema');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Inicializar módulos
    initCTATracking();
    initScrollAnimations();
    initStatsAnimation();
    initTodayCounter();
});
