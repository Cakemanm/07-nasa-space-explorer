// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

const getImagesBtn = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');
const factText = document.getElementById('factText');

// api
const API_KEY = 'mygOYjfgYfRF0ZA2Qeezw0ofGInj80iOJc4Qmc8o';
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

// levelup: random fact
const spaceFacts = [
  "A day on Venus is longer than a year on Venus.",
  "Neutron stars can spin at a rate of 600 rotations per second.",
  "There are more stars in the universe than grains of sand on every beach on Earth.",
  "The footprints left by astronauts on the Moon will likely stay there for millions of years.",
  "One million Earths could fit inside the Sun.",
  "Space is completely silent — there is no atmosphere for sound to travel through.",
  "The Sun accounts for 99.86% of the mass in the entire solar system.",
  "A full NASA space suit costs about $12 million, most of it for the backpack and control module.",
  "Saturn could float in water because it's mostly made of gas and is less dense than water.",
  "The Milky Way galaxy is on a collision course with the Andromeda galaxy — in about 4.5 billion years.",
  "Venus is the hottest planet in our solar system, even though Mercury is closer to the Sun.",
  "There's a giant storm on Jupiter, the Great Red Spot, that has been raging for over 350 years."
];

function showRandomFact() {
  if (!factText) return;
  const fact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
  factText.textContent = fact;
}

showRandomFact();

// gallery
function showLoadingMessage() {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">🔄</div>
      <p>Loading space photos…</p>
    </div>
  `;
}

function showErrorMessage(message) {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">⚠️</div>
      <p>${message}</p>
    </div>
  `;
}

async function fetchSpaceImages(startDate, endDate) {
  const url = `${APOD_URL}?api_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`NASA API request failed with status ${response.status}`);
  }

  const data = await response.json();

  const entries = Array.isArray(data) ? data : [data];

  entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  return entries;
}

function isDirectVideoFile(url) {
  return /\.(mp4|mov|webm|ogg)(\?.*)?$/i.test(url);
}

function createVideoNode(entry, { large }) {
  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  if (!large) video.muted = true;
  video.style.width = '100%';
  video.style.borderRadius = '6px';
  if (!large) {
    video.style.height = '200px';
    video.style.objectFit = 'cover';
  }
  video.src = entry.url; 
  video.load(); 

  video.addEventListener('click', (e) => e.stopPropagation());

  return video;
}

function createVideoThumbNode() {
  const div = document.createElement('div');
  div.className = 'video-thumb';
  div.innerHTML = `
    <div class="video-icon">▶</div>
    <p class="video-label">Video: click to watch</p>
  `;
  return div;
}

function createVideoIframeNode(entry) {
  const wrapper = document.createElement('div');
  wrapper.className = 'modal-video';
  wrapper.innerHTML = `
    <iframe src="${entry.url}" title="${entry.title}" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen></iframe>
  `;
  return wrapper;
}

function createGalleryItem(entry) {
  const item = document.createElement('div');
  item.classList.add('gallery-item');

  if (entry.media_type === 'video') {
    // levelup handle video entries
    // embeddable links get a click to watch thumbnail
    const mediaNode = isDirectVideoFile(entry.url)
      ? createVideoNode(entry, { large: false })
      : createVideoThumbNode();

    item.appendChild(mediaNode);

    const title = document.createElement('h3');
    title.textContent = entry.title;
    const date = document.createElement('p');
    date.textContent = entry.date;
    item.appendChild(title);
    item.appendChild(date);

    item.addEventListener('click', () => openModal(entry));
  } else {
    item.innerHTML = `
      <img src="${entry.url}" alt="${entry.title}" />
      <h3>${entry.title}</h3>
      <p>${entry.date}</p>
    `;
    item.addEventListener('click', () => openModal(entry));
  }

  return item;
}

function displayGallery(entries) {
  gallery.innerHTML = '';

  entries.forEach((entry) => {
    const item = createGalleryItem(entry);
    gallery.appendChild(item);
  });
}

async function handleGetImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    showErrorMessage('Please select both a start and end date.');
    return;
  }

  showLoadingMessage();

  try {
    const entries = await fetchSpaceImages(startDate, endDate);
    displayGallery(entries);
  } catch (error) {
    console.error('Error fetching APOD data:', error);
    showErrorMessage('Something went wrong fetching space images. Please try again.');
  }
}

getImagesBtn.addEventListener('click', handleGetImages);

// modal View

const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');

function openModal(entry) {
  const mediaHTML = entry.media_type === 'video'
    ? `<div class="modal-video">
         <iframe
           src="${entry.url}"
           title="${entry.title}"
           frameborder="0"
           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
           allowfullscreen>
         </iframe>
       </div>`
    : `<img src="${entry.hdurl || entry.url}" alt="${entry.title}" />`;

  modalContent.innerHTML = `
    ${mediaHTML}
    <h2>${entry.title}</h2>
    <p class="modal-date">${entry.date}</p>
    <p class="modal-explanation">${entry.explanation}</p>
  `;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
  modalContent.innerHTML = '';
}

modalClose.addEventListener('click', closeModal);

// Close modal when clicking outside
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

// Close modal on esc
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.classList.contains('open')) {
    closeModal();
  }
});

// Load default 9 day range on page load
handleGetImages();
