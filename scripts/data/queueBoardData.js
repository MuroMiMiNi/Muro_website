export const queueBoardData = {
    zh: {
        pageTitle: "排單進度",
        eyebrow: "Commission Queue",
        description: "把排單資訊拆成摘要、說明和狀態欄位，讓委託人先看懂目前是否開放，再看自己大概排在哪裡。",
        announcementTitle: "目前說明",
        announcementBody: "週日不進行繪製作業，因此工期與等待時間皆不含週日。預估時間會依照複雜度、溝通速度與修改次數微調。",
        summary: [
            {
                label: "委託狀態",
                value: "開放中",
                note: "目前可收 2 個名額",
                tone: "open"
            },
            {
                label: "目前排到",
                value: "A-04",
                note: "A-01 至 A-03 已完成",
                tone: "focus"
            },
            {
                label: "預估等待",
                value: "約 7-18 天",
                note: "依項目與修改次數調整",
                tone: "warm"
            },
            {
                label: "最後更新",
                value: "2026.06.12",
                note: "今天下午 4:30 更新",
                tone: "neutral"
            }
        ],
        columns: [
            {
                id: "pending",
                label: "待確認",
                hint: "已收到詢問，等待資料或報價確認",
                scrollable: true,
                items: [
                    {
                        code: "A-07",
                        type: "半身指定",
                        owner: "委託人 C",
                        due: "等待設定補件",
                        note: "資料齊全後再正式入列",
                        badge: "資料中"
                    },
                    {
                        code: "A-08",
                        type: "全身委託",
                        owner: "委託人 D",
                        due: "等待報價確認",
                        note: "大配件較多，已先告知工期",
                        badge: "估價中"
                    }
                ]
            },
            {
                id: "queued",
                label: "排隊中",
                hint: "已確認委託，等待進入正式繪製",
                scrollable: true,
                items: [
                    {
                        code: "A-05",
                        type: "頭像驚喜包",
                        owner: "委託人 A",
                        due: "預計 6/16 開工",
                        note: "已付款，等待前單收尾",
                        badge: "已付款"
                    },
                    {
                        code: "A-06",
                        type: "半身驚喜包",
                        owner: "委託人 B",
                        due: "預計 6/20 開工",
                        note: "已確認風格方向",
                        badge: "已排入"
                    }
                ]
            },
            {
                id: "drawing",
                label: "繪製中",
                hint: "目前正在處理的委託",
                items: [
                    {
                        code: "A-04",
                        type: "全身委託",
                        owner: "委託人 S",
                        due: "預計 6/18 完成",
                        note: "目前進度：上色與細節收尾",
                        badge: "進行中"
                    }
                ]
            },
            {
                id: "completed",
                label: "已完成",
                hint: "近期完成或已交件的委託紀錄",
                completedWorks: [
                    {
                        code: "A-03",
                        completedAt: "2026-06-11",
                        src: "./assets/commission/half-body/half-body-example.png",
                        alt: "A-03 已完成委託圖",
                        focus: "center 24%"
                    },
                    {
                        code: "A-02",
                        completedAt: "2026-06-10",
                        src: "./assets/artworks/Antia 安緹婭.png",
                        alt: "A-02 已完成委託圖",
                        focus: "center 22%"
                    },
                    {
                        code: "A-01",
                        completedAt: "2026-06-08",
                        src: "./assets/artworks/Cael 凱爾.png",
                        alt: "A-01 已完成委託圖",
                        focus: "center 26%"
                    },
                    {
                        code: "Z-12",
                        completedAt: "2026-06-05",
                        src: "./assets/artworks/Clinika 克莉妮卡.png",
                        alt: "Z-12 已完成委託圖",
                        focus: "center 20%"
                    },
                    {
                        code: "Z-11",
                        completedAt: "2026-06-03",
                        src: "./assets/artworks/Dellian 黛莉安.png",
                        alt: "Z-11 已完成委託圖",
                        focus: "center 18%"
                    },
                    {
                        code: "Z-10",
                        completedAt: "2026-05-28",
                        src: "./assets/artworks/Enbui 恩布依.png",
                        alt: "Z-10 已完成委託圖",
                        focus: "center 24%"
                    }
                ]
            }
        ],
        footer: {
            title: "這版排單刻意保留的方向",
            points: [
                "排單用代號而不直接顯示真名，方便公開展示。",
                "摘要資訊固定放最上方，委託人不用先看完整列表。",
                "每個欄位都有自己的 class 與樣式，後續可單獨調整而不碰其他子頁。"
            ]
        }
    },
    en: {
        pageTitle: "Queue Status",
        eyebrow: "Commission Queue",
        description: "This board breaks the queue into a summary, a notice block, and status columns so visitors can understand availability before reading the full list.",
        announcementTitle: "Current Notice",
        announcementBody: "No drawing work is done on Sundays, so turnaround and waiting estimates both exclude Sundays. Timing may still shift based on complexity, communication speed, and revision rounds.",
        summary: [
            {
                label: "Commission status",
                value: "Open",
                note: "2 slots currently available",
                tone: "open"
            },
            {
                label: "Currently handling",
                value: "A-04",
                note: "A-01 to A-03 are complete",
                tone: "focus"
            },
            {
                label: "Estimated wait",
                value: "About 7-18 days",
                note: "Depends on scope and revisions",
                tone: "warm"
            },
            {
                label: "Last updated",
                value: "2026.06.12",
                note: "Updated today at 4:30 PM",
                tone: "neutral"
            }
        ],
        columns: [
            {
                id: "pending",
                label: "Pending",
                hint: "Inquiry received, waiting for references or quote approval",
                scrollable: true,
                items: [
                    {
                        code: "A-07",
                        type: "Specified half body",
                        owner: "Client C",
                        due: "Waiting for extra references",
                        note: "Will join the queue once materials are complete",
                        badge: "Materials"
                    },
                    {
                        code: "A-08",
                        type: "Full body",
                        owner: "Client D",
                        due: "Waiting for quote approval",
                        note: "Longer timeline already explained",
                        badge: "Quoting"
                    }
                ]
            },
            {
                id: "queued",
                label: "Queued",
                hint: "Confirmed commissions waiting to enter production",
                scrollable: true,
                items: [
                    {
                        code: "A-05",
                        type: "Surprise icon pack",
                        owner: "Client A",
                        due: "Planned start: 6/16",
                        note: "Paid and waiting for the current order to wrap up",
                        badge: "Paid"
                    },
                    {
                        code: "A-06",
                        type: "Surprise half body",
                        owner: "Client B",
                        due: "Planned start: 6/20",
                        note: "Direction and tone already confirmed",
                        badge: "Queued"
                    }
                ]
            },
            {
                id: "drawing",
                label: "Drawing",
                hint: "Commission currently in production",
                items: [
                    {
                        code: "A-04",
                        type: "Full body",
                        owner: "Client S",
                        due: "Estimated finish: 6/18",
                        note: "Current stage: coloring and polish",
                        badge: "In progress"
                    }
                ]
            },
            {
                id: "completed",
                label: "Completed",
                hint: "Recently finished or already delivered commissions",
                completedWorks: [
                    {
                        code: "A-03",
                        completedAt: "2026-06-11",
                        src: "./assets/commission/half-body/half-body-example.png",
                        alt: "A-03 completed commission preview",
                        focus: "center 24%"
                    },
                    {
                        code: "A-02",
                        completedAt: "2026-06-10",
                        src: "./assets/artworks/Antia 安緹婭.png",
                        alt: "A-02 completed commission preview",
                        focus: "center 22%"
                    },
                    {
                        code: "A-01",
                        completedAt: "2026-06-08",
                        src: "./assets/artworks/Cael 凱爾.png",
                        alt: "A-01 completed commission preview",
                        focus: "center 26%"
                    },
                    {
                        code: "Z-12",
                        completedAt: "2026-06-05",
                        src: "./assets/artworks/Clinika 克莉妮卡.png",
                        alt: "Z-12 completed commission preview",
                        focus: "center 20%"
                    },
                    {
                        code: "Z-11",
                        completedAt: "2026-06-03",
                        src: "./assets/artworks/Dellian 黛莉安.png",
                        alt: "Z-11 completed commission preview",
                        focus: "center 18%"
                    },
                    {
                        code: "Z-10",
                        completedAt: "2026-05-28",
                        src: "./assets/artworks/Enbui 恩布依.png",
                        alt: "Z-10 completed commission preview",
                        focus: "center 24%"
                    }
                ]
            }
        ],
        footer: {
            title: "What this board is intentionally testing",
            points: [
                "Queue codes are public-facing, so real client names stay private.",
                "Key status information stays at the top instead of being buried in the list.",
                "Every queue style is scoped to this page only, so later edits will not affect other subpages."
            ]
        }
    }
};
