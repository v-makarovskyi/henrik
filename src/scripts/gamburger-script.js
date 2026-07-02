const gamburger = document.querySelector(".gamburger-btn");

const mobileMenu = document.querySelector(".mobile-menu");

gamburger.addEventListener("click", function (e) {
  const classes = Array.from(gamburger.classList);
  const activeClass = "gamburger-btn--isActive";
  mobileMenu.classList.toggle("mobile-menu--isActive");
  if (!classes.includes(activeClass)) {
    classes.splice(2, 0, activeClass);
    gamburger.className = classes.join(" ");
  } else {
    gamburger.className = classes.filter((c) => c !== activeClass).join(" ");
  }
});
