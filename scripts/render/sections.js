import { artworksData, getArtworkById } from "../data/artworksData.js";
import { state, updateState } from "../state.js";

const GALLERY_LAYOUT = "artwork-gallery";
const GOLDEN_ANGLE = 137.508;
const GALLERY_SCATTER = {
    minRadius: 24,
    radiusStep: 5.6,
    yScale: 0.98,
    collisionPadding: 2.8,
    maxPlacementAttempts: 320,
    bounds: {
        left: -49,
        right: 49,
        top: -49,
        bottom: 49
    },
    focusPanel: {
        left: -31,
        right: 31,
        top: -30,
        bottom: 30
    }
};
const BUBBLE_SIZE_PATTERN = [1.18, 0.9, 1.08, 0.84, 1.12, 0.96, 1.22, 0.88];
const FALLBACK_PHASES = ["Now", "Next", "Later"];
const FALLBACK_PILLARS = ["Core Loop", "World", "Feel", "Progression"];
const GALLERY_PROMPT = {
    zh: "請點選外圍縮圖查看作品。",
    en: "Select a thumbnail around the frame to preview the artwork."
};
const ABOUT_PROFILE_IMAGE = {
    src: "./assets/profile/profile.png",
    alt: {
        zh: "About me 個人照片",
        en: "About me profile image"
    }
};
const PAGE_BUILDERS = {
    "0-0": createAboutPosterSection,
    "0-1": createFavoriteGameTypeSection,
    "0-2": createOnlineGameSection,
    "0-3": createMobileGameSection,
    "0-4": createAcgLikesSection,
    "0-5": createOtherLikesSection,
    "1-0": createGallerySection,
    "1-1": createCommissionGuideSection,
    "1-2": createMenuSection,
    "1-3": createTimelineSection,
    "2-0": createBlueprintSection,
    "2-1": createStorySection,
    "2-2": createGameplaySection,
    "2-3": createDevlogSection,
    "3-0": createLinkHubSection,
    "3-1": createExternalLinkSection,
    "3-2": createExternalLinkSection,
    "3-3": createContactSection
};

function createSectionBase(pageClass) {
    const section = document.createElement("section");
    section.className = `section ${pageClass}`;
    section.appendChild(createOutlineFrame());
    return section;
}

function createDiv(className) {
    const element = document.createElement("div");
    element.className = className;
    return element;
}

function createOutlineFrame() {
    return createDiv("page-outline");
}

function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
}

function createRichTextElement(tagName, className, html) {
    const element = document.createElement(tagName);
    element.className = className;
    element.innerHTML = formatRichText(html);
    return element;
}

function createActionLink(href, label, className = "page-action") {
    const link = document.createElement("a");
    link.className = className;
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    return link;
}

function createHeaderBlock(context, eyebrowText = context.category.name[context.currentLang]) {
    const header = createDiv("page-header");
    const eyebrow = createTextElement("p", "page-eyebrow", eyebrowText);
    const title = createTextElement("h2", "section-title page-title", context.title);

    header.appendChild(eyebrow);
    header.appendChild(title);

    return header;
}

function createParagraphStack(items, className = "page-paragraph-stack", itemClassName = "page-paragraph") {
    const stack = createDiv(className);

    items.forEach(item => {
        stack.appendChild(createRichTextElement("p", itemClassName, item));
    });

    return stack;
}

function createLineList(items, listClassName, itemClassName, { numbered = false } = {}) {
    const list = createDiv(listClassName);

    items.forEach((item, index) => {
        const entry = createDiv(itemClassName);

        if (numbered) {
            entry.appendChild(createTextElement("span", "page-index", String(index + 1).padStart(2, "0")));
        }

        entry.appendChild(createRichTextElement("p", "page-line-copy", item));
        list.appendChild(entry);
    });

    return list;
}

function createChipCloud(items, listClassName, itemClassName) {
    const cloud = createDiv(listClassName);

    items.forEach(item => {
        cloud.appendChild(createRichTextElement("div", itemClassName, item));
    });

    return cloud;
}

function formatRichText(value) {
    return String(value ?? "").replace(/\r/g, "").replace(/\n/g, "<br>");
}

function getCopy(sub, currentLang) {
    return sub.copy?.[currentLang] ?? "";
}

function getParagraphs(copy) {
    const normalized = String(copy ?? "").replace(/\r/g, "").trim();

    if (!normalized) {
        return [];
    }

    const paragraphs = normalized
        .split(/\n{2,}/)
        .map(item => item.trim())
        .filter(Boolean);

    return paragraphs.length > 0 ? paragraphs : [normalized];
}

function getLines(copy) {
    return String(copy ?? "")
        .replace(/\r/g, "")
        .split("\n")
        .map(item => item.trim())
        .filter(Boolean);
}

function getSegments(copy) {
    const normalized = String(copy ?? "").replace(/\r/g, "").trim();

    if (!normalized) {
        return [];
    }

    return normalized
        .split(/\n\s*\/\s*\n/)
        .map(item => item.trim())
        .filter(Boolean);
}

function ensureItems(items, fallbackItems) {
    return items.length > 0 ? items : fallbackItems;
}

function createPageContext({ category, categoryIndex, sub, subIndex, currentLang }) {
    const copy = getCopy(sub, currentLang);

    return {
        category,
        categoryIndex,
        sub,
        subIndex,
        currentLang,
        pageId: `${categoryIndex}-${subIndex}`,
        title: sub.title[currentLang],
        label: sub.label[currentLang],
        copy,
        lines: getLines(copy),
        paragraphs: getParagraphs(copy),
        segments: getSegments(copy)
    };
}

function createAboutPosterSection(context) {
    const section = createSectionBase("page-about");
    const shell = createDiv("page-shell about-shell");
    const photoCard = createDiv("about-photo-card page-card");
    const photoSlot = createDiv("about-photo-slot");
    const blankCard = createDiv("about-blank-card page-card");
    const contentCard = createDiv("about-content-card page-card");

    photoSlot.dataset.aboutPhotoSlot = "true";
    photoSlot.appendChild(createAboutPhotoImage(context.currentLang));
    photoCard.appendChild(photoSlot);

    contentCard.appendChild(createHeaderBlock(context, "Profile"));
    contentCard.appendChild(createParagraphStack(
        ensureItems(context.paragraphs, [context.copy]),
        "about-copy",
        "about-paragraph"
    ));

    shell.appendChild(photoCard);
    shell.appendChild(blankCard);
    shell.appendChild(contentCard);
    section.appendChild(shell);

    return section;
}

function createAboutPhotoImage(currentLang) {
    const image = document.createElement("img");

    image.className = "about-photo-image";
    image.src = ABOUT_PROFILE_IMAGE.src;
    image.alt = ABOUT_PROFILE_IMAGE.alt[currentLang];
    image.loading = "lazy";

    image.addEventListener("error", () => {
        image.hidden = true;
    }, { once: true });

    return image;
}

function createManifestSection(context) {
    const section = createSectionBase("page-manifest");
    const shell = createDiv("page-shell manifest-shell");
    const items = ensureItems(context.lines, [context.copy || context.label]);
    const highlight = items[0];
    const cards = items.slice(1);
    const hero = createDiv("manifest-hero");
    const stream = createDiv("manifest-stream");

    hero.appendChild(createHeaderBlock(context, "Favorite format"));
    hero.appendChild(createRichTextElement("p", "manifest-highlight", highlight));

    ensureItems(cards, [context.label]).forEach((item, index) => {
        const card = createDiv(`manifest-card page-card manifest-card-${(index % 3) + 1}`);
        card.appendChild(createTextElement("p", "page-card-label", `Angle ${String(index + 1).padStart(2, "0")}`));
        card.appendChild(createRichTextElement("p", "page-note-copy", item));
        stream.appendChild(card);
    });

    shell.appendChild(hero);
    shell.appendChild(stream);
    section.appendChild(shell);

    return section;
}

function createFavoriteGameTypeSection(context) {
    return createStackedTopicSection(context, {
        pageClass: "page-favorite-type",
        shellClass: "favorite-type-shell",
        titleCardClass: "favorite-type-title-card",
        titleClass: "favorite-type-title",
        listClass: "favorite-type-list",
        itemClass: "favorite-type-item",
        copyClass: "favorite-type-copy",
        itemCount: 6
    });
}

function createOnlineGameSection(context) {
    return createStackedTopicSection(context, {
        pageClass: "page-online",
        shellClass: "topic-stack-shell",
        titleCardClass: "topic-stack-title-card",
        titleClass: "topic-stack-title",
        listClass: "topic-stack-list topic-stack-list-4",
        itemClass: "topic-stack-item",
        copyClass: "topic-stack-copy",
        itemCount: 4
    });
}

function createMobileGameSection(context) {
    return createStackedTopicSection(context, {
        pageClass: "page-mobile",
        shellClass: "topic-stack-shell",
        titleCardClass: "topic-stack-title-card",
        titleClass: "topic-stack-title",
        listClass: "topic-stack-list topic-stack-list-4",
        itemClass: "topic-stack-item",
        copyClass: "topic-stack-copy",
        itemCount: 4
    });
}

function getFixedItems(items, count) {
    const normalizedItems = ensureItems(items, [""]);
    const result = normalizedItems.slice(0, count);

    while (result.length < count) {
        result.push("");
    }

    return result;
}

function createStackedTopicSection(context, {
    pageClass,
    shellClass,
    titleCardClass,
    titleClass,
    listClass,
    itemClass,
    copyClass,
    itemCount
}) {
    const section = createSectionBase(pageClass);
    const shell = createDiv(`page-shell ${shellClass}`);
    const titleCard = createDiv(`${titleCardClass} page-card`);
    const sentenceGrid = createDiv(listClass);
    const items = getFixedItems(context.lines, itemCount);

    titleCard.appendChild(createTextElement("h2", `section-title ${titleClass}`, context.title));
    shell.appendChild(titleCard);

    items.forEach(item => {
        const card = createDiv(`${itemClass} page-card`);
        card.appendChild(createRichTextElement("p", copyClass, item));
        sentenceGrid.appendChild(card);
    });

    shell.appendChild(sentenceGrid);
    section.appendChild(shell);

    return section;
}

function createRosterSection(context, pageClass, listLabel) {
    const section = createSectionBase(pageClass);
    const shell = createDiv("page-shell roster-shell");
    const header = createDiv("roster-header");
    const lead = context.paragraphs[0] ?? context.copy;
    const entries = ensureItems(context.lines, [context.copy || context.label]);
    const summary = createDiv("roster-summary page-card");

    header.appendChild(createHeaderBlock(context, listLabel));
    header.appendChild(createRichTextElement("p", "roster-lead", lead));

    summary.appendChild(createTextElement("p", "page-card-label", "Collection"));
    summary.appendChild(createTextElement("p", "roster-summary-value", String(entries.length).padStart(2, "0")));
    summary.appendChild(createTextElement("p", "roster-summary-copy", context.label));

    shell.appendChild(header);
    shell.appendChild(summary);
    shell.appendChild(createLineList(entries, "roster-track", "roster-entry page-card", { numbered: true }));
    section.appendChild(shell);

    return section;
}

function createAcgLikesSection(context) {
    return createLikesCollectionSection(context, "page-acg-likes");
}

function createOtherLikesSection(context) {
    return createLikesCollectionSection(context, "page-other-likes", context.lines);
}

function createLikesCollectionSection(context, pageClass, customSourceItems = null) {
    const section = createSectionBase(pageClass);
    const shell = createDiv("page-shell likes-collection-shell");
    const titleCard = createDiv("likes-collection-title-card page-card");
    const grid = createDiv("likes-collection-list");
    const sourceItems = customSourceItems ?? (context.segments.length > 0 ? context.segments : context.lines);
    const items = getFixedItems(sourceItems, 6);

    titleCard.appendChild(createTextElement("h2", "section-title likes-collection-title", context.title));
    shell.appendChild(titleCard);

    items.forEach(item => {
        const card = createDiv("likes-collection-item page-card");
        card.appendChild(createRichTextElement("p", "likes-collection-copy", item));
        grid.appendChild(card);
    });

    shell.appendChild(grid);
    section.appendChild(shell);

    return section;
}

function getFallbackArtwork() {
    return artworksData[0] ?? null;
}

function getActiveArtwork() {
    const activeArtwork = getArtworkById(state.activeArtworkId);

    if (activeArtwork) {
        return activeArtwork;
    }

    const fallbackArtwork = getFallbackArtwork();

    if (fallbackArtwork && state.activeArtworkId !== fallbackArtwork.id) {
        updateState({ activeArtworkId: fallbackArtwork.id });
    }

    return fallbackArtwork;
}

function hashString(value) {
    return Array.from(value).reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 7);
}

function getBubbleScale(artworkId, index) {
    const hash = hashString(artworkId);
    const patternIndex = (hash + index) % BUBBLE_SIZE_PATTERN.length;
    return BUBBLE_SIZE_PATTERN[patternIndex];
}

function getBubbleRadius(scale) {
    return 4.4 * scale;
}

function isInsideScatterBounds(x, y, radius) {
    const { left, right, top, bottom } = GALLERY_SCATTER.bounds;

    return (
        x >= left + radius &&
        x <= right - radius &&
        y >= top + radius &&
        y <= bottom - radius
    );
}

function overlapsFocusPanel(x, y, radius) {
    const { left, right, top, bottom } = GALLERY_SCATTER.focusPanel;

    return !(
        x + radius < left ||
        x - radius > right ||
        y + radius < top ||
        y - radius > bottom
    );
}

function overlapsOtherBubbles(x, y, radius, placements) {
    return placements.some(placement => {
        const gap = radius + placement.radius + GALLERY_SCATTER.collisionPadding;
        return Math.hypot(x - placement.x, y - placement.y) < gap;
    });
}

function createBubblePlacement(index, radius, placements) {
    for (let attempt = 0; attempt < GALLERY_SCATTER.maxPlacementAttempts; attempt += 1) {
        const ringIndex = Math.floor(attempt / 8);
        const angleDeg = ((index * 29) + (attempt * GOLDEN_ANGLE)) % 360;
        const angleRad = (angleDeg - 90) * (Math.PI / 180);
        const radialOffset = ((index + attempt) % 3) - 1;
        const distance = GALLERY_SCATTER.minRadius
            + (ringIndex * GALLERY_SCATTER.radiusStep)
            + (radialOffset * 1.35);
        const x = Math.cos(angleRad) * distance;
        const y = Math.sin(angleRad) * distance * GALLERY_SCATTER.yScale;

        if (!isInsideScatterBounds(x, y, radius)) {
            continue;
        }

        if (overlapsFocusPanel(x, y, radius)) {
            continue;
        }

        if (overlapsOtherBubbles(x, y, radius, placements)) {
            continue;
        }

        return { x, y, radius };
    }

    const fallbackAngle = ((index * GOLDEN_ANGLE) - 90) * (Math.PI / 180);
    const fallbackDistance = GALLERY_SCATTER.minRadius + (Math.ceil(index / 3) * GALLERY_SCATTER.radiusStep);

    return {
        x: Math.cos(fallbackAngle) * fallbackDistance,
        y: Math.sin(fallbackAngle) * fallbackDistance * GALLERY_SCATTER.yScale,
        radius
    };
}

function createBubbleLayouts(artworks) {
    const placements = [];
    const layoutByArtworkId = new Map();
    const sizedArtworks = artworks
        .map((artwork, index) => {
            const scale = getBubbleScale(artwork.id, index);
            const radius = getBubbleRadius(scale);

            return {
                artwork,
                index,
                scale,
                radius
            };
        })
        .sort((left, right) => right.radius - left.radius || left.index - right.index);

    sizedArtworks.forEach((entry, orderIndex) => {
        const placement = createBubblePlacement(entry.index + orderIndex, entry.radius, placements);

        placements.push({
            artworkId: entry.artwork.id,
            radius: entry.radius,
            x: placement.x,
            y: placement.y
        });

        layoutByArtworkId.set(entry.artwork.id, {
            artworkId: entry.artwork.id,
            scale: entry.scale,
            radius: entry.radius,
            x: placement.x,
            y: placement.y
        });
    });

    return artworks.map(artwork => layoutByArtworkId.get(artwork.id));
}

function animatePreview(previewFrame) {
    previewFrame.classList.remove("is-updating");
    void previewFrame.offsetWidth;
    previewFrame.classList.add("is-updating");
}

function updateGallerySection(section, artwork, currentLang) {
    if (!artwork) {
        return;
    }

    const previewImage = section.querySelector("[data-gallery-preview-image]");
    const title = section.querySelector("[data-gallery-art-title]");
    const description = section.querySelector("[data-gallery-description]");
    const counter = section.querySelector("[data-gallery-counter]");
    const previewFrame = section.querySelector("[data-gallery-preview-frame]");
    const bubbles = section.querySelectorAll("[data-gallery-artwork-id]");
    const activeIndex = artworksData.findIndex(entry => entry.id === artwork.id);

    previewImage.src = artwork.src;
    previewImage.alt = artwork.alt[currentLang];
    title.textContent = artwork.title[currentLang];
    description.textContent = artwork.description[currentLang];

    if (counter) {
        counter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(artworksData.length).padStart(2, "0")}`;
    }

    bubbles.forEach(bubble => {
        const isActive = bubble.dataset.galleryArtworkId === artwork.id;
        bubble.classList.toggle("is-active", isActive);
        bubble.setAttribute("aria-pressed", String(isActive));
    });

    animatePreview(previewFrame);
}

function createGallerySection(context) {
    const section = createSectionBase("page-gallery section-gallery");

    if (artworksData.length === 0) {
        const emptyShell = createDiv("page-shell page-empty-shell");

        emptyShell.appendChild(createHeaderBlock(context, "Portfolio"));
        emptyShell.appendChild(createRichTextElement("p", "page-empty-copy", context.copy));
        section.appendChild(emptyShell);

        return section;
    }

    const activeArtwork = getActiveArtwork();
    const shell = createDiv("gallery-shell");
    const orbit = createDiv("gallery-orbit");
    const focusPanel = createDiv("gallery-focus-panel");
    const counter = createTextElement("p", "gallery-counter", "");
    const guide = createTextElement("p", "gallery-guide", GALLERY_PROMPT[context.currentLang] ?? GALLERY_PROMPT.en);
    const preview = createDiv("gallery-preview");
    const previewFrame = createDiv("gallery-preview-frame");
    const previewImage = document.createElement("img");
    const infoBox = createDiv("gallery-info-box");
    const infoHeader = createTextElement("p", "gallery-info-label", context.title);
    const bubbleLayouts = createBubbleLayouts(artworksData);

    previewFrame.dataset.galleryPreviewFrame = "true";
    previewImage.className = "gallery-preview-image";
    previewImage.dataset.galleryPreviewImage = "true";
    previewFrame.appendChild(previewImage);
    preview.appendChild(previewFrame);
    counter.dataset.galleryCounter = "true";

    const artworkTitle = createTextElement("h2", "section-title gallery-art-title", "");
    artworkTitle.dataset.galleryArtTitle = "true";

    const description = createTextElement("p", "section-copy gallery-description", "");
    description.dataset.galleryDescription = "true";

    infoBox.appendChild(infoHeader);
    infoBox.appendChild(artworkTitle);
    infoBox.appendChild(description);

    focusPanel.appendChild(counter);
    focusPanel.appendChild(preview);
    focusPanel.appendChild(guide);
    focusPanel.appendChild(infoBox);
    orbit.appendChild(focusPanel);

    artworksData.forEach((artwork, index) => {
        const bubble = document.createElement("button");
        const layout = bubbleLayouts[index];
        const thumbnail = document.createElement("img");

        bubble.type = "button";
        bubble.className = "gallery-bubble";
        bubble.dataset.galleryArtworkId = artwork.id;
        bubble.style.setProperty("--bubble-x", `${layout.x.toFixed(2)}%`);
        bubble.style.setProperty("--bubble-y", `${layout.y.toFixed(2)}%`);
        bubble.style.setProperty("--bubble-scale", layout.scale.toFixed(2));
        bubble.setAttribute("aria-label", artwork.title[context.currentLang]);

        thumbnail.className = "gallery-bubble-image";
        thumbnail.src = artwork.src;
        thumbnail.alt = artwork.alt[context.currentLang];

        bubble.appendChild(thumbnail);
        bubble.addEventListener("click", () => {
            updateState({ activeArtworkId: artwork.id });
            updateGallerySection(section, artwork, context.currentLang);
        });

        orbit.appendChild(bubble);
    });
    shell.appendChild(orbit);
    section.appendChild(shell);

    updateGallerySection(section, activeArtwork, context.currentLang);

    return section;
}

function createCommissionGuideSection(context) {
    const guideContent = context.currentLang === "zh"
        ? {
            title: "委託須知",
            paragraphs: [
                "確認委託即默認買家成年&詳閱下列注意事項",
                "不接受一切難以理解之理由取消委託，付款後除我方問題外恕不退款",
                "✎請務必以你覺得最醜的那張圖來當作參考\n✎因要素呈現不易，成圖會有適當簡化\n✎硬性要求與色票相同者請繞道\n✎一律只有灰色背景，如需簡易背景請加購（+NT$10）\n✎繪製完成後會上水印展示\n✎驚喜包除設定畫錯之外，完稿限修改一次，第二次及以上需加價",
                "♠︎非商價格 - 如價目表定價所示\n♥︎商用價格 - 定價X2\n♦︎非商用買斷價格 - 定價X3\n♣︎商用買斷價格 - 定價X5\nꕤ繪師著作人格權以外買斷價格 - 定價X10"
            ]
        }
        : {
            title: "Commission Guide",
            paragraphs: [
                "Confirming a commission means the buyer is an adult and has read the notes below.",
                "Cancellation is not accepted for vague reasons. After payment, refunds are only available for issues on my side.",
                "Use the least flattering reference image as your main reference.\nComplex design elements may be simplified in the final piece.\nIf you require exact color-picking matches, this service is not a fit.\nThe default background is gray. A simple background add-on is +NT$10.\nFinished artwork may be shown with a watermark.",
                "♠ Non-commercial price - listed menu price\n♥ Commercial price - base price x2\n♦ Non-commercial buyout - base price x3\n♣ Commercial buyout - base price x5\nꕤ Buyout excluding moral rights - base price x10"
            ]
        };
    const section = createSectionBase("page-notice");
    const shell = createDiv("page-shell commission-guide-shell");
    const titleCard = createDiv("commission-guide-title-card page-card");
    const board = createDiv("commission-guide-list");
    const paragraphs = getFixedItems(guideContent.paragraphs, 4);

    titleCard.appendChild(createTextElement("h2", "section-title commission-guide-title", guideContent.title));
    shell.appendChild(titleCard);

    paragraphs.forEach((paragraph, index) => {
        const card = createDiv(`commission-guide-item page-card commission-guide-item-${index + 1}`);
        card.appendChild(createTextElement("p", "page-card-label commission-guide-label", `0${index + 1}`));
        card.appendChild(createRichTextElement("div", "commission-guide-copy", paragraph));
        board.appendChild(card);
    });

    shell.appendChild(board);
    section.appendChild(shell);

    return section;
}

function getMenuContent(currentLang) {
    if (currentLang === "zh") {
        return {
            offer: "★目前開設項目★\n頭像驚喜包 - 肩膀以上，7 Day（不含周日）\n指定頭像 - 7 Day\n\n試營運\n半身驚喜包 - 腰部以上，14 Day （不含周日）\n指定半身 - 14 Day",
            details: [
                "- 驚喜包 -\n頭像驚喜包 - NT$ 400\n半身驚喜包 - NT$ 900",
                "- 指定項目 -\n肩上頭像 - NT$ 500\n腰上半身 - NT$ 1000"
            ]
        };
    }

    return {
        offer: "★ Open Commissions ★\nSurprise icon pack - above the shoulders, 7 days (Sunday excluded)\nSpecified icon - 7 days\n\nTrial run\nSurprise half-body - above the waist, 14 days (Sunday excluded)\nSpecified half-body - 14 days",
        details: [
            "- Surprise Pack -\nIcon surprise pack - NT$ 400\nHalf-body surprise pack - NT$ 900",
            "- Specified Item -\nShoulder-up icon - NT$ 500\nWaist-up half-body - NT$ 1000"
        ]
    };
}

function createMenuSection(context) {
    const section = createSectionBase("page-menu");
    const shell = createDiv("page-shell menu-shell");
    const menuContent = getMenuContent(context.currentLang);
    const offerCard = createDiv("menu-offer page-card");
    const sideStack = createDiv("menu-side-stack");

    shell.appendChild(createHeaderBlock(context, "Commission menu"));

    offerCard.appendChild(createTextElement("p", "page-card-label", "Main offer"));
    offerCard.appendChild(createRichTextElement("div", "menu-offer-copy", menuContent.offer));
    shell.appendChild(offerCard);

    menuContent.details.forEach((line, index) => {
        const card = createDiv(`menu-side-card page-card menu-side-card-${(index % 2) + 1}`);
        card.appendChild(createTextElement("p", "page-card-label", index === 0 ? "Details" : "Notes"));
        card.appendChild(createRichTextElement("p", "page-note-copy", line));
        sideStack.appendChild(card);
    });

    shell.appendChild(sideStack);
    section.appendChild(shell);

    return section;
}

function createTimelineSection(context) {
    const section = createSectionBase("page-timeline");
    const shell = createDiv("page-shell timeline-shell");
    const steps = ensureItems(context.lines, [context.copy || context.label]);
    const rail = createDiv("timeline-rail");

    shell.appendChild(createHeaderBlock(context, "Roadmap"));

    FALLBACK_PHASES.forEach((phase, index) => {
        const item = createDiv(`timeline-item page-card timeline-item-${index + 1}`);
        const copy = steps[index] ?? context.copy ?? context.label;

        item.appendChild(createTextElement("p", "page-card-label", phase));
        item.appendChild(createTextElement("p", "timeline-index", `0${index + 1}`));
        item.appendChild(createRichTextElement("p", "page-note-copy", copy));
        rail.appendChild(item);
    });

    shell.appendChild(rail);
    section.appendChild(shell);

    return section;
}

function createBlueprintSection(context) {
    const section = createSectionBase("page-blueprint");
    const shell = createDiv("page-shell blueprint-shell");
    const pillars = ensureItems(context.lines, [context.copy || context.label]);
    const panel = createDiv("blueprint-panel");

    shell.appendChild(createHeaderBlock(context, "Overview"));
    shell.appendChild(createRichTextElement("p", "blueprint-copy", context.copy));

    FALLBACK_PILLARS.forEach((pillar, index) => {
        const card = createDiv(`blueprint-card page-card blueprint-card-${index + 1}`);
        card.appendChild(createTextElement("p", "page-card-label", pillar));
        card.appendChild(createRichTextElement("p", "page-note-copy", pillars[index] ?? context.copy ?? context.label));
        panel.appendChild(card);
    });

    shell.appendChild(panel);
    section.appendChild(shell);

    return section;
}

function createStorySection(context) {
    const section = createSectionBase("page-story");
    const shell = createDiv("page-shell story-shell");
    const paragraphs = ensureItems(context.paragraphs, [context.copy || context.label]);
    const leftPage = createDiv("story-page page-card");
    const rightPage = createDiv("story-page page-card");

    leftPage.appendChild(createHeaderBlock(context, "Story"));
    leftPage.appendChild(createRichTextElement("p", "story-lead", paragraphs[0]));

    rightPage.appendChild(createTextElement("p", "page-card-label", "Notes"));
    ensureItems(paragraphs.slice(1), [context.label]).forEach(item => {
        rightPage.appendChild(createRichTextElement("p", "story-paragraph", item));
    });

    shell.appendChild(leftPage);
    shell.appendChild(rightPage);
    section.appendChild(shell);

    return section;
}

function createGameplaySection(context) {
    const section = createSectionBase("page-gameplay");
    const shell = createDiv("page-shell gameplay-shell");
    const cards = ensureItems(context.lines, [context.copy || context.label]);

    shell.appendChild(createHeaderBlock(context, "Gameplay"));
    shell.appendChild(createLineList(cards, "gameplay-stack", "gameplay-card page-card", { numbered: true }));
    section.appendChild(shell);

    return section;
}

function createDevlogSection(context) {
    const section = createSectionBase("page-devlog");
    const shell = createDiv("page-shell devlog-shell");
    const logs = ensureItems(context.lines, [context.copy || context.label]);
    const terminal = createDiv("devlog-terminal");

    shell.appendChild(createHeaderBlock(context, "Devlog"));

    logs.forEach((entry, index) => {
        const row = createDiv("devlog-row");
        row.appendChild(createTextElement("span", "devlog-prompt", `[${String(index + 1).padStart(2, "0")}]`));
        row.appendChild(createRichTextElement("p", "devlog-entry", entry));
        terminal.appendChild(row);
    });

    shell.appendChild(terminal);
    shell.appendChild(createRichTextElement("p", "devlog-summary", context.copy));
    section.appendChild(shell);

    return section;
}

function getLinkDestinations(context) {
    return context.category.subs
        .map(item => {
            if (item.type === "l") {
                return {
                    label: item.label[context.currentLang],
                    href: item.url,
                    note: item.copy[context.currentLang]
                };
            }

            const copy = item.copy?.[context.currentLang];

            if (typeof copy === "string" && copy.includes("@")) {
                return {
                    label: item.label[context.currentLang],
                    href: `mailto:${copy}`,
                    note: copy
                };
            }

            return null;
        })
        .filter(Boolean);
}

function createLinkHubSection(context) {
    const section = createSectionBase("page-links");
    const shell = createDiv("page-shell links-shell");
    const grid = createDiv("links-grid");
    const destinations = ensureItems(getLinkDestinations(context), []);

    shell.appendChild(createHeaderBlock(context, "Links"));
    shell.appendChild(createRichTextElement("p", "links-copy", context.copy || context.label));

    destinations.forEach(destination => {
        const card = createDiv("link-card page-card");
        const actionLabel = destination.href.startsWith("mailto:") ? "Send mail" : "Open link";

        card.appendChild(createTextElement("p", "page-card-label", destination.label));
        card.appendChild(createRichTextElement("p", "link-note", destination.note));
        card.appendChild(createActionLink(destination.href, actionLabel, "page-action link-action"));
        grid.appendChild(card);
    });

    shell.appendChild(grid);
    section.appendChild(shell);

    return section;
}

function createExternalLinkSection(context) {
    const section = createSectionBase("page-external");
    const shell = createDiv("page-shell external-shell");
    const card = createDiv("external-card page-card");
    const actionLabel = `Open ${context.label}`;

    shell.appendChild(createHeaderBlock(context, "External"));

    card.appendChild(createTextElement("p", "page-card-label", context.label));
    card.appendChild(createTextElement("p", "external-url", context.sub.url));
    card.appendChild(createRichTextElement("p", "page-note-copy", context.copy || context.label));
    card.appendChild(createActionLink(context.sub.url, actionLabel));

    shell.appendChild(card);
    section.appendChild(shell);

    return section;
}

function createContactSection(context) {
    const section = createSectionBase("page-contact");
    const shell = createDiv("page-shell contact-shell");
    const card = createDiv("contact-card page-card");
    const email = context.copy || context.label;

    shell.appendChild(createHeaderBlock(context, "Contact"));

    card.appendChild(createTextElement("p", "page-card-label", "Email"));
    card.appendChild(createTextElement("p", "contact-address", email));
    card.appendChild(createActionLink(`mailto:${email}`, "Compose mail"));

    shell.appendChild(card);
    section.appendChild(shell);

    return section;
}

function createDefaultSection(context) {
    const section = createSectionBase("page-default");
    const shell = createDiv("page-shell default-shell");

    shell.appendChild(createHeaderBlock(context));
    shell.appendChild(createParagraphStack(ensureItems(context.paragraphs, [context.copy]), "default-copy", "default-paragraph"));
    section.appendChild(shell);

    return section;
}

function resolveSectionBuilder(context) {
    if (context.sub.layout === GALLERY_LAYOUT) {
        return createGallerySection;
    }

    return PAGE_BUILDERS[context.pageId] ?? createDefaultSection;
}

export function renderSections({ root, siteData, currentLang }) {
    root.innerHTML = "";

    siteData.forEach((category, categoryIndex) => {
        category.subs.forEach((sub, subIndex) => {
            const context = createPageContext({
                category,
                categoryIndex,
                sub,
                subIndex,
                currentLang
            });
            const builder = resolveSectionBuilder(context);
            const section = builder(context);

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
