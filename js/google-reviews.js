/**
 * Google Places Reviews widget — Smiling Barista
 *
 * Laadt automatisch echte Google-reviews via de Places JS API.
 * Valt terug op statische content als de API niet geconfigureerd is.
 *
 * Gebruik:
 *   GoogleReviews.init();   (na laden van google-config.js)
 */
const GoogleReviews = (() => {

  const FALLBACK_REVIEWS = [
    {
      author_name:       'Dietrich is de warmte zelf',
      rating:            5,
      text:              'Voor ieder een babbeltje, een lach en dat allemaal uit oprechte interesse! En natuurlijk is de koffie top. Hij geeft er met plezier wat uitleg bij ook!',
      relative_time:     'via Google',
      profile_photo_url: null,
    },
    {
      author_name:       'Evenement-klant',
      rating:            5,
      text:              'De Smiling Barista is absoluut fantastisch! Met hun vriendelijke service en heerlijke koffie brengen ze een glimlach op elk evenement. Hun enthousiasme is echt aanstekelijk!',
      relative_time:     'via Google',
      profile_photo_url: null,
    },
    {
      author_name:       'Teambuilding klant',
      rating:            5,
      text:              'De Velopresso was hét gesprekspunt op onze beursstand. Mensen bleven hangen voor een koffie én om meer te weten over ons merk. Absolute blikvanger!',
      relative_time:     'via Google',
      profile_photo_url: null,
    },
  ];

  function isConfigured() {
    const c = window.GOOGLE_CONFIG;
    return c && c.apiKey && c.placeId
      && !c.apiKey.includes('JOUW')
      && !c.placeId.includes('JOUW');
  }

  function init() {
    if (!isConfigured()) {
      renderReviews(FALLBACK_REVIEWS, null, null);
      return;
    }

    // Laad Google Maps JS API dynamisch
    window._sbGmapsReady = () => fetchReviews();
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${window.GOOGLE_CONFIG.apiKey}&libraries=places&callback=_sbGmapsReady`;
    s.async = true;
    s.defer = true;
    s.onerror = () => {
      console.warn('Google Maps API kon niet geladen worden — statische reviews worden getoond.');
      renderReviews(FALLBACK_REVIEWS, null, null);
    };
    document.head.appendChild(s);
  }

  function fetchReviews() {
    try {
      const dummy   = document.createElement('div');
      const service = new google.maps.places.PlacesService(dummy);
      service.getDetails(
        {
          placeId: window.GOOGLE_CONFIG.placeId,
          fields:  ['name', 'rating', 'reviews', 'user_ratings_total', 'url'],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place.reviews?.length) {
            renderReviews(place.reviews, place.rating, place.user_ratings_total, place.url);
          } else {
            console.warn('Google Places status:', status, '— statische reviews worden getoond.');
            renderReviews(FALLBACK_REVIEWS, null, null);
          }
        }
      );
    } catch (err) {
      console.warn('Google Reviews fout:', err);
      renderReviews(FALLBACK_REVIEWS, null, null);
    }
  }

  // ── Hulpfuncties ──

  function starsHtml(rating) {
    const full  = Math.round(rating);
    const empty = 5 - full;
    return `<span style="color:var(--caramel)">${'★'.repeat(full)}</span><span style="color:var(--border)">${'★'.repeat(empty)}</span>`;
  }

  function formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleDateString('nl-BE', { year: 'numeric', month: 'long' });
  }

  function avatarHtml(review) {
    const initials = review.author_name
      ? review.author_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
      : '?';
    if (review.profile_photo_url) {
      return `<img src="${review.profile_photo_url}" alt="${review.author_name}"
               style="width:100%;height:100%;object-fit:cover;border-radius:50%"
               referrerpolicy="no-referrer">`;
    }
    return initials;
  }

  function cardHtml(review) {
    const date = review.time ? formatDate(review.time) : (review.relative_time || '');
    const text = review.text || '';
    // Kap lange reviews in op 280 tekens
    const displayText = text.length > 280 ? text.slice(0, 277) + '…' : text;
    return `
      <div class="testi-card">
        <div class="testi-stars">${starsHtml(review.rating)}</div>
        <p class="testi-text">"${displayText}"</p>
        <div class="testi-author">
          <div class="testi-avatar">${avatarHtml(review)}</div>
          <div>
            <div class="testi-name">${review.author_name || 'Klant'}</div>
            <div class="testi-role">${date}${date ? ' · ' : ''}Google Review</div>
          </div>
        </div>
      </div>`;
  }

  function renderReviews(reviews, overallRating, totalCount, googleUrl) {
    // Badge met totaalscore
    const badge = document.getElementById('google-rating-badge');
    if (badge) {
      if (overallRating) {
        const rounded = Math.round(overallRating * 10) / 10;
        const link    = googleUrl ? `href="${googleUrl}" target="_blank" rel="noopener"` : '';
        badge.innerHTML = `
          <a ${link} class="google-badge" style="
            display:inline-flex;align-items:center;gap:.5rem;
            background:var(--white);border:1px solid var(--border);
            border-radius:var(--r-full);padding:.5rem 1.25rem;
            font-size:.9375rem;text-decoration:none;color:var(--text);
            box-shadow:var(--shadow-sm);margin-top:.75rem;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <strong>${rounded}</strong>
            <span style="color:var(--caramel)">${starsHtml(rounded)}</span>
            <span style="color:var(--text-light);font-size:.8125rem">(${totalCount} reviews)</span>
          </a>`;
      } else {
        badge.innerHTML = '';
      }
    }

    // Reviews grid
    const grid = document.getElementById('reviews-grid');
    if (!grid) return;

    const toShow = reviews.slice(0, 3); // max 3 op homepage
    grid.innerHTML = toShow.map(cardHtml).join('');

    // "Alle reviews bekijken" knop
    const moreBtn = document.getElementById('reviews-more-btn');
    if (moreBtn) {
      if (googleUrl) {
        moreBtn.href = googleUrl;
        moreBtn.style.display = 'inline-flex';
      } else {
        moreBtn.style.display = 'none';
      }
    }
  }

  return { init };
})();
