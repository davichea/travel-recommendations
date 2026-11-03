'use strict';

const SEARCH_CATEGORIES = {
  beach: ['beach', 'beaches'],
  temple: ['temple', 'temples'],
  country: ['country', 'countries']
};
const FALLBACKS = {
  beach: 'images/beach.svg',
  temple: 'images/temple.svg',
  country: 'images/country.svg'
};

let destinations = [];
let dataPromise;

async function loadDestinations() {
  if (!dataPromise) {
    dataPromise = fetch('travel_recommendation_api.json')
      .then(response => {
        if (!response.ok) throw new Error(`Unable to load destinations (${response.status})`);
        return response.json();
      })
      .then(data => {
        destinations = ['beach', 'temple', 'country'].flatMap(category =>
          (data[category] || []).map(place => ({...place, category}))
        );
        return destinations;
      })
      .catch(error => {
        dataPromise = undefined;
        throw error;
      });
  }
  return dataPromise;
}

function searchCategory(term) {
  const query = term.trim().toLowerCase();
  if (!query) return null;
  return Object.keys(SEARCH_CATEGORIES).find(category =>
    SEARCH_CATEGORIES[category].some(keyword => query.includes(keyword))
  ) || 'unknown';
}

function buildCard(place) {
  const article = document.createElement('article');
  article.className = 'destination-card';

  const image = document.createElement('img');
  image.src = place.image;
  image.alt = place.imageAlt || `View of ${place.name}`;
  image.loading = 'eager';
  image.onerror = function () {
    this.onerror = null;
    this.src = FALLBACKS[place.category];
  };

  const body = document.createElement('div');
  body.className = 'card-body';
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = place.category.toUpperCase();
  const title = document.createElement('h3');
  title.textContent = place.name;
  const description = document.createElement('p');
  description.textContent = place.description;
  const location = document.createElement('p');
  location.className = 'location';
  location.textContent = `⌖ ${place.location}`;

  body.append(tag, title, description, location);
  article.append(image, body);
  return article;
}

function displayMessage(heading, message) {
  const results = document.getElementById('results');
  if (!results) return;
  results.replaceChildren();
  const wrapper = document.createElement('div');
  wrapper.className = 'empty-state';
  const title = document.createElement('h3');
  title.textContent = heading;
  const detail = document.createElement('p');
  detail.textContent = message;
  wrapper.append(title, detail);
  results.append(wrapper);
}

async function searchDestination() {
  const input = document.getElementById('searchInput');
  const results = document.getElementById('results');
  const status = document.getElementById('searchStatus');
  const count = document.getElementById('resultCount');
  const heading = document.getElementById('results-heading');
  if (!input || !results) return;

  const category = searchCategory(input.value);
  if (!category) {
    displayMessage('What would you like to discover?', 'Type beach, temple, or country to see travel recommendations.');
    status.textContent = 'Please enter a search term.';
    count.textContent = '0 destinations';
    input.focus();
    return;
  }
  if (category === 'unknown') {
    displayMessage('No destinations found', 'Try searching for beach, temple, or country.');
    status.textContent = 'No matching category found.';
    count.textContent = '0 destinations';
    return;
  }

  status.textContent = 'Finding recommendations…';
  try {
    const data = await loadDestinations();
    const matches = data.filter(place => place.category === category);
    results.replaceChildren(...matches.map(buildCard));
    if (!matches.length) displayMessage('Nothing here yet', 'Try another category.');
    heading.textContent = `${category.charAt(0).toUpperCase()}${category.slice(1)} recommendations`;
    count.textContent = `${matches.length} destinations`;
    status.textContent = matches.length
      ? `Showing ${matches.length} ${category} recommendations for your search.`
      : 'No matches were found.';
    document.getElementById('recommendations').scrollIntoView({behavior:'smooth',block:'start'});
  } catch (error) {
    displayMessage('Recommendations unavailable', 'Unable to load destination data. If viewing files locally, use a local web server or deploy to GitHub Pages.');
    status.textContent = error.message;
    count.textContent = 'Could not load';
    console.error(error);
  }
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  const results = document.getElementById('results');
  if (!input || !results) return;
  input.value = '';
  document.getElementById('results-heading').textContent = 'Featured destinations';
  document.getElementById('resultCount').textContent = 'A little inspiration';
  document.getElementById('searchStatus').textContent = 'Pick a category above, or explore these featured places.';
  results.replaceChildren();
  const featured = [
    {name:'Island escapes',category:'beach',description:'Find your perfect stretch of sand and sea.',image:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=82'},
    {name:'Timeless wonders',category:'temple',description:'Explore history, architecture, and culture.',image:'https://images.unsplash.com/photo-1533676802871-eca1ae998cd5?w=900&q=82'},
    {name:'New horizons',category:'country',description:'See the world through a different lens.',image:'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=900&q=82'}
  ];
  featured.forEach(place => {
    const card = buildCard({...place,location:'Get inspired'});
    results.append(card);
  });
  input.focus();
}

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const subject = document.getElementById('contactSubject').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
    document.getElementById('formStatus').textContent = 'Opening your email application. Please review and send the draft there. The example email address must be replaced with your own.';
    window.location.href = `mailto:hello@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  const form = document.getElementById('searchForm');
  if (form) form.addEventListener('submit', event => {event.preventDefault(); searchDestination();});
  const clear = document.getElementById('clearButton');
  if (clear) clear.addEventListener('click', clearSearch);
  initContactForm();
});
