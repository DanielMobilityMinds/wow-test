(() => {
"use strict";
const root = document.getElementById("wow-campaign");
if (!root || root.dataset.wowReady) return;
root.dataset.wowReady = "true";
let hostOffset = 0;
const heroStage = root.querySelector('[data-hero-stage]');
const siteHeader = root.querySelector('.site-header');
const menuButton = root.querySelector('.menu-button');
const mobileNav = root.querySelector('.mobile-nav');
const mobileHero = window.matchMedia('(width < 720px)');
const tabletHero = window.matchMedia('(min-width: 720px) and (width < 1280px) and (not ((min-width: 1000px) and (min-height: 450px) and (min-aspect-ratio: 3/2) and (hover: hover) and (pointer: fine))), (min-width: 1280px) and (width < 1367px) and (aspect-ratio < 3/2) and (not ((min-width: 1000px) and (min-height: 450px) and (min-aspect-ratio: 3/2) and (hover: hover) and (pointer: fine))), (min-width: 1280px) and (height < 650px) and (not ((min-width: 1000px) and (min-height: 450px) and (min-aspect-ratio: 3/2) and (hover: hover) and (pointer: fine)))');
const desktopMotion = window.matchMedia('(min-width: 1367px) and (min-height: 650px), (min-width: 1280px) and (min-aspect-ratio: 3/2) and (min-height: 650px), (min-width: 1000px) and (min-height: 450px) and (min-aspect-ratio: 3/2) and (hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let keyboardNavigation = false;
const mobileDisclosure = window.matchMedia('(width < 720px)');
const supportsScrollPin = !document.querySelector('.m0010') && (CSS.supports?.('animation-timeline: scroll()') ?? false);
let heroFrame = 0;
let heroViewportHeight = 0;
let heroViewportWidth = 0;
let kineticCardsActive = null;
let cinematicOffersActive = null;
let cinematicFrameTime = null;

root.classList.add('has-motion');

const campaignNav = root.querySelector('.campaign-nav');
const campaignNavIndex = campaignNav?.querySelector('[data-campaign-nav-index]');
const campaignNavLinks = [...(campaignNav?.querySelectorAll('[data-campaign-nav-link]') ?? [])];
const campaignNavSections = [heroStage, ...campaignNavLinks.map((link) => root.querySelector(link.hash))].filter(Boolean);
let currentCampaignSectionId = 'top';

const setCampaignNavSection = (sectionId) => {
  currentCampaignSectionId = sectionId;
  const activeIndex = campaignNavLinks.findIndex((link) => link.hash === `#${sectionId}`);
  campaignNavLinks.forEach((link, index) => {
    if (index === activeIndex) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  if (campaignNavIndex && activeIndex >= 0) campaignNavIndex.textContent = String(activeIndex + 1).padStart(2, '0');

  const visible = desktopMotion.matches && activeIndex >= 0;
  campaignNav?.classList.toggle('is-visible', visible);
  campaignNav?.setAttribute('aria-hidden', String(!visible));
  if (campaignNav) campaignNav.inert = !visible;
};

if (campaignNav && campaignNavSections.length && 'IntersectionObserver' in window) {
  const intersectingCampaignSections = new Set();
  const campaignNavObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) intersectingCampaignSections.add(entry.target);
      else intersectingCampaignSections.delete(entry.target);
    });
    if (!intersectingCampaignSections.size) return;
    const viewportCenter = window.innerHeight / 2;
    const activeSection = [...intersectingCampaignSections].sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return Math.abs((aRect.top + aRect.bottom) / 2 - viewportCenter)
        - Math.abs((bRect.top + bRect.bottom) / 2 - viewportCenter);
    })[0];
    setCampaignNavSection(activeSection.id);
  }, { threshold: 0, rootMargin: '-43% 0px -43% 0px' });
  campaignNavSections.forEach((section) => campaignNavObserver.observe(section));
}

const syncCampaignNavForViewport = () => setCampaignNavSection(currentCampaignSectionId);
desktopMotion.addEventListener('change', syncCampaignNavForViewport);
window.addEventListener('resize', syncCampaignNavForViewport, { passive: true });
setCampaignNavSection(currentCampaignSectionId);

const menuLinks = [...(mobileNav?.querySelectorAll('a') ?? [])];

const setMenuOpen = (open, { restoreFocus = false } = {}) => {
  if (!menuButton || !mobileNav) return;
  menuButton.setAttribute('aria-expanded', String(open));
  mobileNav.setAttribute('aria-hidden', String(!open));
  mobileNav.inert = !open;
  mobileNav.classList.toggle('is-open', open);
  document.documentElement.classList.toggle('menu-open', open);

  if (!open && restoreFocus) menuButton.focus();
};

menuButton?.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  setMenuOpen(opening);
});

mobileNav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenuOpen(false);
});

document.addEventListener('keydown', (event) => {
  const menuOpen = menuButton?.getAttribute('aria-expanded') === 'true';
  if (event.key === 'Escape' && menuOpen) {
    event.preventDefault();
    setMenuOpen(false, { restoreFocus: true });
  }

  if (event.key === 'Tab' && menuOpen && menuLinks.length) {
    const first = menuLinks[0];
    const last = menuLinks.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      menuButton.focus();
    } else if (event.shiftKey && document.activeElement === menuButton) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === menuButton) {
      event.preventDefault();
      first.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      menuButton.focus();
    }
  }
});

window.addEventListener('pagehide', () => setMenuOpen(false));

const mobileMoreButtons = [...root.querySelectorAll('.mobile-more__toggle')];

const syncMobileMore = () => {
  mobileMoreButtons.forEach((button) => {
    const content = document.getElementById(button.getAttribute('aria-controls'));
    if (!content) return;
    const mobile = mobileDisclosure.matches;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.hidden = !mobile;
    content.hidden = false;
    content.inert = mobile && !expanded;
    content.classList.toggle('is-expanded', mobile && expanded);
    if (mobile) content.setAttribute('aria-hidden', String(!expanded));
    else content.removeAttribute('aria-hidden');
  });
};

mobileMoreButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    button.textContent = expanded ? 'Mehr anzeigen' : 'Weniger anzeigen';
    syncMobileMore();
  });
});

mobileDisclosure.addEventListener('change', syncMobileMore);
syncMobileMore();

const measureStableViewportHeight = () => {
  return Math.round(window.innerHeight - hostOffset);
};

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smoothstep = (from, to, value) => {
  const progress = clamp((value - from) / (to - from));
  return progress * progress * (3 - 2 * progress);
};
const smootherstep = (from, to, value) => {
  const progress = clamp((value - from) / (to - from));
  return progress * progress * progress * (progress * (progress * 6 - 15) + 10);
};
const easeOutBack = (progress) => {
  const amount = clamp(progress);
  const overshoot = 1.70158;
  return 1 + (overshoot + 1) * ((amount - 1) ** 3) + overshoot * ((amount - 1) ** 2);
};

const kineticCards = [
  {
    stage: root.querySelector('.offer--asx'),
    model: '[data-asx-model]', price: '[data-asx-price]', car: '[data-asx-car]',
    cta: '.offer__actions', legal: '[data-asx-legal]',
    modelY: 32, priceX: -48, priceY: 12, priceScale: .92,
    carX: 54, carY: 18, carScale: .94,
  },
  {
    stage: root.querySelector('[data-grandis-stage]'),
    model: '[data-grandis-model]', price: '[data-grandis-price]', car: '[data-grandis-car]',
    cta: '.offer__actions', legal: '[data-grandis-legal]',
    modelY: 30, priceX: -44, priceY: 12, priceScale: .93,
    carX: 48, carY: 16, carScale: .95,
  },
  {
    stage: root.querySelector('.offer--outlander'),
    model: '.offer__copy > h2, .offer__copy > .offer__eyebrow, .offer__copy > .offer__payment',
    price: '.price-art', car: '.offer__car', cta: '.offer__actions', legal: '.offer__legal',
    extra: '.wallbox-badge',
    modelY: 30, priceX: -46, priceY: 12, priceScale: .93,
    carX: 52, carY: 17, carScale: .945,
  },
  {
    stage: root.querySelector('.offer--black'),
    model: '.offer__copy > h2, .offer__copy > .offer__eyebrow, .offer__copy > .offer__payment',
    price: '.price-art', car: '.offer__car', cta: '.offer__actions', legal: '.offer__legal',
    extra: '.wallbox-badge',
    modelY: 30, priceX: -46, priceY: 12, priceScale: .93,
    carX: 50, carY: 17, carScale: .945,
  },
  {
    stage: root.querySelector('.offer--eclipse'),
    model: '.offer__copy > h2, .offer__copy > .offer__eyebrow',
    price: '.price-art', car: '.offer__car', cta: '.offer__actions', legal: '.offer__legal',
    details: '.offer__availability', extra: '.wallbox-badge', subsidy: '.offer__subsidy',
    modelY: 30, priceX: -44, priceY: 12, priceScale: .93,
    carX: 48, carY: 16, carScale: .95,
  },
  {
    stage: root.querySelector('.offer--l200'),
    model: '.offer__copy > h2', price: '.coming', car: '.offer__car', cta: '.offer__copy > .cta', legal: '.offer__legal',
    details: '.offer__description, .offer__from',
    modelY: 32, priceX: -48, priceY: 12, priceScale: .92,
    carX: 56, carY: 18, carScale: .94,
  },
]
  .filter((card) => card.stage)
  .map((card) => {
    const models = [...card.stage.querySelectorAll(card.model)];
    const details = card.details ? [...card.stage.querySelectorAll(card.details)] : [];
    const price = card.stage.querySelector(card.price);
    const car = card.stage.querySelector(card.car);
    const cta = card.stage.querySelector(card.cta);
    const legal = card.legal ? card.stage.querySelector(card.legal) : null;
    const extra = card.extra ? card.stage.querySelector(card.extra) : null;
    const subsidy = card.subsidy ? card.stage.querySelector(card.subsidy) : null;

    return {
      ...card,
      elements: { models, details, price, car, cta, legal, extra, subsidy },
      animatedElements: [
        ...models, price, car, cta, legal, ...details, extra, subsidy,
      ].filter(Boolean),
    };
  });

const clearKineticStyle = (element) => {
  if (!element) return;
  [
    'opacity', 'transform', 'clip-path', 'transition',
    '--motion-x', '--motion-y', '--motion-scale',
  ].forEach((property) => element.style.removeProperty(property));
};

const applyKineticStyle = (element, progress, x, y, scale = 1, clipped = false) => {
  if (!element) return;
  const inverse = 1 - progress;
  const currentScale = scale + (1 - scale) * progress;
  element.style.setProperty('opacity', progress.toFixed(4));
  element.style.setProperty('transform', `translate3d(${(x * inverse).toFixed(2)}px, ${(y * inverse).toFixed(2)}px, 0) scale(${currentScale.toFixed(4)})`);
  element.style.setProperty('transition', 'none');
  if (clipped) element.style.setProperty('clip-path', `inset(${(inverse * 100).toFixed(2)}% 0 0 0)`);
};

const applyKineticCarStyle = (element, progress, x, y, scale = 1) => {
  if (!element) return;
  const inverse = 1 - progress;
  const currentScale = scale + (1 - scale) * progress;
  element.style.setProperty('opacity', progress.toFixed(4));
  element.style.setProperty('--motion-x', `${(x * inverse).toFixed(2)}px`);
  element.style.setProperty('--motion-y', `${(y * inverse).toFixed(2)}px`);
  element.style.setProperty('--motion-scale', currentScale.toFixed(4));
  element.style.setProperty('transition', 'none');
};

const elementViewportProgress = (element, stage, frameHeight, start, end) => {
  if (!element) return 0;
  let offset = 0;
  let node = element;
  while (node && node !== stage) {
    offset += node.offsetTop || 0;
    node = node.offsetParent;
  }
  const layoutTop = node === stage
    ? stage.getBoundingClientRect().top + offset
    : element.getBoundingClientRect().top;
  return clamp((frameHeight * start - layoutTop) / (frameHeight * (start - end)));
};

function renderKineticCards() {
  const active = (mobileHero.matches || tabletHero.matches) && !reducedMotion.matches && !keyboardNavigation;
  const frameHeight = tabletHero.matches ? measureStableViewportHeight() : (heroViewportHeight || window.innerHeight);

  if (!active && kineticCardsActive === false) return;

  kineticCards.forEach((card) => {
    if (!active) {
      card.animatedElements.forEach(clearKineticStyle);
      return;
    }

    const stageRect = card.stage.getBoundingClientRect();
    if (stageRect.bottom < -frameHeight * .35 || stageRect.top > frameHeight * 1.55) return;

    const { models, details, price, car, cta, legal, extra, subsidy } = card.elements;
    const distance = 1;
    const modelAnchors = [[.94, .8], [.92, .78], [.9, .76]];
    models.forEach((element, index) => {
      const anchors = modelAnchors[index] || modelAnchors.at(-1);
      const progress = elementViewportProgress(element, card.stage, frameHeight, anchors[0], anchors[1]);
      applyKineticStyle(element, smootherstep(0, 1, progress), 0, card.modelY * distance, 1, true);
    });

    const priceProgress = elementViewportProgress(price, card.stage, frameHeight, .88, .67);
    const carProgress = elementViewportProgress(car, card.stage, frameHeight, .9, .64);
    applyKineticStyle(
      price,
      smootherstep(0, 1, priceProgress),
      card.priceX * distance,
      card.priceY * distance,
      card.priceScale,
    );
    const easedCar = smootherstep(0, 1, carProgress);
    applyKineticStyle(car, easedCar, card.carX, card.carY, card.carScale);
    details.forEach((element, index) => {
      const progress = elementViewportProgress(element, card.stage, frameHeight, 1.02 - index * .02, .84 - index * .02);
      applyKineticStyle(element, smootherstep(0, 1, progress), 0, 22);
    });
    applyKineticStyle(
      extra,
      smootherstep(0, 1, elementViewportProgress(extra, card.stage, frameHeight, 1.04, .84)),
      30,
      0,
      .96,
    );
    clearKineticStyle(subsidy);
    applyKineticStyle(cta, smootherstep(0, 1, elementViewportProgress(cta, card.stage, frameHeight, 1.06, .88)), 0, 24);
    applyKineticStyle(legal, smootherstep(0, 1, elementViewportProgress(legal, card.stage, frameHeight, 1.14, .98)), 0, 20);
  });

  kineticCardsActive = active;
}

const cinematicOffers = [
  {
    selector: '.offer--asx',
    entryLead: .75,
    price: { x: .18, y: -.26, scale: .72, start: .04, end: .42, rotate: -.7 },
    car: { x: -.2, y: .3, scale: .52, start: .02, end: .58, rotate: .45 },
    copy: { start: .28, end: .5 }, cta: .58,
  },
  {
    selector: '.offer--grandis',
    price: { x: -.12, y: -.2, scale: .58, start: .07, end: .52, rotate: .35 },
    car: { x: .16, y: .28, scale: .44, start: .06, end: .66, rotate: -.25 },
    copy: { start: .34, end: .6 }, cta: .64,
  },
  {
    selector: '.offer--outlander',
    price: { x: .16, y: -.31, scale: .88, start: .06, end: .52, rotate: -.6 },
    car: { x: -.26, y: .38, scale: .72, start: .04, end: .68, rotate: .35 },
    copy: { start: .34, end: .62 }, cta: .7,
    extra: { start: .58, end: .74, x: .12, y: -.08, scale: .72 },
  },
  {
    selector: '.offer--black',
    price: { x: -.12, y: -.25, scale: .78, start: .07, end: .5, rotate: .55 },
    car: { x: .22, y: .32, scale: .64, start: .05, end: .62, rotate: -.35 },
    copy: { start: .36, end: .62 }, cta: .7,
    extra: { start: .65, end: .82, x: .1, y: -.06, scale: .76 },
  },
  {
    selector: '.offer--eclipse',
    price: { x: .14, y: -.2, scale: .62, start: .04, end: .44, rotate: -.45 },
    car: { x: -.16, y: .4, scale: .56, start: .03, end: .58, rotate: .55 },
    copy: { start: .27, end: .52 }, cta: .72,
    extra: { start: .54, end: .7, x: .14, y: -.08, scale: .72 },
    subsidy: { start: .64, end: .8, x: .08, y: .1, scale: .7 },
  },
  {
    selector: '.offer--l200',
    price: { x: -.08, y: -.14, scale: .42, start: .08, end: .6, rotate: .2 },
    car: { x: .18, y: .34, scale: .58, start: .06, end: .78, rotate: -.2 },
    copy: { start: .3, end: .6 }, cta: .68,
  },
]
  .map((config) => ({ ...config, stage: root.querySelector(config.selector) }))
  .filter((offer) => offer.stage)
  .map((offer) => ({
    ...offer,
    elements: {
      price: offer.stage.querySelector('.price-art, .coming'),
      car: offer.stage.querySelector('.offer__car'),
      extra: offer.stage.querySelector('.wallbox-badge'),
      subsidy: offer.stage.querySelector('.offer__subsidy'),
      cta: offer.stage.querySelector('.offer__actions, .offer__copy > .cta'),
    },
    currentProgress: null,
    lastWrittenProgress: null,
  }));

campaignNavLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = root.querySelector(link.hash);
    if (!target || !desktopMotion.matches || reducedMotion.matches) return;

    event.preventDefault();
    const targetOffer = cinematicOffers.find((offer) => offer.stage === target);
    const scrollDistance = targetOffer ? Math.max(0, target.offsetHeight - window.innerHeight) : 0;
    const targetTop = window.scrollY + target.getBoundingClientRect().top + scrollDistance;
    const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;

    if (targetOffer) {
      targetOffer.currentProgress = 1;
      targetOffer.lastWrittenProgress = null;
    }

    window.scrollTo({ top: Math.min(targetTop, maxScrollTop), behavior: 'instant' });
    history.pushState(null, '', link.hash);
    setCampaignNavSection(target.id);
    requestHeroRender();
  });
});

const cinematicProperties = [
  '--cin-p', '--cin-copy-p', '--cin-price-p', '--cin-price-x', '--cin-price-y', '--cin-price-scale', '--cin-price-rotate',
  '--cin-car-p', '--cin-car-x', '--cin-car-y', '--cin-car-scale', '--cin-car-rotate',
  '--cin-extra-p', '--cin-extra-x', '--cin-extra-y', '--cin-extra-scale',
  '--cin-subsidy-p', '--cin-subsidy-x', '--cin-subsidy-y', '--cin-subsidy-scale',
  '--cin-cta-p', '--cin-cta-x', '--cin-cta-scale', '--cin-cta-clip', '--cin-legal-p', '--cin-detail-p',
];

const setCinematicNumber = (stage, property, value) => {
  stage.style.setProperty(property, Number(value).toFixed(4));
};

const clearCinematicOffer = (offer) => {
  cinematicProperties.forEach((property) => offer.stage.style.removeProperty(property));
  offer.stage.classList.remove('is-cinematic', 'is-cinematic-active', 'is-cinematic-actions-ready');
  if (offer.elements.cta) offer.elements.cta.inert = false;
  offer.currentProgress = null;
  offer.lastWrittenProgress = null;
  cinematicFrameTime = null;
};

function renderCinematicOffers(frameTime = performance.now()) {
  const active = desktopMotion.matches && !root.hasAttribute('data-wow-reference-flow') && !reducedMotion.matches && !keyboardNavigation;
  const frameWidth = window.innerWidth;
  const frameHeight = measureStableViewportHeight();
  const motionWidth = Math.min(frameWidth, 1440);
  const motionHeight = Math.min(frameHeight, 940);
  const deltaTime = cinematicFrameTime === null ? 1000 / 60 : clamp(frameTime - cinematicFrameTime, 1, 34);
  const damping = 1 - Math.exp(-deltaTime / 45);
  cinematicFrameTime = frameTime;

  if (!active && cinematicOffersActive === false) return;

  if (!active) {
    cinematicOffers.forEach(clearCinematicOffer);
    cinematicOffersActive = false;
    return;
  }

  cinematicOffers.forEach((offer) => offer.stage.classList.add('is-cinematic'));

  /* Read every stage before writing animation styles to avoid layout thrashing. */
  const offerMeasurements = cinematicOffers.map((offer) => ({
    offer,
    rect: offer.stage.getBoundingClientRect(),
    height: offer.stage.offsetHeight,
  }));

  let needsAnotherFrame = false;

  offerMeasurements.forEach(({ offer, rect, height }) => {
    const entryLead = (offer.entryLead ?? 0) * frameHeight;
    const distance = Math.max(1, height - frameHeight + entryLead);
    const targetProgress = clamp((entryLead + hostOffset - rect.top) / distance);
    const nearViewport = rect.bottom > -frameHeight * .2 && rect.top < frameHeight * 1.2;

    if (offer.currentProgress === null || !nearViewport) {
      offer.currentProgress = targetProgress;
    } else {
      const delta = targetProgress - offer.currentProgress;
      if (Math.abs(delta) > .001) {
        offer.currentProgress += delta * damping;
        needsAnotherFrame = true;
      } else {
        offer.currentProgress = targetProgress;
      }
    }

    const progress = offer.currentProgress;
    const priceProgress = smootherstep(offer.price.start, offer.price.end, progress);
    const carProgress = smootherstep(offer.car.start, offer.car.end, progress);
    const copyProgress = smootherstep(offer.copy.start, offer.copy.end, progress);
    const legalProgress = smootherstep(.48, .6, progress);
    const ctaStart = offer.cta - .06;
    const ctaEnd = offer.cta + .08;
    const ctaRawProgress = clamp((progress - ctaStart) / (ctaEnd - ctaStart));
    const ctaProgress = smootherstep(ctaStart, ctaEnd, progress);
    const ctaImpact = easeOutBack(ctaRawProgress);
    const extraMotion = offer.extra ?? { start: .7, end: .9, x: .12, y: -.08, scale: .72 };
    const subsidyMotion = offer.subsidy ?? { start: .74, end: .92, x: .08, y: .1, scale: .7 };
    const extraProgress = smootherstep(extraMotion.start, extraMotion.end, progress);
    const subsidyProgress = smootherstep(subsidyMotion.start, subsidyMotion.end, progress);

    offer.stage.classList.toggle('is-cinematic-active', nearViewport);
    offer.stage.classList.toggle('is-cinematic-actions-ready', progress >= ctaStart);
    if (offer.elements.cta) offer.elements.cta.inert = progress < offer.cta + .02;

    if (!nearViewport && offer.lastWrittenProgress === progress) return;

    setCinematicNumber(offer.stage, '--cin-p', progress);
    setCinematicNumber(offer.stage, '--cin-copy-p', copyProgress);
    setCinematicNumber(offer.stage, '--cin-price-p', smoothstep(Math.max(0, offer.price.start - .03), offer.price.start + .15, progress));
    offer.stage.style.setProperty('--cin-price-x', `${((1 - priceProgress) * motionWidth * offer.price.x).toFixed(2)}px`);
    offer.stage.style.setProperty('--cin-price-y', `${((1 - priceProgress) * motionHeight * offer.price.y).toFixed(2)}px`);
    setCinematicNumber(offer.stage, '--cin-price-scale', 1 + (1 - priceProgress) * offer.price.scale);
    offer.stage.style.setProperty('--cin-price-rotate', `${((1 - priceProgress) * offer.price.rotate).toFixed(3)}deg`);
    setCinematicNumber(offer.stage, '--cin-car-p', smoothstep(Math.max(0, offer.car.start - .02), offer.car.start + .18, progress));
    offer.stage.style.setProperty('--cin-car-x', `${((1 - carProgress) * motionWidth * offer.car.x).toFixed(2)}px`);
    offer.stage.style.setProperty('--cin-car-y', `${((1 - carProgress) * motionHeight * offer.car.y).toFixed(2)}px`);
    setCinematicNumber(offer.stage, '--cin-car-scale', 1 + (1 - carProgress) * offer.car.scale);
    offer.stage.style.setProperty('--cin-car-rotate', `${((1 - carProgress) * offer.car.rotate).toFixed(3)}deg`);
    if (offer.elements.extra) {
      setCinematicNumber(offer.stage, '--cin-extra-p', extraProgress);
      offer.stage.style.setProperty('--cin-extra-x', `${((1 - extraProgress) * motionWidth * extraMotion.x).toFixed(2)}px`);
      offer.stage.style.setProperty('--cin-extra-y', `${((1 - extraProgress) * motionHeight * extraMotion.y).toFixed(2)}px`);
      setCinematicNumber(offer.stage, '--cin-extra-scale', extraMotion.scale + extraProgress * (1 - extraMotion.scale));
    }
    if (offer.elements.subsidy) {
      setCinematicNumber(offer.stage, '--cin-subsidy-p', subsidyProgress);
      offer.stage.style.setProperty('--cin-subsidy-x', `${((1 - subsidyProgress) * motionWidth * subsidyMotion.x).toFixed(2)}px`);
      offer.stage.style.setProperty('--cin-subsidy-y', `${((1 - subsidyProgress) * motionHeight * subsidyMotion.y).toFixed(2)}px`);
      setCinematicNumber(offer.stage, '--cin-subsidy-scale', subsidyMotion.scale + subsidyProgress * (1 - subsidyMotion.scale));
    }
    setCinematicNumber(offer.stage, '--cin-cta-p', ctaProgress);
    offer.stage.style.setProperty('--cin-cta-x', `${((1 - ctaProgress) * -56).toFixed(2)}px`);
    setCinematicNumber(offer.stage, '--cin-cta-scale', .84 + ctaImpact * .16);
    offer.stage.style.setProperty('--cin-cta-clip', `${((1 - ctaProgress) * 100).toFixed(2)}%`);
    setCinematicNumber(offer.stage, '--cin-legal-p', legalProgress);
    setCinematicNumber(offer.stage, '--cin-detail-p', copyProgress);
    offer.lastWrittenProgress = progress;
  });

  cinematicOffersActive = active;
  if (needsAnotherFrame) requestHeroRender();
  else cinematicFrameTime = null;
}

const renderHero = (frameTime) => {
  heroFrame = 0;
  const desktopHeroActive = Boolean(heroStage && desktopMotion.matches && !reducedMotion.matches);
  heroStage?.classList.toggle('is-desktop-cinematic', desktopHeroActive);
  const heroRect = heroStage?.getBoundingClientRect();
  const heroHeight = heroStage?.offsetHeight ?? 0;
  renderCinematicOffers(frameTime);
  if (heroStage && (tabletHero.matches || desktopHeroActive) && !reducedMotion.matches) {
    const frameHeight = measureStableViewportHeight();
    const rect = heroRect;
    const distance = Math.max(1, heroHeight - frameHeight);
    const progress = clamp((hostOffset - rect.top) / distance);
    const cinematic = smootherstep(0, 1, progress);
    const zoom = 1 + cinematic * 2.4;
    const fade = 1 - smoothstep(.94, 1, progress);
    const copyFade = 1 - smoothstep(.05, .3, progress);
    const bloom = smoothstep(.18, .62, progress) * (1 - smoothstep(.84, 1, progress));

    renderKineticCards();
    if (siteHeader) {
      siteHeader.style.removeProperty('opacity');
      siteHeader.style.removeProperty('transform');
      siteHeader.style.removeProperty('pointer-events');
    }
    heroStage.style.removeProperty('--hero-frame-h');
    heroStage.style.removeProperty('--hero-stage-h');
    heroStage.style.removeProperty('--hero-pin-y');
    heroStage.style.removeProperty('--hero-pin-distance');
    heroStage.style.removeProperty('--hero-wow-top');
    heroStage.style.removeProperty('--hero-copy-bottom');
    heroStage.style.setProperty('--hero-drift-y', `${Math.round(frameHeight * .06)}px`);
    heroStage.style.setProperty('--hero-p', progress.toFixed(4));
    heroStage.style.setProperty('--hero-zoom', zoom.toFixed(4));
    heroStage.style.setProperty('--hero-fade', fade.toFixed(4));
    heroStage.style.setProperty('--hero-copy-fade', copyFade.toFixed(4));
    heroStage.style.setProperty('--hero-bloom', bloom.toFixed(4));
    return;
  }

  if (!heroStage || !mobileHero.matches || reducedMotion.matches) {
    renderKineticCards();
    if (!mobileHero.matches) {
      root.style.removeProperty('--mobile-frame-h');
      root.style.removeProperty('--hero-pin-distance');
    }
    if (siteHeader) {
      siteHeader.style.removeProperty('opacity');
      siteHeader.style.removeProperty('transform');
      siteHeader.style.removeProperty('pointer-events');
    }
    heroStage?.style.removeProperty('--hero-frame-h');
    heroStage?.style.removeProperty('--hero-stage-h');
    heroStage?.style.removeProperty('--hero-pin-y');
    heroStage?.style.removeProperty('--hero-pin-distance');
    heroStage?.style.removeProperty('--hero-wow-top');
    heroStage?.style.removeProperty('--hero-copy-bottom');
    heroStage?.style.removeProperty('--hero-drift-y');
    heroStage?.style.removeProperty('--hero-p');
    heroStage?.style.removeProperty('--hero-zoom');
    heroStage?.style.removeProperty('--hero-fade');
    heroStage?.style.removeProperty('--hero-copy-fade');
    heroStage?.style.removeProperty('--hero-bloom');
    return;
  }

  if (!heroViewportHeight || Math.abs(window.innerWidth - heroViewportWidth) > 40) {
    heroViewportHeight = measureStableViewportHeight();
    heroViewportWidth = window.innerWidth;
    root.style.setProperty('--mobile-frame-h', `${heroViewportHeight}px`);
    root.style.setProperty('--hero-pin-distance', `${Math.round(heroViewportHeight * .9)}px`);
    heroStage.style.setProperty('--hero-frame-h', `${heroViewportHeight}px`);
    heroStage.style.setProperty('--hero-stage-h', `${Math.round(heroViewportHeight * 1.9)}px`);
    heroStage.style.setProperty('--hero-pin-distance', `${Math.round(heroViewportHeight * .9)}px`);
    heroStage.style.setProperty('--hero-wow-top', `${Math.round(clamp(heroViewportHeight * .23, 152, 194))}px`);
    heroStage.style.setProperty('--hero-copy-bottom', `${Math.round(clamp(heroViewportHeight * .09, 58, 76))}px`);
    heroStage.style.setProperty('--hero-drift-y', `${Math.round(heroViewportHeight * .17)}px`);
  }

  const rect = heroRect;
  const distance = Math.max(1, heroHeight - heroViewportHeight);
  const progress = clamp((hostOffset - rect.top) / distance);
  const pinY = clamp(hostOffset - rect.top, 0, distance);
  if (rect.bottom < heroViewportHeight * 1.35) renderKineticCards();
  if (supportsScrollPin) return;
  const cinematic = smoothstep(0, 1, progress);
  const zoom = 1 + cinematic * 5;
  const fade = 1 - smoothstep(.68, .94, progress);
  const copyFade = 1 - smoothstep(.06, .34, progress);
  const bloom = smoothstep(.26, .7, progress) * (1 - smoothstep(.82, 1, progress));
  const headerExit = smootherstep(.025, .22, progress);

  if (siteHeader) {
    siteHeader.style.setProperty('opacity', (1 - headerExit).toFixed(4));
    siteHeader.style.setProperty('transform', `translate3d(0, ${(-18 * headerExit).toFixed(2)}px, 0) scale(${(1 - .015 * headerExit).toFixed(4)})`);
    siteHeader.style.setProperty('pointer-events', progress > .22 ? 'none' : 'auto');
  }

  heroStage.style.setProperty('--hero-p', progress.toFixed(4));
  if (!supportsScrollPin) heroStage.style.setProperty('--hero-pin-y', `${pinY.toFixed(2)}px`);
  heroStage.style.setProperty('--hero-zoom', zoom.toFixed(4));
  heroStage.style.setProperty('--hero-fade', fade.toFixed(4));
  heroStage.style.setProperty('--hero-copy-fade', copyFade.toFixed(4));
  heroStage.style.setProperty('--hero-bloom', bloom.toFixed(4));
};

const requestHeroRender = () => {
  if (!heroFrame) heroFrame = window.requestAnimationFrame(renderHero);
};

// Scroll-gated CTAs must be reachable before the browser advances Tab focus.
// Keep this mode for the visit so subsequent animation frames cannot hide focus.
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab' || keyboardNavigation) return;
  keyboardNavigation = true;
  root.setAttribute('data-wow-keyboard', '');
  renderKineticCards();
  renderCinematicOffers(performance.now());
}, { capture: true });

window.addEventListener('scroll', requestHeroRender, { passive: true });
window.addEventListener('resize', requestHeroRender, { passive: true });
mobileHero.addEventListener('change', requestHeroRender);
tabletHero.addEventListener('change', requestHeroRender);
desktopMotion.addEventListener('change', requestHeroRender);
reducedMotion.addEventListener('change', requestHeroRender);
requestHeroRender();

const observeVisibility = (selector, className, ratio, thresholds, rootMargin) => {
  const elements = root.querySelectorAll(selector);
  if (!elements.length) return;
  if (!('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add(className));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle(className, entry.intersectionRatio >= ratio);
    });
  }, { threshold: thresholds, rootMargin });

  elements.forEach((element) => observer.observe(element));
};

observeVisibility('.offer__subsidy', 'is-sticker-visible', .3, [0, .3, .6], '0px 0px -10% 0px');
observeVisibility('.guarantee__polaroids', 'is-polaroids-visible', .18, [0, .18, .4], '0px 0px -6% 0px');


// Observe the actual Mitsubishi navigation; do not modify the host header.
const hostHeader = document.querySelector('.m0010');
root.toggleAttribute('data-wow-host-header', Boolean(hostHeader));
const syncHostGeometry = () => {
  const headerRect = hostHeader?.getBoundingClientRect();
  const fixed = hostHeader && ['fixed', 'sticky'].includes(getComputedStyle(hostHeader).position);
  const next = fixed ? Math.max(0, Math.round(headerRect.bottom)) : 0;
  if (next !== hostOffset) heroViewportHeight = 0;
  hostOffset = next;
  root.style.setProperty('--wow-host-offset', `${hostOffset}px`);
  root.style.setProperty('--wow-frame-h', `${Math.max(1, window.innerHeight - hostOffset)}px`);
  root.style.setProperty('--header-h', '0px');
  // Reference geometry is shared by every model; do not resize parts separately.
  const availableHeight = Math.max(1, window.innerHeight - hostOffset);
  root.toggleAttribute("data-wow-compact-hero", availableHeight < 650);
  if (heroViewportHeight !== availableHeight) heroViewportHeight = 0;
  const referenceLayout = desktopMotion.matches && (root.clientWidth < 1460 || availableHeight < 700);
  const widthScale = Math.min(1, root.clientWidth * (1 - 196 / 1460) / 1248);
  const referenceScale = Math.min(widthScale, Math.max(.65, availableHeight / 780));
  root.toggleAttribute('data-wow-reference-layout', referenceLayout);
  root.toggleAttribute('data-wow-reference-flow', referenceLayout && 780 * referenceScale > availableHeight + 1);
  root.style.setProperty('--wow-reference-scale', String(referenceScale));
  root.style.setProperty('--wow-reference-h', `${780 * referenceScale}px`);

  requestHeroRender();
};
if (hostHeader && 'ResizeObserver' in window) new ResizeObserver(syncHostGeometry).observe(hostHeader);
window.addEventListener('resize', syncHostGeometry, { passive: true });
desktopMotion.addEventListener('change', syncHostGeometry);
syncHostGeometry();

// Capture only campaign anchor navigation to avoid the host's generic 175px handler.
const followCampaignAnchor = (anchor, updateHistory) => {
  const hash = anchor?.hash || window.location.hash;
  if (!hash || !hash.startsWith('#wow-fn-')) return false;
  const target = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!target || !root.contains(target)) return false;
  const top = target.getBoundingClientRect().top + window.scrollY - hostOffset - 24;
  window.scrollTo({ top, behavior: 'instant' });
  if (updateHistory && window.location.hash !== hash) history.pushState(null, '', hash);
  if (hash.startsWith('#wow-fn-')) target.focus({ preventScroll: true });
  requestHeroRender();
  return true;
};
root.addEventListener('click', (event) => {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
  const anchor = event.target.closest('a[href^="#"]');
  if (!anchor || !followCampaignAnchor(anchor, true)) return;
  event.preventDefault();
  event.stopPropagation();
}, true);
window.addEventListener('hashchange', () => followCampaignAnchor(null, false));
window.addEventListener('load', () => followCampaignAnchor(null, false));

})();
