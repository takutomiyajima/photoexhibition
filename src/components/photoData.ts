export type Photo = {
    id: string;
    src: string; // 3:2 横長推奨 (public/photos/*.jpg)
    title: string;           // 日本語タイトル（白背景でドーンと出すやつ）
    titleEn?: string;        // 英字タイトル（Pen Name 的に黒帯に出す）
    caption?: string;
    captionEn?: string;      // 英語キャプション（必要なら）
    location?: string;
    locationEn?: string;     // 英語ロケーション（必要なら）
    date?: string;
};


export const PHOTOS: Photo[] = [
    {
        id: "a01",
        src: "/photos/a01.jpg",
        title: "黎明の気配",
        titleEn: "Whisper of Dawn",
        caption: "冷たい風、最初の一歩。視界が少しずつ拓ける。",
        captionEn: "A cold wind, the very first step. The view slowly opens up.",
        location: "Shinagawa, Tokyo",
        locationEn: "Shinagawa, Tokyo",
        date: "2024-11-02",
    },
    {
        id: "a02",
        src: "/photos/a02.jpg",
        title: "都市の呼吸",
        titleEn: "Breath of the City",
        caption: "雑踏の狭間で、ふと静けさに触れる。",
        location: "Otemachi, Tokyo",
        date: "2024-10-18",
    },
    {
        id: "a03",
        src: "/photos/a03.jpg",
        title: "雨粒の地図",
        titleEn: "Map of Raindrops",
        caption: "濡れた舗道に映る、行き先のない矢印。",
        location: "Kanda, Tokyo",
        date: "2024-09-07",
    },
];
