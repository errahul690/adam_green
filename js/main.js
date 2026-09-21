(function () {
  const nav = document.getElementById("site-nav");
  const toggle = document.getElementById("menu-toggle");
  const mobile = document.getElementById("mobile-menu");

  if (nav) {
    const onScroll = () => {
      nav.classList.toggle("nav-scrolled", window.scrollY > 16);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  if (toggle && mobile) {
    const setOpen = (open) => {
      mobile.classList.toggle("hidden", !open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () => {
      setOpen(mobile.classList.contains("hidden"));
    });

    mobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  const form = document.getElementById("contact-form");
  const success = document.getElementById("form-success");

  if (form && success) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      form.classList.add("hidden");
      success.classList.remove("hidden");
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
})();
