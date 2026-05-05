export function renderMainNav({ root, siteData, currentLang, currentCat, onCategorySelect }) {
    root.innerHTML = "";

    siteData.forEach((category, idx) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "glass-btn";
        button.textContent = category.nav[currentLang];

        if (idx === currentCat) {
            button.classList.add("active-btn");
        }

        button.addEventListener("click", () => onCategorySelect(idx));
        root.appendChild(button);
    });
}
