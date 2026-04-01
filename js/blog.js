/**
 * Blog — Load posts index, render cards, tag filtering
 */
(function () {
  const INDEX_URL = 'data/posts/posts-index.json';
  let allPosts = [];
  let currentTag = '全部';

  async function loadPosts() {
    try {
      const res = await fetch(INDEX_URL);
      allPosts = await res.json();
      renderTagFilters();
      renderPosts();
    } catch (e) {
      console.warn('Failed to load posts:', e);
      const empty = document.getElementById('blog-empty');
      if (empty) empty.style.display = 'block';
    }
  }

  function getAllTags() {
    const tags = new Set(['全部']);
    allPosts.forEach(p => p.tags.forEach(t => tags.add(t)));
    return [...tags];
  }

  function renderTagFilters() {
    const container = document.getElementById('blog-tag-filters');
    if (!container) return;
    const inner = container.querySelector('.container') || container;
    const tags = getAllTags();
    inner.innerHTML = tags.map(t =>
      `<button class="filter-btn${t === currentTag ? ' active' : ''}" data-tag="${t}">${t}</button>`
    ).join('');

    inner.addEventListener('click', (e) => {
      if (!e.target.classList.contains('filter-btn')) return;
      currentTag = e.target.dataset.tag;
      inner.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      renderPosts();
    });
  }

  function renderPosts() {
    const grid = document.getElementById('blog-grid');
    const empty = document.getElementById('blog-empty');
    if (!grid) return;

    const filtered = currentTag === '全部'
      ? allPosts
      : allPosts.filter(p => p.tags.includes(currentTag));

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    grid.innerHTML = filtered.map(p => `
      <a href="blog-post.html?post=${p.id}" class="card blog-card hover-lift" style="text-decoration:none;">
        <div class="blog-card-image">
          <span class="blog-icon">${p.icon || '📝'}</span>
        </div>
        <div class="blog-card-body">
          <div class="blog-card-meta">
            <span>${p.date}</span>
            <span class="dot"></span>
            <span>${p.readTime || '5 分钟阅读'}</span>
          </div>
          <h3>${p.title}</h3>
          <p>${p.excerpt}</p>
          <div class="blog-card-footer">
            ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
          </div>
        </div>
      </a>
    `).join('');

    // Re-trigger stagger
    grid.classList.remove('revealed');
    void grid.offsetWidth;
    grid.classList.add('revealed');
  }

  document.addEventListener('DOMContentLoaded', loadPosts);
})();
