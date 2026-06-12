import { uiText } from "./config/uiText.js";
import { siteData } from "./data/siteData.js";
import { renderMainNav } from "./render/mainNav.js";
import { renderSections, applyActiveSection } from "./render/sections.js";
import { renderSubNav } from "./render/subNav.js";
import { state, updateState } from "./state.js";
import { getFirstPageSubIndex, getFlatIndex, getSafePageSubIndex } from "./utils/indexMap.js";

const refs = {
    mainNav: document.getElementById("mainNav"),
    subPanel: document.getElementById("subPanel"),
    catLabel: document.getElementById("catLabel"),
    subList: document.getElementById("subList"),
    displayArea: document.getElementById("displayArea"),
    floatingGif: document.getElementById("floatingGif"),
    langSwitch: document.getElementById("langSwitch"),
    langToggle: document.getElementById("langToggle"),
    langMenu: document.getElementById("langMenu"),
    langCurrent: document.getElementById("langCurrent"),
    langZh: document.getElementById("langZh"),
    langEn: document.getElementById("langEn")
};

function isImageTarget(target) {
    return target instanceof Element && target.closest("img");
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function bindFloatingGifFallback() {
    const gifImage = refs.floatingGif.querySelector("img");
    const fallbackSrc = gifImage.dataset.fallbackSrc;

    gifImage.draggable = false;

    gifImage.addEventListener("error", () => {
        if (gifImage.src === fallbackSrc) {
            return;
        }

        gifImage.src = fallbackSrc;
    }, { once: true });
}

function updateDocumentLanguage() {
    document.documentElement.lang = state.currentLang === "zh" ? "zh-TW" : "en";
    document.title = uiText[state.currentLang].title;
}

function updateLanguageButtons() {
    refs.langCurrent.textContent = state.currentLang === "zh" ? "ZH" : "EN";
    refs.langZh.classList.toggle("active-lang", state.currentLang === "zh");
    refs.langEn.classList.toggle("active-lang", state.currentLang === "en");
}

function syncCompactLayout() {
    const compactLayoutQuery = window.matchMedia("(max-width: 1180px), (max-height: 820px)");
    const touchDeviceQuery = window.matchMedia("(hover: none), (pointer: coarse)");
    const shouldUseCompactLayout =
        compactLayoutQuery.matches ||
        (touchDeviceQuery.matches && window.innerWidth <= 1366);

    document.body.classList.toggle("compact-layout", shouldUseCompactLayout);
    document.body.classList.toggle("touch-device", touchDeviceQuery.matches);
}

function getGalleryViewportMode() {
    if (window.matchMedia("(max-width: 768px), (max-height: 700px)").matches) {
        return "mobile";
    }

    if (window.matchMedia("(max-width: 960px), (max-height: 820px)").matches) {
        return "compact";
    }

    return "desktop";
}

function setLanguageMenuOpen(isOpen) {
    refs.langMenu.hidden = !isOpen;
    refs.langToggle.setAttribute("aria-expanded", String(isOpen));
    refs.langToggle.classList.toggle("active-btn", isOpen);
}

function renderChrome() {
    renderMainNav({
        root: refs.mainNav,
        siteData,
        currentLang: state.currentLang,
        currentCat: state.currentCat,
        onCategorySelect: openCategory
    });

    renderSubNav({
        panel: refs.subPanel,
        titleEl: refs.catLabel,
        listEl: refs.subList,
        siteData,
        currentLang: state.currentLang,
        currentCat: state.currentCat,
        currentSub: state.currentSub,
        currentIndex: state.currentIndex,
        onPageSelect: goToPage
    });

    updateLanguageButtons();
}

function setCurrentPage(catIdx, subIdx, oldIndex = null, transitionType = "sub") {
    const safeSubIdx = getSafePageSubIndex(siteData, catIdx, subIdx);
    const nextIndex = getFlatIndex(siteData, catIdx, safeSubIdx);

    updateState({
        currentCat: catIdx,
        currentSub: safeSubIdx,
        currentIndex: nextIndex
    });

    renderChrome();
    applyActiveSection({
        root: refs.displayArea,
        currentIndex: state.currentIndex,
        oldIndex,
        transitionType
    });
}

function goToPage(catIdx, subIdx) {
    setCurrentPage(catIdx, subIdx, state.currentIndex, "sub");
}

function openCategory(catIdx) {
    const firstPage = getFirstPageSubIndex(siteData, catIdx);
    setCurrentPage(catIdx, firstPage, state.currentIndex, "category");
}

function setLanguage(lang) {
    if (state.currentLang === lang) {
        setLanguageMenuOpen(false);
        return;
    }

    updateState({ currentLang: lang });
    updateDocumentLanguage();
    renderSections({
        root: refs.displayArea,
        siteData,
        currentLang: state.currentLang
    });
    renderChrome();
    applyActiveSection({
        root: refs.displayArea,
        currentIndex: state.currentIndex
    });
    setLanguageMenuOpen(false);
}

function moveFloatingGif(nextLeft, nextTop) {
    const { width, height } = refs.floatingGif.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - width);
    const maxTop = Math.max(0, window.innerHeight - height);

    refs.floatingGif.style.left = `${clamp(nextLeft, 0, maxLeft)}px`;
    refs.floatingGif.style.top = `${clamp(nextTop, 0, maxTop)}px`;
    refs.floatingGif.style.bottom = "auto";
}

function keepFloatingGifInViewport() {
    const rect = refs.floatingGif.getBoundingClientRect();
    moveFloatingGif(rect.left, rect.top);
}

function handleViewportResize() {
    syncCompactLayout();
    keepFloatingGifInViewport();

    const activeSection = refs.displayArea.querySelector(".section.active[data-gallery-viewport-mode]");

    if (!activeSection) {
        return;
    }

    const nextGalleryMode = getGalleryViewportMode();

    if (activeSection.dataset.galleryViewportMode === nextGalleryMode) {
        return;
    }

    renderSections({
        root: refs.displayArea,
        siteData,
        currentLang: state.currentLang
    });
    applyActiveSection({
        root: refs.displayArea,
        currentIndex: state.currentIndex
    });
}

function bindFloatingGif() {
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let isDragging = false;

    refs.floatingGif.addEventListener("dblclick", () => {
        openCategory(0);
    });

    refs.floatingGif.addEventListener("pointerdown", event => {
        isDragging = true;
        dragOffsetX = event.clientX - refs.floatingGif.getBoundingClientRect().left;
        dragOffsetY = event.clientY - refs.floatingGif.getBoundingClientRect().top;

        refs.floatingGif.classList.add("dragging");
        refs.floatingGif.setPointerCapture(event.pointerId);
    });

    refs.floatingGif.addEventListener("pointermove", event => {
        if (!isDragging) {
            return;
        }

        moveFloatingGif(event.clientX - dragOffsetX, event.clientY - dragOffsetY);
    });

    const stopDragging = event => {
        if (!isDragging) {
            return;
        }

        isDragging = false;
        refs.floatingGif.classList.remove("dragging");

        if (refs.floatingGif.hasPointerCapture(event.pointerId)) {
            refs.floatingGif.releasePointerCapture(event.pointerId);
        }
    };

    refs.floatingGif.addEventListener("pointerup", stopDragging);
    refs.floatingGif.addEventListener("pointercancel", stopDragging);
    window.addEventListener("resize", handleViewportResize);
    window.visualViewport?.addEventListener("resize", handleViewportResize);
}

function bindImageProtection() {
    const suppressImageAction = event => {
        if (!isImageTarget(event.target)) {
            return;
        }

        event.preventDefault();
    };

    document.addEventListener("contextmenu", suppressImageAction);
    document.addEventListener("dragstart", suppressImageAction);
}

function bindEvents() {
    bindFloatingGifFallback();
    bindFloatingGif();
    bindImageProtection();
    refs.langToggle.addEventListener("click", () => {
        setLanguageMenuOpen(refs.langMenu.hidden);
    });
    refs.langZh.addEventListener("click", () => setLanguage("zh"));
    refs.langEn.addEventListener("click", () => setLanguage("en"));
    document.addEventListener("click", event => {
        if (!refs.langSwitch.contains(event.target)) {
            setLanguageMenuOpen(false);
        }
    });
}

function init() {
    bindEvents();
    syncCompactLayout();
    updateDocumentLanguage();
    updateLanguageButtons();
    setLanguageMenuOpen(false);
    renderSections({
        root: refs.displayArea,
        siteData,
        currentLang: state.currentLang
    });
    openCategory(state.currentCat);
    keepFloatingGifInViewport();
}

init();
