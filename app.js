const player = document.querySelector('#movie-player');
const placeholder = document.querySelector('#player-placeholder');
const playerTitle = document.querySelector('#player-title');
const openSource = document.querySelector('#open-youtube');
const search = document.querySelector('#movie-search');
const cards = [...document.querySelectorAll('.movie-card')];
const filters = [...document.querySelectorAll('.filter')];

for (const button of document.querySelectorAll('[data-playlist]')) {
  button.addEventListener('click', () => {
    const playlist = button.dataset.playlist;
    const title = button.dataset.title;
    player.src = `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlist)}&autoplay=1&rel=0`;
    player.title = title;
    player.hidden = false;
    placeholder.hidden = true;
    playerTitle.textContent = title;
    openSource.href = `https://www.youtube.com/playlist?list=${encodeURIComponent(playlist)}`;
    document.querySelector('#watch').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

let activeFilter = 'all';
function filterCards() {
  const term = search.value.trim().toLocaleLowerCase('ar');
  for (const card of cards) {
    const matchesCategory = activeFilter === 'all' || card.dataset.category === activeFilter;
    const matchesSearch = !term || card.dataset.search.toLocaleLowerCase('ar').includes(term);
    card.hidden = !(matchesCategory && matchesSearch);
  }
}
search.addEventListener('input', filterCards);
for (const button of filters) {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle('active', item === button));
    filterCards();
  });
}
