export function renderSections({ root, siteData, currentLang }) {
    root.innerHTML = "";

    siteData.forEach(category => {
        category.subs.forEach(sub => {
            const section = document.createElement("section");
            section.className = "section";

            const title = document.createElement("h2");
            title.className = "section-title";
            title.textContent = sub.title[currentLang];

            const copy = document.createElement("p");
            copy.className = "section-copy";
            copy.innerHTML = sub.copy[currentLang];

            section.appendChild(title);
            section.appendChild(copy);
            root.appendChild(section);
        });
    });
}

export function applyActiveSection({ root, currentIndex, oldIndex = null, transitionType = "sub" }) {
    const sections = root.querySelectorAll(".section");

    sections.forEach((section, index) => {
        section.classList.remove("active", "exit", "category-enter");

        if (index === currentIndex) {
            section.classList.add("active");
            if (transitionType === "category") {
                section.classList.add("category-enter");
            }
        } else if (oldIndex !== null && index === oldIndex && oldIndex !== currentIndex) {
            section.classList.add("exit");
        }
    });
}
