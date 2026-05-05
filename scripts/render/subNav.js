export function renderSubNav({
    panel,
    titleEl,
    listEl,
    siteData,
    uiText,
    currentLang,
    currentCat,
    currentSub,
    currentIndex,
    onPageSelect
}) {
    const category = siteData[currentCat];

    if (category.showSubNav === false) {
        panel.style.display = "none";
        titleEl.textContent = "";
        listEl.innerHTML = "";
        return;
    }

    panel.style.display = "flex";
    titleEl.textContent = `${uiText[currentLang].category} / ${category.name[currentLang]}`;
    listEl.innerHTML = "";

    category.subs.forEach((sub, subIdx) => {
        const li = document.createElement("li");

        if (sub.type === "l") {
            const link = document.createElement("a");
            link.href = sub.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = sub.label[currentLang];
            li.appendChild(link);
        } else {
            li.textContent = sub.label[currentLang];
            li.id = `sub-idx-${currentIndex - currentSub + subIdx}`;

            if (subIdx === currentSub) {
                li.classList.add("active-sub");
            }

            li.addEventListener("click", () => onPageSelect(currentCat, subIdx));
        }

        listEl.appendChild(li);
    });
}
