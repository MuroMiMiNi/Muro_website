import { socialLinks } from "../data/siteData.js";
import { isHiddenSub } from "../utils/indexMap.js";

const SOCIAL_ICONS = {
    twitter: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6.72 5h3.44l2.66 3.73L16.06 5H18.7l-4.73 5.4L19 19h-3.44l-2.93-4.11L9.03 19H6.4l5.08-5.8L6.72 5Zm2.27 1.67 6.52 9.66h.88L9.87 6.67h-.88Z"></path>
        </svg>
    `,
    facebook: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M13.37 20v-7.02h2.36l.35-2.74h-2.71V8.49c0-.79.22-1.33 1.36-1.33H16.2V4.71c-.25-.03-1.1-.11-2.08-.11-2.06 0-3.47 1.26-3.47 3.57v2.07H8.3v2.74h2.35V20h2.72Z"></path>
        </svg>
    `,
    bluesky: `
        <svg viewBox="0 0 568 501" aria-hidden="true" focusable="false">
            <path d="M123.121 33.6637C188.241 82.5526 258.281 181.681 284 234.873C309.719 181.681 379.759 82.5526 444.879 33.6637C491.866 -1.61183 568 -28.9064 568 57.9464C568 75.2916 558.055 203.659 552.222 224.501C531.947 296.954 458.067 315.434 392.347 304.249C507.222 323.8 536.444 388.56 473.333 453.32C353.473 576.312 301.061 422.461 287.631 383.039C285.169 375.812 284.017 372.431 284 375.306C283.983 372.431 282.831 375.812 280.369 383.039C266.939 422.461 214.527 576.312 94.6667 453.32C31.5556 388.56 60.7778 323.8 175.653 304.249C109.933 315.434 36.0535 296.954 15.7778 224.501C9.94525 203.659 0 75.2916 0 57.9464C0 -28.9064 76.1345 -1.61183 123.121 33.6637Z"></path>
        </svg>
    `,
    vgen: `
        <img class="sub-social-logo sub-social-logo--vgen" src="https://vgen.co/img/logo-icon-black-outline.svg" alt="" aria-hidden="true">
    `,
    clibo: `
        <img class="sub-social-logo sub-social-logo--clibo" src="https://clibo.tw/images/clibo-logo-v2.svg" alt="" aria-hidden="true">
    `,
    email: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2v.24l8 5.33 8-5.33V8H4Zm16 8V10.64l-7.45 4.97a1 1 0 0 1-1.1 0L4 10.64V16h16Z"></path>
        </svg>
    `
};

function createSocialLinksBlock(currentLang) {
    const wrap = document.createElement("div");
    const row = document.createElement("div");
    const note = document.createElement("p");

    wrap.className = "sub-socials";
    row.className = "sub-socials-row";
    note.className = "sub-social-note";
    note.textContent = "2026 木洛Muro";

    socialLinks.forEach(item => {
        const link = document.createElement("a");

        link.className = `sub-social-link sub-social-link--${item.id}`;
        link.href = item.url;
        if (item.id !== "email") {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }
        link.setAttribute("aria-label", item.label[currentLang]);
        link.title = item.label[currentLang];
        link.innerHTML = SOCIAL_ICONS[item.id] ?? "";
        row.appendChild(link);
    });

    wrap.appendChild(row);
    wrap.appendChild(note);

    return wrap;
}

export function renderSubNav({
    panel,
    titleEl,
    listEl,
    siteData,
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
    titleEl.textContent = `${category.name.zh} ${category.name.en}`;
    listEl.innerHTML = "";

    category.subs.forEach((sub, subIdx) => {
        if (sub.type === "p" && isHiddenSub(sub)) {
            return;
        }

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

    panel.querySelector(".sub-socials")?.remove();
    panel.appendChild(createSocialLinksBlock(currentLang));
}
