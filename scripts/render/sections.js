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

function createDefaultSection(sub, currentLang) {
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
    const previewFrame = section.querySelector("[data-gallery-preview-frame]");
    const bubbles = section.querySelectorAll("[data-gallery-artwork-id]");

    previewImage.src = artwork.src;
    previewImage.alt = artwork.alt[currentLang];
    title.textContent = artwork.title[currentLang];
    description.textContent = artwork.description[currentLang];

    bubbles.forEach(bubble => {
        const isActive = bubble.dataset.galleryArtworkId === artwork.id;
        bubble.classList.toggle("is-active", isActive);
        bubble.setAttribute("aria-pressed", String(isActive));
    });

    animatePreview(previewFrame);
}

function createGallerySection(sub, currentLang) {
    const section = document.createElement("section");
    section.className = "section section-gallery";

    if (artworksData.length === 0) {
        const emptyTitle = document.createElement("h2");
        emptyTitle.className = "section-title";
        emptyTitle.textContent = sub.title[currentLang];

        const emptyCopy = document.createElement("p");
        emptyCopy.className = "section-copy";
        emptyCopy.textContent = sub.copy[currentLang];

        section.appendChild(emptyTitle);
        section.appendChild(emptyCopy);

        return section;
    }

    const activeArtwork = getActiveArtwork();
    const shell = document.createElement("div");
    shell.className = "gallery-shell";

    const orbit = document.createElement("div");
    orbit.className = "gallery-orbit";

    const preview = document.createElement("div");
    preview.className = "gallery-preview";

    const previewFrame = document.createElement("div");
    previewFrame.className = "gallery-preview-frame";
    previewFrame.dataset.galleryPreviewFrame = "true";

    const previewImage = document.createElement("img");
    previewImage.className = "gallery-preview-image";
    previewImage.dataset.galleryPreviewImage = "true";

    previewFrame.appendChild(previewImage);
    preview.appendChild(previewFrame);
    orbit.appendChild(preview);

    const bubbleLayouts = createBubbleLayouts(artworksData);

    artworksData.forEach((artwork, index) => {
        const bubble = document.createElement("button");
        const layout = bubbleLayouts[index];

        bubble.type = "button";
        bubble.className = "gallery-bubble";
        bubble.dataset.galleryArtworkId = artwork.id;
        bubble.style.setProperty("--bubble-x", `${layout.x.toFixed(2)}%`);
        bubble.style.setProperty("--bubble-y", `${layout.y.toFixed(2)}%`);
        bubble.style.setProperty("--bubble-scale", layout.scale.toFixed(2));
        bubble.setAttribute("aria-label", artwork.title[currentLang]);

        const thumbnail = document.createElement("img");
        thumbnail.className = "gallery-bubble-image";
        thumbnail.src = artwork.src;
        thumbnail.alt = artwork.alt[currentLang];

        bubble.appendChild(thumbnail);
        bubble.addEventListener("click", () => {
            updateState({ activeArtworkId: artwork.id });
            updateGallerySection(section, artwork, currentLang);
        });

        orbit.appendChild(bubble);
    });

    const meta = document.createElement("div");
    meta.className = "gallery-meta";

    const sectionLabel = document.createElement("p");
    sectionLabel.className = "gallery-section-label";
    sectionLabel.textContent = sub.title[currentLang];

    const artworkTitle = document.createElement("h2");
    artworkTitle.className = "section-title gallery-art-title";
    artworkTitle.dataset.galleryArtTitle = "true";

    const description = document.createElement("p");
    description.className = "section-copy gallery-description";
    description.dataset.galleryDescription = "true";

    meta.appendChild(sectionLabel);
    meta.appendChild(artworkTitle);
    meta.appendChild(description);

    shell.appendChild(orbit);
    shell.appendChild(meta);
    section.appendChild(shell);

    updateGallerySection(section, activeArtwork, currentLang);

    return section;
}

export function renderSections({ root, siteData, currentLang }) {
    root.innerHTML = "";

    siteData.forEach(category => {
        category.subs.forEach(sub => {
            const section = sub.layout === GALLERY_LAYOUT
                ? createGallerySection(sub, currentLang)
                : createDefaultSection(sub, currentLang);

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
