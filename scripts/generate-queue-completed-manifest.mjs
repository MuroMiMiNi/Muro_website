import { readdir, stat, writeFile } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const completedAssetsDirectory = path.resolve(scriptDirectory, "../assets/queue-completed");
export const completedManifestPath = path.resolve(scriptDirectory, "data/queueCompletedManifest.json");

const imageExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);

function createCode(fileName) {
    const baseName = path.parse(fileName).name;
    return baseName.replace(/[-_ ]?completedworks?$/i, "") || baseName;
}

export async function generateQueueCompletedManifest() {
    const entries = await readdir(completedAssetsDirectory, { withFileTypes: true });
    const imageFiles = entries.filter((entry) => (
        entry.isFile() && imageExtensions.has(path.extname(entry.name).toLowerCase())
    ));

    const works = await Promise.all(imageFiles.map(async (entry) => {
        const filePath = path.join(completedAssetsDirectory, entry.name);
        const fileStats = await stat(filePath);
        const createdAt = fileStats.birthtimeMs || fileStats.ctimeMs;

        return {
            code: createCode(entry.name),
            fileName: entry.name,
            completedAt: new Date(createdAt).toISOString(),
            createdAt
        };
    }));

    works.sort((left, right) => right.createdAt - left.createdAt);

    const manifest = {
        generatedAt: new Date().toISOString(),
        works: works.map(({ createdAt, ...work }) => work)
    };

    await writeFile(completedManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(`Updated queue manifest with ${manifest.works.length} image(s).`);
}

async function watchQueueCompletedDirectory() {
    await generateQueueCompletedManifest();
    console.log(`Watching ${completedAssetsDirectory}`);

    let queuedUpdate;
    watch(completedAssetsDirectory, () => {
        clearTimeout(queuedUpdate);
        queuedUpdate = setTimeout(() => {
            generateQueueCompletedManifest().catch((error) => console.error(error));
        }, 250);
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    if (process.argv.includes("--watch")) {
        watchQueueCompletedDirectory().catch((error) => {
            console.error(error);
            process.exitCode = 1;
        });
    } else {
        generateQueueCompletedManifest().catch((error) => {
            console.error(error);
            process.exitCode = 1;
        });
    }
}
