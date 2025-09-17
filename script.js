var swiperH = new Swiper('.swiper-container-h', {
      spaceBetween: 25,
      effect: 'cube',
      cubeEffect: {
            shadow: false,
            slideShadows: false,
            shadowOffset: 0,
            shadowScale: 0.8,
          },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      pagination: {
        el: '.swiper-pagination-h',
        clickable: true,
        renderBullet: function (index, className) {
          return '<span class="' + className + '">' + (index + 1) + '</span>';
        },
      },
      loop: true,
      mousewheel: false,
      grabCursor: true,
      keyboard: true,
      speed: 700,
});

var swiperV = new Swiper('.swiper-container-v', {
  direction: 'vertical',
  parallax: true,
  spaceBetween: 30,
  pagination: {
    el: '.swiper-pagination-v',
    type: 'progressbar',
  },
  grabCursor: true,
  mousewheel: true,
  keyboard: true,
  speed: 1000,

});
var swiperC = new Swiper('.swiper-contacts', {
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
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      centeredSlides: true,
      slidesPerView: 1.5,
      loop: true,
      mousewheel: false,
      grabCursor: false,
      keyboard: true,
      speed: 700,
});
