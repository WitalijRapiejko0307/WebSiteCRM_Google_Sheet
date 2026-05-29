/** Web App URL (Deploy → Web app → Anyone). */
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbypLxdPnpP-K6xg5YkSbRVbjDb6UPGTllTseH0Vmziuyiwmbg_KYbu9_amA6EnohQi8/exec";

const LEAD_THANK_YOU_DEFAULT = "./thank-you.html";

const leadForm = document.querySelector("[data-lead-form]");
const leadFormStatus = document.querySelector("[data-lead-form-status]");
const leadFormSubmitButton = leadForm?.querySelector(".lead-form__submit");
const leadModal = document.querySelector("[data-lead-modal]");

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

const closeLeadModal = () => {
  if (!leadModal) return;
  leadModal.hidden = true;
  document.body.style.overflow = "";
  document.querySelector("[data-open-lead-form]")?.focus();
};

const collectLeadPayload = () => ({
  name: leadForm.querySelector('[name="name"]')?.value.trim() ?? "",
  phone: leadForm.querySelector('[name="phone"]')?.value.trim() ?? "",
  contactHandle: leadForm.querySelector('[name="contactHandle"]')?.value.trim() ?? "",
  website: leadForm.querySelector('[name="website"]')?.value.trim() ?? ""
});

leadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setFormStatus("");

  const nameValue = leadForm.elements.name.value;
  const phoneValue = leadForm.elements.phone.value;
  const contactValue = leadForm.elements.contactHandle.value;

  const errors = {
    name: validators.name(nameValue),
    phone: validators.phone(phoneValue, contactValue),
    contactHandle: validators.contactHandle(contactValue, phoneValue)
  };

  setFieldError("name", errors.name);
  setFieldError("phone", errors.phone);
  setFieldError("contactHandle", errors.contactHandle);

  if (Object.values(errors).some(Boolean)) return;

  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("YOUR_SCRIPT_ID")) {
    setFormStatus("Не настроен URL отправки (Google Apps Script).", "is-error");
    return;
  }

  setSubmitLoading(true);

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(collectLeadPayload())
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

    setFormStatus(payload.message || "Спасибо! Заявка успешно отправлена.", "is-success");
    leadForm.reset();
    window.setTimeout(() => {
      closeLeadModal();
      setFormStatus("");
    }, 900);
  } catch {
    setFormStatus("Не удалось связаться с сервером. Проверьте интернет и повторите.", "is-error");
  } finally {
    setSubmitLoading(false);
  }
});
