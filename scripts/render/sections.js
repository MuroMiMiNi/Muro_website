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
const GALLERY_SCATTER_COMPACT = {
    minRadius: 26.5,
    radiusStep: 5.2,
    yScale: 1.02,
    collisionPadding: 2.5,
    maxPlacementAttempts: 320,
    bounds: {
        left: -48,
        right: 48,
        top: -48,
        bottom: 48
    },
    focusPanel: {
        left: -27,
        right: 27,
        top: -28,
        bottom: 28
    }
};
const GALLERY_SCATTER_MOBILE = {
    minRadius: 29.5,
    radiusStep: 4.8,
    yScale: 1.1,
    collisionPadding: 2.2,
    maxPlacementAttempts: 360,
    bounds: {
        left: -47,
        right: 47,
        top: -47,
        bottom: 47
    },
    focusPanel: {
        left: -22,
        right: 22,
        top: -24,
        bottom: 24
    }
};
const BUBBLE_SIZE_PATTERN = [1.18, 0.9, 1.08, 0.84, 1.12, 0.96, 1.22, 0.88];
const FALLBACK_PHASES = ["Now", "Next", "Later"];
const FALLBACK_PILLARS = ["Core Loop", "World", "Feel", "Progression"];
const MENU_BADGE_ICONS = {
    crown: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 18h14l-1.1-8.1-3.55 2.84L12 6.5 9.65 12.74 6.1 9.9 5 18Zm0-10.5A1.5 1.5 0 1 0 5 4.5a1.5 1.5 0 0 0 0 3Zm7 0A1.5 1.5 0 1 0 12 4.5a1.5 1.5 0 0 0 0 3Zm7 0A1.5 1.5 0 1 0 19 4.5a1.5 1.5 0 0 0 0 3ZM5 20h14v-1.2H5V20Z"></path>
        </svg>
    `,
    bear: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M8.15 7.1 5.6 4.55a.9.9 0 0 0-1.53.64v4.19A7.9 7.9 0 0 0 3.4 12.6c0 4.36 3.7 7.9 8.6 7.9s8.6-3.54 8.6-7.9a7.9 7.9 0 0 0-.67-3.22V5.19a.9.9 0 0 0-1.53-.64L15.85 7.1A9.2 9.2 0 0 0 12 6.3a9.2 9.2 0 0 0-3.85.8Zm.62 1.78A7.2 7.2 0 0 1 12 8.1c1.13 0 2.18.26 3.23.78l.22.1 2.68-2.68v3.57l.08.16a6.07 6.07 0 0 1 .59 2.57c0 3.35-2.93 6.08-6.8 6.08s-6.8-2.73-6.8-6.08c0-.9.2-1.79.59-2.57l.08-.16V6.3l2.68 2.68.22-.1Zm-.37 3.13a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1Zm5.2 0a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1Zm-3.77 3.58a.9.9 0 0 0 0 1.8h4.34a.9.9 0 1 0 0-1.8Z"></path>
        </svg>
    `
};
const MENU_STAT_ICONS = {
    tag: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M10.2 4H5a1 1 0 0 0-1 1v5.2a1 1 0 0 0 .29.7l8.81 8.81a1 1 0 0 0 1.41 0l5.3-5.3a1 1 0 0 0 0-1.41L11 4.3A1 1 0 0 0 10.2 4ZM7.5 9A1.5 1.5 0 1 1 9 7.5 1.5 1.5 0 0 1 7.5 9Z"></path>
        </svg>
    `,
    user: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 12.2a4.1 4.1 0 1 0-4.1-4.1 4.1 4.1 0 0 0 4.1 4.1Zm0 2c-4.26 0-7.7 2.17-7.7 4.85V20h15.4v-.95c0-2.68-3.44-4.85-7.7-4.85Z"></path>
        </svg>
    `,
    image: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M5 5h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm0 11.5 3.6-4.1a1 1 0 0 1 1.48-.02l2.4 2.63 2.1-2.35a1 1 0 0 1 1.48.01L19 16V7H5v9.5ZM8.5 10.1A1.35 1.35 0 1 0 7.15 8.75 1.35 1.35 0 0 0 8.5 10.1Z"></path>
        </svg>
    `,
    clock: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 3.8A8.2 8.2 0 1 0 20.2 12 8.2 8.2 0 0 0 12 3.8Zm0 14.7A6.5 6.5 0 1 1 18.5 12 6.5 6.5 0 0 1 12 18.5Zm.85-10.1h-1.7V12c0 .3.12.59.33.8l2.6 2.6 1.2-1.2-2.43-2.43V8.4Z"></path>
        </svg>
    `,
    file: `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M7 3.8h7.2L19 8.6V19a1.2 1.2 0 0 1-1.2 1.2H7A1.2 1.2 0 0 1 5.8 19V5A1.2 1.2 0 0 1 7 3.8Zm6.4 1.9V9h3.3ZM8.4 12.1h7.2v1.5H8.4Zm0 3.1h5.1v1.5H8.4Z"></path>
        </svg>
    `
};
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

function createMenuBadge(kind) {
    const badge = createDiv("menu-showcase-badge");
    badge.innerHTML = MENU_BADGE_ICONS[kind] ?? "";
    return badge;
}

function createMenuStatList(items) {
    const list = createDiv("menu-showcase-stats");

    items.forEach(item => {
        const row = createDiv("menu-showcase-stat");
        const icon = createDiv("menu-showcase-stat-icon");
        const copy = createTextElement("p", "menu-showcase-stat-copy", item.text);

        icon.innerHTML = MENU_STAT_ICONS[item.icon] ?? "";
        row.appendChild(icon);
        row.appendChild(copy);
        list.appendChild(row);
    });

    return list;
}

function createMenuAction(label) {
    const action = createDiv("menu-showcase-action");
    const copy = createTextElement("span", "menu-showcase-action-copy", label);
    const arrow = createTextElement("span", "menu-showcase-action-arrow", ">");

    action.appendChild(copy);
    action.appendChild(arrow);

    return action;
}

function createMenuShowcaseCard(card, variant) {
    const article = createDiv(`menu-showcase-card menu-showcase-card--${variant} page-card`);
    const media = createDiv(`menu-showcase-media menu-showcase-media--${variant}`);
    const frame = createDiv(`menu-showcase-mask menu-showcase-mask--${card.image.kind}`);
    const image = document.createElement("img");
    const fade = createDiv(`menu-showcase-fade menu-showcase-fade--${variant}`);
    const body = createDiv("menu-showcase-body");
    const header = createDiv("menu-showcase-heading");

    image.className = `menu-showcase-art menu-showcase-art--${card.image.kind}`;
    image.src = card.image.src;
    image.alt = card.image.alt;
    image.draggable = false;

    header.appendChild(createTextElement("p", "menu-showcase-label", card.label));
    header.appendChild(createTextElement("h3", "menu-showcase-title", card.title));
    header.appendChild(createDiv("menu-showcase-divider"));

    body.appendChild(header);
    body.appendChild(createMenuStatList(card.stats));

    frame.appendChild(image);
    media.appendChild(frame);
    media.appendChild(fade);

    article.appendChild(createMenuBadge(card.badge));
    article.appendChild(media);
    article.appendChild(body);
    article.appendChild(createMenuAction(card.action));

    return article;
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
    image.draggable = false;

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

function getGalleryScatterMode() {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return "desktop";
    }

    if (window.matchMedia("(max-width: 768px), (max-height: 700px)").matches) {
        return "mobile";
    }

    if (window.matchMedia("(max-width: 960px), (max-height: 820px)").matches) {
        return "compact";
    }

    return "desktop";
}

function getGalleryScatterConfig() {
    const scatterMode = getGalleryScatterMode();

    if (scatterMode === "mobile") {
        return GALLERY_SCATTER_MOBILE;
    }

    if (scatterMode === "compact") {
        return GALLERY_SCATTER_COMPACT;
    }

    return GALLERY_SCATTER;
}

function isInsideScatterBounds(x, y, radius, scatterConfig) {
    const { left, right, top, bottom } = scatterConfig.bounds;

    return (
        x >= left + radius &&
        x <= right - radius &&
        y >= top + radius &&
        y <= bottom - radius
    );
}

function overlapsFocusPanel(x, y, radius, scatterConfig) {
    const { left, right, top, bottom } = scatterConfig.focusPanel;

    return !(
        x + radius < left ||
        x - radius > right ||
        y + radius < top ||
        y - radius > bottom
    );
}

function overlapsOtherBubbles(x, y, radius, placements, scatterConfig) {
    return placements.some(placement => {
        const gap = radius + placement.radius + scatterConfig.collisionPadding;
        return Math.hypot(x - placement.x, y - placement.y) < gap;
    });
}

function createBubblePlacement(index, radius, placements, scatterConfig) {
    for (let attempt = 0; attempt < scatterConfig.maxPlacementAttempts; attempt += 1) {
        const ringIndex = Math.floor(attempt / 8);
        const angleDeg = ((index * 29) + (attempt * GOLDEN_ANGLE)) % 360;
        const angleRad = (angleDeg - 90) * (Math.PI / 180);
        const radialOffset = ((index + attempt) % 3) - 1;
        const distance = scatterConfig.minRadius
            + (ringIndex * scatterConfig.radiusStep)
            + (radialOffset * 1.35);
        const x = Math.cos(angleRad) * distance;
        const y = Math.sin(angleRad) * distance * scatterConfig.yScale;

        if (!isInsideScatterBounds(x, y, radius, scatterConfig)) {
            continue;
        }

        if (overlapsFocusPanel(x, y, radius, scatterConfig)) {
            continue;
        }

        if (overlapsOtherBubbles(x, y, radius, placements, scatterConfig)) {
            continue;
        }

        return { x, y, radius };
    }

    const fallbackAngle = ((index * GOLDEN_ANGLE) - 90) * (Math.PI / 180);
    const fallbackDistance = scatterConfig.minRadius + (Math.ceil(index / 3) * scatterConfig.radiusStep);

    return {
        x: Math.cos(fallbackAngle) * fallbackDistance,
        y: Math.sin(fallbackAngle) * fallbackDistance * scatterConfig.yScale,
        radius
    };
}

function createBubbleLayouts(artworks, scatterConfig = GALLERY_SCATTER) {
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
        const placement = createBubblePlacement(entry.index + orderIndex, entry.radius, placements, scatterConfig);

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
    const scatterMode = getGalleryScatterMode();
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
    const bubbleLayouts = createBubbleLayouts(artworksData, getGalleryScatterConfig());

    section.dataset.galleryViewportMode = scatterMode;

    previewFrame.dataset.galleryPreviewFrame = "true";
    previewImage.className = "gallery-preview-image";
    previewImage.dataset.galleryPreviewImage = "true";
    previewImage.draggable = false;
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
        thumbnail.draggable = false;

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
                "不接受一切難以理解之理由取消委託，付款後除我方問題外恕不退款\n<span style=\"color: #d92d20; font-weight: 800;\">週日不進行繪製作業，因此工期不包含週日的天數</span>",
                "✎請務必以你覺得最醜的那張圖來當作參考\n✎因要素呈現不易，成圖會有適當簡化\n✎硬性要求與色票相同者請繞道\n✎一律只有灰色背景，如需簡易背景請加購（+NT$10）\n✎繪製完成後會上水印展示\n✎驚喜包除設定畫錯之外，完稿限修改一次，第二次及以上需加價",
                "♠︎非商價格 - 如價目表定價所示\n♥︎商用價格 - 定價X2\n♦︎非商用買斷價格 - 定價X3\n♣︎商用買斷價格 - 定價X5\nꕤ繪師著作人格權以外買斷價格 - 定價X10"
            ]
        }
        : {
            title: "Commission Guide",
            paragraphs: [
                "Confirming a commission means the buyer is an adult and has read the notes below.",
                "Cancellation is not accepted for vague or unreasonable reasons. After payment, refunds are only available for issues on my side.\n<span style=\"color: #d92d20; font-weight: 800;\">No drawing work is done on Sundays, so turnaround time does not include Sundays.</span>",
                "Please use the ugliest reference image you have as your main reference.\nSome design elements may be simplified if they are difficult to render clearly.\nIf you require exact color matching to a swatch, this service is not a good fit.\nThe default background is gray. A simple background can be added for +NT$10.\nFinished artwork may be displayed with a watermark.\nFor surprise packs, revisions are limited to one after final delivery unless the setting was drawn incorrectly. A second revision or more will incur an extra charge.",
                "♠ Non-commercial price - listed menu price\n♥ Commercial price - base price x2\n♦ Non-commercial buyout - base price x3\n♣ Commercial buyout - base price x5\nꕤ Buyout excluding the artist's moral rights - base price x10"
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

function getMenuShowcaseContent(currentLang) {
    const commissionImageVersion = "20260606-1";
    const fullExample = `./assets/commission/ful-body/full-body-example.png?v=${commissionImageVersion}`;
    const halfExample = `./assets/commission/half-body/half-body-example.png?v=${commissionImageVersion}`;
    const iconExample = artworksData[1]?.src ?? artworksData[0]?.src ?? fullExample;

    if (currentLang === "zh") {
        return {
            offer: {
                badge: "crown",
                label: "FULL BODY",
                title: "全身委託",
                stats: [
                    { icon: "tag", text: "NT$ 2,800 起" },
                    { icon: "user", text: "單一角色" },
                    { icon: "image", text: "無背景 / 簡易背景（+NT$ 20）" },
                    { icon: "clock", text: "工期 14 天" },
                    { icon: "file", text: "像素難呈現的要素會簡化" }
                ],
                action: "查看詳情",
                image: {
                    src: fullExample,
                    alt: "全身委託展示圖",
                    kind: "full"
                }
            },
            details: {
                badge: "bear",
                label: "AVATAR",
                title: "頭像委託",
                stats: [
                    { icon: "tag", text: "驚喜包 NT$ 400" },
                    { icon: "tag", text: "頭像 NT$ 500" },
                    { icon: "clock", text: "工期 7 天" }
                ],
                action: "查看詳情",
                image: {
                    src: iconExample,
                    alt: "頭像委託展示圖",
                    kind: "icon"
                }
            },
            notes: {
                badge: "bear",
                label: "HALF BODY",
                title: "半身委託",
                stats: [
                    { icon: "tag", text: "NT$ 1,100 起" },
                    { icon: "clock", text: "工期 7-14 天" },
                    { icon: "user", text: "範圍腰部以上" }
                ],
                action: "查看詳情",
                image: {
                    src: halfExample,
                    alt: "半身委託展示圖",
                    kind: "half"
                }
            }
        };
    }

    return {
        offer: {
            badge: "crown",
            label: "FULL BODY",
            title: "Full Body",
            stats: [
                { icon: "tag", text: "From NT$ 2,800" },
                { icon: "user", text: "Single character" },
                    { icon: "image", text: "No background / simple background (+NT$ 20)" },
                    { icon: "clock", text: "Turnaround: 14 days" },
                    { icon: "file", text: "Elements that are hard to express in pixel style may be simplified" }
            ],
            action: "View details",
            image: {
                src: fullExample,
                alt: "Full body commission preview",
                kind: "full"
            }
        },
        details: {
            badge: "bear",
            label: "AVATAR",
                title: "Avatar Commission",
            stats: [
                { icon: "tag", text: "Surprise pack NT$ 400" },
                { icon: "tag", text: "Avatar NT$ 500" },
                    { icon: "clock", text: "Turnaround: 7 days" }
            ],
            action: "View details",
            image: {
                src: iconExample,
                    alt: "Avatar commission preview",
                kind: "icon"
            }
        },
        notes: {
            badge: "bear",
            label: "HALF BODY",
            title: "Half Body",
            stats: [
                { icon: "tag", text: "From NT$ 1,100" },
                    { icon: "clock", text: "Turnaround: 7-14 days" },
                    { icon: "user", text: "Waist-up composition" }
            ],
            action: "View details",
            image: {
                src: halfExample,
                alt: "Half body commission preview",
                kind: "half"
            }
        }
    };
}

function createMenuSection(context) {
    const section = createSectionBase("page-menu");
    const shell = createDiv("page-shell menu-shell");
    const menuContent = getMenuShowcaseContent(context.currentLang);
    const sideStack = createDiv("menu-side-stack");

    shell.appendChild(createHeaderBlock(context, "Commission menu"));

    shell.appendChild(createMenuShowcaseCard(menuContent.offer, "full"));
    sideStack.appendChild(createMenuShowcaseCard(menuContent.details, "icon"));
    sideStack.appendChild(createMenuShowcaseCard(menuContent.notes, "half"));

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
