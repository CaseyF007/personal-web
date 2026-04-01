/**
 * Projects — Load, filter, and render project cards
 */
(function () {
  const PROJECTS_URL = 'data/projects.json';

  let allProjects = [];
  let currentFilter = '全部';

  async function loadProjects() {
    try {
      const res = await fetch(PROJECTS_URL);
      allProjects = await res.json();
      renderFilters();
      renderProjects();
    } catch (e) {
      console.warn('Failed to load projects:', e);
    }
  }

  function getCategories() {
    const cats = new Set(['全部']);
    allProjects.forEach(p => p.tags.forEach(t => cats.add(t)));
    return [...cats];
  }

  function renderFilters() {
    const container = document.getElementById('project-filters');
    if (!container) return;
    const cats = getCategories();
    container.innerHTML = cats.map(c =>
      `<button class="filter-btn${c === currentFilter ? ' active' : ''}" data-filter="${c}">${c}</button>`
    ).join('');

    container.addEventListener('click', (e) => {
      if (!e.target.classList.contains('filter-btn')) return;
      currentFilter = e.target.dataset.filter;
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderProjects();
    });
  }

  function renderProjects() {
    const grid = document.getElementById('project-grid');
    if (!grid) return;

    const filtered = currentFilter === '全部'
      ? allProjects
      : allProjects.filter(p => p.tags.includes(currentFilter));

    grid.innerHTML = filtered.map(p => `
      <div class="card project-card hover-lift" data-tags="${p.tags.join(',')}">
        <div class="project-image">
          ${p.image
            ? `<img src="${p.image}" alt="${p.title}" loading="lazy">`
            : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${p.gradient || 'rgba(59,130,246,0.2),rgba(139,92,246,0.2)'});display:flex;align-items:center;justify-content:center;">
                <span style="font-size:3rem;opacity:0.4;">${p.icon || '🚀'}</span>
              </div>`
          }
          <div class="project-overlay">
            ${p.github ? `<a href="${p.github}" target="_blank" class="btn btn-sm btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.5);">GitHub</a>` : ''}
            ${p.demo ? `<a href="${p.demo}" target="_blank" class="btn btn-sm btn-primary">Demo</a>` : ''}
            ${p.paper ? `<a href="${p.paper}" target="_blank" class="btn btn-sm btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.5);">论文</a>` : ''}
          </div>
        </div>
        <div class="project-body">
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          <div class="project-tags">
            ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');

    // Re-trigger stagger animation
    grid.classList.remove('revealed');
    void grid.offsetWidth; // force reflow
    grid.classList.add('revealed');
  }

  document.addEventListener('DOMContentLoaded', loadProjects);
})();
