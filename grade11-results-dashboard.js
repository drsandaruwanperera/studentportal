import { GRADE11_RESULTS } from './grade11-results-data.js';

const id = String(sessionStorage.getItem('studentId') || '').trim().toUpperCase();
const type = String(sessionStorage.getItem('studentType') || sessionStorage.getItem('studentGrade') || '').trim().toLowerCase();

if (['11','grade11','grade 11'].includes(type)) {
    const content = document.querySelector('.content');
    const nav = document.querySelector('.sidebar-nav');
    if (content && !document.getElementById('grade11ResultsSection')) {
        const results = Object.entries(GRADE11_RESULTS).map(([exam, rows]) => {
            const row = rows.find(item => String(item.id).toUpperCase() === id);
            return row ? { exam, ...row } : null;
        }).filter(Boolean);
        const section = document.createElement('section');
        section.id = 'grade11ResultsSection';
        section.style.cssText = 'margin-top:28px;padding:28px;border-radius:22px;background:#11182b;color:#f4f6ff;';
        section.innerHTML = `<h2>My Results</h2><p>Student No. ${id}</p>${results.length ? results.map(r => `<div style="margin-top:14px;padding:18px;border-radius:16px;background:#0b1020;"><b>${r.exam}</b><div style="font-size:40px;color:#a0ff1a;font-weight:800;">${r.score}<small style="font-size:12px;color:#aeb9d0;"> / 100</small></div><div>${r.name}</div></div>`).join('') : '<p>No published result was found for this student number yet.</p>'}`;
        const footer = content.querySelector('.footer');
        if (footer) content.insertBefore(section, footer); else content.appendChild(section);
    }
    if (nav && !document.getElementById('grade11ResultsNav')) {
        const link = document.createElement('a');
        link.href = '#grade11ResultsSection';
        link.className = 'sidebar-link';
        link.id = 'grade11ResultsNav';
        link.innerHTML = '<span class="nav-icon">🏆</span><span>Results</span>';
        link.onclick = e => { e.preventDefault(); document.getElementById('grade11ResultsSection')?.scrollIntoView({behavior:'smooth'}); };
        nav.appendChild(link);
    }
}
