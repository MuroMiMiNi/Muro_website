export function getFlatIndex(siteData, catIdx, subIdx) {
    let index = 0;

    for (let i = 0; i < catIdx; i += 1) {
        index += siteData[i].subs.length;
    }

    return index + subIdx;
}

export function getFirstPageSubIndex(siteData, catIdx) {
    return siteData[catIdx].subs.findIndex(sub => sub.type === "p");
}

export function findPageSubIndex(siteData, catIdx, startSubIdx, direction) {
    const subs = siteData[catIdx].subs;
    let target = startSubIdx + direction;

    while (target >= 0 && target < subs.length) {
        if (subs[target].type === "p") {
            return target;
        }

        target += direction;
    }

    return -1;
}

export function getSafePageSubIndex(siteData, catIdx, preferredSubIdx) {
    const preferred = siteData[catIdx].subs[preferredSubIdx];
    if (preferred && preferred.type === "p") {
        return preferredSubIdx;
    }

    const firstPage = getFirstPageSubIndex(siteData, catIdx);
    return firstPage === -1 ? 0 : firstPage;
}
