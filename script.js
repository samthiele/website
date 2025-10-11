// === Horizontal Swipers (nested) ===
document.querySelectorAll('.swiper-h').forEach((el) => {
  new Swiper(el, {
    direction: 'horizontal',
    spaceBetween: 25,
    effect: 'cube',
    cubeEffect: {
      shadow: false,
      slideShadows: false,
      shadowOffset: 0,
      shadowScale: 0.8,
    },
    navigation: {
      nextEl: el.querySelector('.swiper-button-next'),
      prevEl: el.querySelector('.swiper-button-prev'),
    },
    pagination: {
      el: el.querySelector('.swiper-pagination-h'),
      clickable: true,
      renderBullet: function (index, className) {
        return `<span class="${className}">${index + 1}</span>`;
      },
    },
    loop: true,
    mousewheel: false,
    grabCursor: true,
    keyboard: { enabled: true },
    speed: 700,
  });
});

// === Vertical Main Swiper ===
const swiperV = new Swiper('.swiper-v', {
  direction: 'vertical',
  parallax: true,
  spaceBetween: 30,
  pagination: {
    el: '.swiper-pagination-v',
    type: 'progressbar',
  },
  grabCursor: true,
  mousewheel: { forceToAxis: true },
  keyboard: { enabled: true },
  speed: 1000,
});

// === Contacts Swiper ===
document.querySelectorAll('.swiper-contacts').forEach((el) => {
  new Swiper(el, {
    spaceBetween: 25,
    effect: 'coverflow',
    coverflowEffect: {
      rotate: 50,
      stretch: 0,
      depth: 100,
      modifier: 1,
      slideShadows: false,
    },
    navigation: {
      nextEl: el.querySelector('.swiper-button-next'),
      prevEl: el.querySelector('.swiper-button-prev'),
    },
    centeredSlides: true,
    slidesPerView: 1.5,
    loop: true,
    mousewheel: false,
    grabCursor: false,
    keyboard: { enabled: true },
    speed: 700,
  });
});
