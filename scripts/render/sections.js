import { artworksData, getArtworkById } from "../data/artworksData.js";
import { state, updateState } from "../state.js";

const GALLERY_LAYOUT = "artwork-gallery";
const GOLDEN_ANGLE = 137.508;
const GALLERY_SCATTER = {
    minRadius: 35,
    radiusStep: 6.2,
    yScale: 0.86,
    previewCenterY: -2,
    previewSafeRadius: 35,
    collisionPadding: 2.8,
    maxPlacementAttempts: 240,
    bounds: {
        left: -100,
        right: 100,
        top: -52,
        bottom: 48
    },
    textSafeZone: {
        yMin: 18,
        halfWidth: 16
    }
};
const BUBBLE_SIZE_PATTERN = [1.18, 0.9, 1.08, 0.84, 1.12, 0.96, 1.22, 0.88];
const FALLBACK_PHASES = ["Now", "Next", "Later"];
const FALLBACK_PILLARS = ["Core Loop", "World", "Feel", "Progression"];
const PAGE_BUILDERS = {
    "0-0": createAboutPosterSection,
    "0-1": createManifestSection,
    "0-2": context => createRosterSection(context, "page-online", "Party List"),
    "0-3": context => createRosterSection(context, "page-mobile", "Pocket Log"),
    "0-4": createCollageSection,
    "0-5": createSpotlightSection,
    "1-0": createGallerySection,
    "1-1": createNoticeBoardSection,
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
    const header = createHeaderBlock(context, "Profile");
    const leadText = context.paragraphs[0] ?? context.copy;
    const noteLines = ensureItems(context.lines.slice(1), [context.label, context.category.name[context.currentLang]]);
    const hero = createDiv("about-hero");
    const profileCard = createDiv("about-profile-card page-card");
    const notes = createDiv("about-notes");

    hero.appendChild(header);
    hero.appendChild(createRichTextElement("p", "about-lead", leadText));

    profileCard.appendChild(createTextElement("p", "page-card-label", "Current snapshot"));
    profileCard.appendChild(createTextElement("p", "about-profile-name", context.label));
    profileCard.appendChild(createTextElement("p", "about-profile-meta", context.category.name[context.currentLang]));

    noteLines.forEach((line, index) => {
        const note = createDiv(`about-note page-card about-note-${(index % 3) + 1}`);
        note.appendChild(createTextElement("p", "page-card-label", `Note ${String(index + 1).padStart(2, "0")}`));
        note.appendChild(createRichTextElement("p", "page-note-copy", line));
        notes.appendChild(note);
    });

    shell.appendChild(hero);
    shell.appendChild(profileCard);
    shell.appendChild(notes);
    section.appendChild(shell);

    return section;
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

function createCollageSection(context) {
    const section = createSectionBase("page-collage");
    const shell = createDiv("page-shell collage-shell");
    const segments = ensureItems(context.segments, context.lines);
    const spotlightItems = ensureItems(segments.slice(0, 2), [context.label, context.category.name[context.currentLang]]);

    shell.appendChild(createHeaderBlock(context, "Favorites atlas"));
    shell.appendChild(createParagraphStack(ensureItems(context.paragraphs, [context.copy]), "collage-copy", "collage-paragraph"));
    shell.appendChild(createChipCloud(ensureItems(segments, [context.copy]), "collage-cloud", "collage-chip page-card"));

    const rail = createDiv("collage-rail");

    spotlightItems.forEach((item, index) => {
        const card = createDiv(`collage-rail-card page-card collage-rail-card-${index + 1}`);
        card.appendChild(createTextElement("p", "page-card-label", index === 0 ? "Top pick" : "Also in orbit"));
        card.appendChild(createRichTextElement("p", "page-note-copy", item));
        rail.appendChild(card);
    });

    shell.appendChild(rail);
    section.appendChild(shell);

    return section;
}

function createSpotlightSection(context) {
    const section = createSectionBase("page-spotlight");
    const shell = createDiv("page-shell spotlight-shell");
    const items = ensureItems(context.lines, [context.copy || context.label]);
    const focusCard = createDiv("spotlight-focus page-card");

    shell.appendChild(createHeaderBlock(context, "Shortlist"));

    focusCard.appendChild(createTextElement("p", "page-card-label", "Spotlight"));
    focusCard.appendChild(createRichTextElement("p", "spotlight-focus-copy", items[0]));
    shell.appendChild(focusCard);

    shell.appendChild(createLineList(ensureItems(items.slice(1), [context.label]), "spotlight-list", "spotlight-item page-card"));
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

function overlapsPreview(x, y, radius) {
    const distanceToPreview = Math.hypot(x, y - GALLERY_SCATTER.previewCenterY);
    return distanceToPreview < GALLERY_SCATTER.previewSafeRadius + radius;
}

function overlapsTextZone(x, y, radius) {
    const { yMin, halfWidth } = GALLERY_SCATTER.textSafeZone;

    return y + radius > yMin && Math.abs(x) < halfWidth + radius;
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

        if (overlapsPreview(x, y, radius)) {
            continue;
        }

        if (overlapsTextZone(x, y, radius)) {
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
    const preview = createDiv("gallery-preview");
    const previewFrame = createDiv("gallery-preview-frame");
    const previewImage = document.createElement("img");
    const meta = createDiv("gallery-meta");
    const summary = createDiv("gallery-summary");
    const counter = createTextElement("p", "gallery-counter", "");
    const bubbleLayouts = createBubbleLayouts(artworksData);

    previewFrame.dataset.galleryPreviewFrame = "true";
    previewImage.className = "gallery-preview-image";
    previewImage.dataset.galleryPreviewImage = "true";
    previewFrame.appendChild(previewImage);
    preview.appendChild(previewFrame);
    orbit.appendChild(preview);

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

    summary.appendChild(createTextElement("p", "page-card-label", "Portfolio"));
    summary.appendChild(counter);
    summary.appendChild(createTextElement("p", "gallery-support-copy", context.copy));
    counter.dataset.galleryCounter = "true";

    meta.appendChild(createHeaderBlock(context, "Selected work"));

    const artworkTitle = createTextElement("h2", "section-title gallery-art-title", "");
    artworkTitle.dataset.galleryArtTitle = "true";

    const description = createTextElement("p", "section-copy gallery-description", "");
    description.dataset.galleryDescription = "true";

    meta.appendChild(artworkTitle);
    meta.appendChild(description);
    meta.appendChild(summary);

    shell.appendChild(orbit);
    shell.appendChild(meta);
    section.appendChild(shell);

    updateGallerySection(section, activeArtwork, context.currentLang);

    return section;
}

function createNoticeBoardSection(context) {
    const section = createSectionBase("page-notice");
    const shell = createDiv("page-shell notice-shell");
    const notes = ensureItems(context.lines, [context.copy || context.label]);

    shell.appendChild(createHeaderBlock(context, "Important"));

    const board = createDiv("notice-board");

    notes.forEach((note, index) => {
        const ticket = createDiv(`notice-ticket page-card notice-ticket-${(index % 4) + 1}`);
        ticket.appendChild(createTextElement("p", "page-card-label", `Memo ${String(index + 1).padStart(2, "0")}`));
        ticket.appendChild(createRichTextElement("p", "page-note-copy", note));
        board.appendChild(ticket);
    });

    shell.appendChild(board);
    section.appendChild(shell);

    return section;
}

function createMenuSection(context) {
    const section = createSectionBase("page-menu");
    const shell = createDiv("page-shell menu-shell");
    const paragraphs = ensureItems(context.paragraphs, [context.copy]);
    const offerCard = createDiv("menu-offer page-card");
    const sideStack = createDiv("menu-side-stack");

    shell.appendChild(createHeaderBlock(context, "Commission menu"));

    offerCard.appendChild(createTextElement("p", "page-card-label", "Main offer"));
    offerCard.appendChild(createRichTextElement("div", "menu-offer-copy", paragraphs[0]));
    shell.appendChild(offerCard);

    ensureItems(context.lines.slice(1), [context.label, context.category.name[context.currentLang]]).forEach((line, index) => {
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
