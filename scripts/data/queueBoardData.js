const queueBoardDataUrl = new URL("./queueBoardData.json", import.meta.url);

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

export const queueBoardData = await loadQueueBoardData();
