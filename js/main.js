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
  const error = document.getElementById("form-error");

  if (form && success) {
    const showSuccess = () => {
      if (error) error.classList.add("hidden");
      form.classList.add("hidden");
      success.classList.remove("hidden");
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const showError = (message) => {
      if (!error) return;
      error.textContent = message;
      error.classList.remove("hidden");
    };

    const parseEmailId = (source) => {
      const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/);
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const separator = line.indexOf("=");
        if (separator === -1) continue;
        const key = line.slice(0, separator).trim();
        if (key !== "email_id") continue;
        let value = line.slice(separator + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1).trim();
        }
        return value;
      }
      return "";
    };

    const formSubmitAction = (email) => {
      const recipient = String(email || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
        throw new Error("The enquiry form is not configured with a valid recipient.");
      }

      const action = new URL(`https://formsubmit.co/ajax/${recipient}`);
      let decoded = "";
      try {
        decoded = decodeURIComponent(action.pathname.slice("/ajax/".length));
      } catch (decodeError) {
        throw new Error("The enquiry form could not create a valid FormSubmit address.");
      }

      const valid =
        action.protocol === "https:" &&
        action.hostname === "formsubmit.co" &&
        action.port === "" &&
        action.username === "" &&
        action.password === "" &&
        action.search === "" &&
        action.hash === "" &&
        action.pathname.startsWith("/ajax/") &&
        decoded === recipient;

      if (!valid) {
        throw new Error("The enquiry form could not create a valid FormSubmit address.");
      }

      return action.href;
    };

    const loadEmailId = async () => {
      const response = await fetch(new URL(".env", window.location.href), { cache: "no-store" });
      if (!response.ok) {
        throw new Error("The enquiry form could not load its email configuration.");
      }
      const source = await response.text();
      if (/<!doctype html/i.test(source) || /<html/i.test(source)) {
        throw new Error("The enquiry form could not load its email configuration.");
      }
      const emailId = parseEmailId(source);
      if (!emailId) {
        throw new Error("The enquiry form could not load its email configuration.");
      }
      return emailId;
    };

    let emailIdPromise = null;
    const emailId = () => {
      if (!emailIdPromise) {
        emailIdPromise = loadEmailId().catch((loadError) => {
          emailIdPromise = null;
          throw loadError;
        });
      }
      return emailIdPromise;
    };

    emailId()
      .then((recipient) => {
        form.action = formSubmitAction(recipient);
      })
      .catch(() => {
        form.removeAttribute("action");
      });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      if (error) error.classList.add("hidden");

      try {
        const recipient = await emailId();
        const action = formSubmitAction(recipient);
        form.action = action;

        const payload = Object.fromEntries(new FormData(form).entries());
        const response = await fetch(action, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(payload)
        });

        let data = null;
        try {
          data = await response.json();
        } catch (parseError) {
          data = null;
        }

        if (!response.ok || !data || String(data.success) !== "true") {
          const detail = data && data.message ? String(data.message) : "";
          const failure = new Error(detail || "send-failed");
          throw failure;
        }

        showSuccess();
      } catch (submitError) {
        if (button) button.disabled = false;
        const detail = submitError && submitError.message ? submitError.message : "";
        if (/activat/i.test(detail)) {
          showError("This enquiry form still needs a one-time activation email before messages can be delivered.");
        } else {
          showError("We couldn’t send your message. Please try again.");
        }
      }
    });
  }
})();
