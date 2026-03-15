/**
 * Zyon Capital — Página de Captura
 * Interações e Animações
 */

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
    var base = Math.floor((hour * 60 + minute) / 1440 * 185) + 15;
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
    // Scroll CTA (scroll suave)
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

    initScrollAnimations();
    initStatsAnimation();
    initTodayCounter();
});
