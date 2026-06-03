export const artworksData = [
    {
        id: "artwork-00",
        src: "./assets/artworks/Antia 安緹婭.png",
        title: { zh: "Antia 安緹婭", en: "Antia" },
        alt: { zh: "作品集圖片 Antia 安緹婭", en: "Portfolio artwork Antia" },
        description: {
            zh: "請在這裡填寫 Antia 安緹婭 的作品描述。",
            en: "Add the description for Antia here."
        }
    },
    {
        id: "artwork-01",
        src: "./assets/artworks/Bernard 貝爾納.png",
        title: { zh: "Bernard 貝爾納", en: "Bernard" },
        alt: { zh: "作品集圖片 Bernard 貝爾納", en: "Portfolio artwork Bernard" },
        description: {
            zh: "請在這裡填寫 Bernard 貝爾納 的作品描述。",
            en: "Add the description for Bernard here."
        }
    },
    {
        id: "artwork-02",
        src: "./assets/artworks/Cael 凱爾.png",
        title: { zh: "Cael 凱爾", en: "Cael" },
        alt: { zh: "作品集圖片 Cael 凱爾", en: "Portfolio artwork Cael" },
        description: {
            zh: "請在這裡填寫 Cael 凱爾 的作品描述。",
            en: "Add the description for Cael here."
        }
    },
    {
        id: "artwork-03",
        src: "./assets/artworks/Clinika 克莉妮卡.png",
        title: { zh: "Clinika 克莉妮卡", en: "Clinika" },
        alt: { zh: "作品集圖片 Clinika 克莉妮卡", en: "Portfolio artwork Clinika" },
        description: {
            zh: "請在這裡填寫 Clinika 克莉妮卡 的作品描述。",
            en: "Add the description for Clinika here."
        }
    },
    {
        id: "artwork-04",
        src: "./assets/artworks/Dellian 黛莉安.png",
        title: { zh: "Dellian 黛莉安", en: "Dellian" },
        alt: { zh: "作品集圖片 Dellian 黛莉安", en: "Portfolio artwork Dellian" },
        description: {
            zh: "請在這裡填寫 Dellian 黛莉安 的作品描述。",
            en: "Add the description for Dellian here."
        }
    },
    {
        id: "artwork-05",
        src: "./assets/artworks/Enbui 恩布依.png",
        title: { zh: "Enbui 恩布依", en: "Enbui" },
        alt: { zh: "作品集圖片 Enbui 恩布依", en: "Portfolio artwork Enbui" },
        description: {
            zh: "請在這裡填寫 Enbui 恩布依 的作品描述。",
            en: "Add the description for Enbui here."
        }
    },
    {
        id: "artwork-06",
        src: "./assets/artworks/Farnan 費爾南.png",
        title: { zh: "Farnan 費爾南", en: "Farnan" },
        alt: { zh: "作品集圖片 Farnan 費爾南", en: "Portfolio artwork Farnan" },
        description: {
            zh: "請在這裡填寫 Farnan 費爾南 的作品描述。",
            en: "Add the description for Farnan here."
        }
    },
    {
        id: "artwork-07",
        src: "./assets/artworks/Fastr 法斯特.png",
        title: { zh: "Fastr 法斯特", en: "Fastr" },
        alt: { zh: "作品集圖片 Fastr 法斯特", en: "Portfolio artwork Fastr" },
        description: {
            zh: "請在這裡填寫 Fastr 法斯特 的作品描述。",
            en: "Add the description for Fastr here."
        }
    },
    {
        id: "artwork-08",
        src: "./assets/artworks/Flamme 芙拉姆.png",
        title: { zh: "Flamme 芙拉姆", en: "Flamme" },
        alt: { zh: "作品集圖片 Flamme 芙拉姆", en: "Portfolio artwork Flamme" },
        description: {
            zh: "請在這裡填寫 Flamme 芙拉姆 的作品描述。",
            en: "Add the description for Flamme here."
        }
    },
    {
        id: "artwork-09",
        src: "./assets/artworks/Hentu 亨圖.png",
        title: { zh: "Hentu 亨圖", en: "Hentu" },
        alt: { zh: "作品集圖片 Hentu 亨圖", en: "Portfolio artwork Hentu" },
        description: {
            zh: "請在這裡填寫 Hentu 亨圖 的作品描述。",
            en: "Add the description for Hentu here."
        }
    },
    {
        id: "artwork-10",
        src: "./assets/artworks/Jacob 雅各布.png",
        title: { zh: "Jacob 雅各布", en: "Jacob" },
        alt: { zh: "作品集圖片 Jacob 雅各布", en: "Portfolio artwork Jacob" },
        description: {
            zh: "請在這裡填寫 Jacob 雅各布 的作品描述。",
            en: "Add the description for Jacob here."
        }
    },
    {
        id: "artwork-11",
        src: "./assets/artworks/Isyaki 艾薩奇.png",
        title: { zh: "Isyaki 艾薩奇", en: "Isyaki" },
        alt: { zh: "作品集圖片 Isyaki 艾薩奇", en: "Portfolio artwork Isyaki" },
        description: {
            zh: "請在這裡填寫 Isyaki 艾薩奇 的作品描述。",
            en: "Add the description for Isyaki here."
        }
    }
];

export function getArtworkById(artworkId) {
    return artworksData.find(artwork => artwork.id === artworkId) ?? null;
}
