const yearNode = document.querySelector("#current-year");
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

const modalRoot = document.querySelector("[data-lead-modal]");
const openLeadButton = document.querySelector("[data-open-lead-form]");
const closeLeadButtons = document.querySelectorAll("[data-close-lead-form]");
const leadForm = document.querySelector("[data-lead-form]");
const leadFormStatus = document.querySelector("[data-lead-form-status]");
const leadFormSubmitButton = leadForm?.querySelector(".lead-form__submit");
const LEAD_SUBMIT_ENDPOINT = "./api/submit-lead.php";
const LEAD_THANK_YOU_DEFAULT = "./thank-you.html";

const validators = {
  name: (value) => (value.trim() ? "" : "Укажите имя."),
  phone: (value, contactHandle) => {
    if (value.trim() || contactHandle.trim()) return "";
    return "Заполните телефон или ник Telegram/Instagram.";
  },
  contactHandle: (value, phone) => {
    if (value.trim() || phone.trim()) return "";
    return "Заполните ник Telegram/Instagram или телефон.";
  }
};

const setBodyScrollLock = (lock) => {
  document.body.style.overflow = lock ? "hidden" : "";
};

const openLeadModal = () => {
  if (!modalRoot) return;
  modalRoot.hidden = false;
  setBodyScrollLock(true);
  const firstField = leadForm?.querySelector("input[name='name']");
  firstField?.focus();
};

const closeLeadModal = () => {
  if (!modalRoot) return;
  modalRoot.hidden = true;
  setBodyScrollLock(false);
  openLeadButton?.focus();
};

openLeadButton?.addEventListener("click", openLeadModal);

closeLeadButtons.forEach((button) => {
  button.addEventListener("click", closeLeadModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modalRoot && !modalRoot.hidden) {
    closeLeadModal();
  }
});

const setFieldError = (fieldName, message) => {
  const field = leadForm?.querySelector(`[name='${fieldName}']`);
  const error = leadForm?.querySelector(`[data-error-for='${fieldName}']`);
  if (!field || !error) return;

  const wrapper = field.closest(".lead-form__field");
  if (message) {
    wrapper?.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
    error.textContent = message;
  } else {
    wrapper?.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    error.textContent = "";
  }
};

const setFormStatus = (message, tone = "") => {
  if (!leadFormStatus) return;

  leadFormStatus.textContent = message;
  leadFormStatus.classList.remove("is-success", "is-error");
  if (tone) {
    leadFormStatus.classList.add(tone);
  }
};

const setSubmitLoading = (isLoading) => {
  if (!leadFormSubmitButton) return;

  leadFormSubmitButton.disabled = isLoading;
  leadFormSubmitButton.textContent = isLoading ? "Отправка..." : "Отправить заявку";
};

leadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  setFormStatus("");

  const formElements = leadForm.elements;
  const nameValue = formElements.name.value;
  const phoneValue = formElements.phone.value;
  const contactValue = formElements.contactHandle.value;

  const errors = {
    name: validators.name(nameValue),
    phone: validators.phone(phoneValue, contactValue),
    contactHandle: validators.contactHandle(contactValue, phoneValue)
  };

  setFieldError("name", errors.name);
  setFieldError("phone", errors.phone);
  setFieldError("contactHandle", errors.contactHandle);

  const hasErrors = Object.values(errors).some(Boolean);
  if (hasErrors) return;

  const formData = new FormData(leadForm);
  setSubmitLoading(true);

  try {
    const response = await fetch(LEAD_SUBMIT_ENDPOINT, {
      method: "POST",
      body: formData
    });

    const payload = await response.json().catch(() => ({ ok: false }));
    if (!response.ok || !payload.ok) {
      const message = payload.message || "Ошибка отправки. Попробуйте еще раз.";
      setFormStatus(message, "is-error");
      return;
    }

    if (payload.thankYou === true) {
      const next =
        typeof payload.thankYouPath === "string" && payload.thankYouPath.trim() !== ""
          ? payload.thankYouPath.trim()
          : LEAD_THANK_YOU_DEFAULT;
      window.location.assign(next);
      return;
    }

    setFormStatus("Спасибо! Заявка успешно отправлена.", "is-success");
    leadForm.reset();
    window.setTimeout(() => {
      closeLeadModal();
      setFormStatus("");
    }, 900);
  } catch (error) {
    setFormStatus("Не удалось связаться с сервером. Проверьте интернет и повторите.", "is-error");
  } finally {
    setSubmitLoading(false);
  }
});

const videoFrames = document.querySelectorAll(".video-frame");
videoFrames.forEach((frame) => {
  const video = frame.querySelector(".video-frame__media");
  if (!video) return;

  const enableFallback = () => {
    frame.classList.add("is-fallback");
  };

  const disableFallback = () => {
    frame.classList.remove("is-fallback");
  };

  // Show fallback only on actual playback/decoding errors.
  video.addEventListener("error", enableFallback);

  // If browser can render frames, keep normal video visible.
  video.addEventListener("loadeddata", disableFallback);
  video.addEventListener("canplay", disableFallback);
  video.addEventListener("playing", disableFallback);
});

const syncPricingVisualHeight = () => {
  const pricingGrid = document.querySelector(".pricing-grid");
  if (!pricingGrid) return;

  const offerCard = pricingGrid.querySelector(".offer-card");
  const visualCard = pricingGrid.querySelector(".contract-visual");
  if (!offerCard || !visualCard) return;

  visualCard.style.height = `${offerCard.offsetHeight}px`;
};

syncPricingVisualHeight();
window.addEventListener("resize", syncPricingVisualHeight);
