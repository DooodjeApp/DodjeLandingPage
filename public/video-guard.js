// Skip the 14 MB background video on phones — CSS already hides it, but the
// <source> would still download on cellular. Runs synchronously right after
// the <video> tag so no network request is started.
(function () {
  if (window.matchMedia('(max-width: 767px)').matches) {
    var video = document.getElementById('background-video');
    if (video) video.remove();
  }
})();
