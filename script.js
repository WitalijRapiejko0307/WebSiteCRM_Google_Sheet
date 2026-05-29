const yearNode = document.querySelector("#current-year");
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

const modalRoot = document.querySelector("[data-lead-modal]");
const openLeadButton = document.querySelector("[data-open-lead-form]");
const closeLeadButtons = document.querySelectorAll("[data-close-lead-form]");
const leadForm = document.querySelector("[data-lead-form]");

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
