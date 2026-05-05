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
    langSwitch: document.getElementById("langSwitch"),
    langToggle: document.getElementById("langToggle"),
    langMenu: document.getElementById("langMenu"),
    langCurrent: document.getElementById("langCurrent"),
    langZh: document.getElementById("langZh"),
    langEn: document.getElementById("langEn")
};

function updateDocumentLanguage() {
    document.documentElement.lang = state.currentLang === "zh" ? "zh-TW" : "en";
    document.title = uiText[state.currentLang].title;
}

function updateLanguageButtons() {
    refs.langCurrent.textContent = state.currentLang === "zh" ? "ZH" : "EN";
    refs.langZh.classList.toggle("active-lang", state.currentLang === "zh");
    refs.langEn.classList.toggle("active-lang", state.currentLang === "en");
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
        uiText,
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

function bindEvents() {
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
    updateDocumentLanguage();
    updateLanguageButtons();
    setLanguageMenuOpen(false);
    renderSections({
        root: refs.displayArea,
        siteData,
        currentLang: state.currentLang
    });
    openCategory(state.currentCat);
}

init();
