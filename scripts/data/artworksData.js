export const artworksData = [
    {
        id: "artwork-00",
        src: "./assets/artworks/00.png",
        title: { zh: "作品 00", en: "Artwork 00" },
        alt: { zh: "作品集圖片 00", en: "Portfolio artwork 00" },
        description: {
            zh: "請在這裡填寫 00.png 的作品描述。",
            en: "Add the description for 00.png here."
        }
    },
    {
        id: "artwork-01",
        src: "./assets/artworks/01.png",
        title: { zh: "作品 01", en: "Artwork 01" },
        alt: { zh: "作品集圖片 01", en: "Portfolio artwork 01" },
        description: {
            zh: "請在這裡填寫 01.png 的作品描述。",
            en: "Add the description for 01.png here."
        }
    },
    {
        id: "artwork-02",
        src: "./assets/artworks/02.png",
        title: { zh: "作品 02", en: "Artwork 02" },
        alt: { zh: "作品集圖片 02", en: "Portfolio artwork 02" },
        description: {
            zh: "請在這裡填寫 02.png 的作品描述。",
            en: "Add the description for 02.png here."
        }
    },
    {
        id: "artwork-03",
        src: "./assets/artworks/03.png",
        title: { zh: "作品 03", en: "Artwork 03" },
        alt: { zh: "作品集圖片 03", en: "Portfolio artwork 03" },
        description: {
            zh: "請在這裡填寫 03.png 的作品描述。",
            en: "Add the description for 03.png here."
        }
    },
    {
        id: "artwork-04",
        src: "./assets/artworks/04.png",
        title: { zh: "作品 04", en: "Artwork 04" },
        alt: { zh: "作品集圖片 04", en: "Portfolio artwork 04" },
        description: {
            zh: "請在這裡填寫 04.png 的作品描述。",
            en: "Add the description for 04.png here."
        }
    },
    {
        id: "artwork-05",
        src: "./assets/artworks/05.png",
        title: { zh: "作品 05", en: "Artwork 05" },
        alt: { zh: "作品集圖片 05", en: "Portfolio artwork 05" },
        description: {
            zh: "請在這裡填寫 05.png 的作品描述。",
            en: "Add the description for 05.png here."
        }
    },
    {
        id: "artwork-06",
        src: "./assets/artworks/06.png",
        title: { zh: "作品 06", en: "Artwork 06" },
        alt: { zh: "作品集圖片 06", en: "Portfolio artwork 06" },
        description: {
            zh: "請在這裡填寫 06.png 的作品描述。",
            en: "Add the description for 06.png here."
        }
    },
    {
        id: "artwork-07",
        src: "./assets/artworks/07.png",
        title: { zh: "作品 07", en: "Artwork 07" },
        alt: { zh: "作品集圖片 07", en: "Portfolio artwork 07" },
        description: {
            zh: "請在這裡填寫 07.png 的作品描述。",
            en: "Add the description for 07.png here."
        }
    },
    {
        id: "artwork-08",
        src: "./assets/artworks/08.png",
        title: { zh: "作品 08", en: "Artwork 08" },
        alt: { zh: "作品集圖片 08", en: "Portfolio artwork 08" },
        description: {
            zh: "請在這裡填寫 08.png 的作品描述。",
            en: "Add the description for 08.png here."
        }
    },
    {
        id: "artwork-09",
        src: "./assets/artworks/09.png",
        title: { zh: "作品 09", en: "Artwork 09" },
        alt: { zh: "作品集圖片 09", en: "Portfolio artwork 09" },
        description: {
            zh: "請在這裡填寫 09.png 的作品描述。",
            en: "Add the description for 09.png here."
        }
    },
    {
        id: "artwork-10",
        src: "./assets/artworks/10.png",
        title: { zh: "作品 10", en: "Artwork 10" },
        alt: { zh: "作品集圖片 10", en: "Portfolio artwork 10" },
        description: {
            zh: "請在這裡填寫 10.png 的作品描述。",
            en: "Add the description for 10.png here."
        }
    },
    {
        id: "artwork-11",
        src: "./assets/artworks/11.png",
        title: { zh: "作品 11", en: "Artwork 11" },
        alt: { zh: "作品集圖片 11", en: "Portfolio artwork 11" },
        description: {
            zh: "請在這裡填寫 11.png 的作品描述。",
            en: "Add the description for 11.png here."
        }
    }
];

export function getArtworkById(artworkId) {
    return artworksData.find(artwork => artwork.id === artworkId) ?? null;
}
