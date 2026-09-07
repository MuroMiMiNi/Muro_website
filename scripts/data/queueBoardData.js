const queueBoardDataUrl = new URL("./queueBoardData.json", import.meta.url);
const queueCompletedManifestUrl = new URL("./queueCompletedManifest.json", import.meta.url);

async function loadQueueBoardData() {
    const response = await fetch(queueBoardDataUrl, { cache: "no-store" });

    if (!response.ok) {
        throw new Error(`Unable to load queue board JSON (${response.status}).`);
    }

    return response.json();
}

export function validateQueueBoardData(data) {
    if (!data || typeof data !== "object") {
        return false;
    }

    return ["zh", "en"].every(lang => {
        const content = data[lang];
        return Boolean(
            content &&
            Array.isArray(content.summary) &&
            content.table &&
            Array.isArray(content.table.headers) &&
            Array.isArray(content.table.rows) &&
            Array.isArray(content.columns) &&
            content.footer &&
            Array.isArray(content.footer.points)
        );
    });
}

async function loadQueueCompletedManifest() {
    try {
        const response = await fetch(queueCompletedManifestUrl, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`Failed to load completed queue manifest: ${response.status}`);
        }

        const manifest = await response.json();
        return Array.isArray(manifest.works) ? manifest.works : [];
    } catch (error) {
        console.warn("Completed queue images could not be loaded.", error);
        return [];
    }
}

function applyCompletedWorks(queueData, completedWorks) {
    for (const [language, board] of Object.entries(queueData)) {
        const completedColumn = board.columns?.find((column) => column.id === "completed");

        if (!completedColumn) {
            continue;
        }

        completedColumn.completedWorks = completedWorks.map((work) => ({
            ...work,
            alt: language === "zh"
                ? `已完成委託 ${work.code}`
                : `Completed commission ${work.code}`,
            focus: "center center"
        }));
    }

    return queueData;
}

const [queueData, completedWorks] = await Promise.all([
    loadQueueBoardData(),
    loadQueueCompletedManifest()
]);

export const queueBoardData = applyCompletedWorks(queueData, completedWorks);
