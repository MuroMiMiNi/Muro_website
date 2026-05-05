export const state = {
    currentLang: "zh",
    currentCat: 0,
    currentSub: 0,
    currentIndex: 0
};

export function updateState(patch) {
    Object.assign(state, patch);
}
