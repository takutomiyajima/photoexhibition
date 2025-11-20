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
    penname?: string;
    pennameEn?: string;
};


export const PHOTOS: Photo[] = [
    {
        id: "p01",
        src: "/photos/p01.jpg",
        title: "ぺろっ。",
        titleEn: "lap.",
        caption:
            "冒険、それは子猫との出会い。\n野良猫で一番小さい子猫。\nご飯を食べて、舌をぺろっと。",
        captionEn:
            "Adventure, it was meeting a kitten.\nThe smallest kitten among the strays.\nFinished eating, and gave a little lick.",
        penname: "磯部勇伍",
        pennameEn: "Isobe Yugo",
    },
    {
        id: "p02",
        src: "/photos/p02.jpg",
        title: "この先へ",
        titleEn: "Further",
        caption:
            "冒険、それは新しい自分を見つけること。\nそれぞれの冒険の先に待っているのは何か。\nそこで彼らが見つけるのは、どんな自分か。",
        captionEn:
            "Adventure is finding our new selves.\nWhat awaits beyond our paths?\nWho will we become?\nWe need to go further to find it out.",
        penname: "Rio",
        pennameEn: "Rio",
    },
    {
        id: "p03",
        src: "/photos/p03.jpg",
        title: "何度でも",
        titleEn: "Again and again",
        caption:
            "冒険、それは白波立つ鎌倉の海で。\n何度でも向き合う一人の姿。",
        captionEn:
            "Adventure — in the white-capped sea of Kamakura.\nOne person, facing the waves again and again.",
        penname: "",
        pennameEn: "",
    },
    {
        id: "p04",
        src: "/photos/p04.jpg",
        title: "足元の発見",
        titleEn: "The World Beneath",
        caption:
            "冒険、それはいつも足元から始まる。\n猫が駆け抜けた道の先には、\n人知れず続く秘密のトンネルがあった。",
        captionEn:
            "Adventure always begins just beneath our feet.\nBeyond the path where a cat had vanished,\na hidden tunnel stretched quietly into its own secret world.",
        penname: "",
        pennameEn: "",
    },
    {
        id: "p05",
        src: "/photos/p05.jpg",
        title: "向日葵",
        titleEn: "SUNFLOWER",
        caption: "夏のはじまり、それは、冒険のはじまり",
        captionEn: "Summer begins. Adventure begins.",
        penname: "yuki",
        pennameEn: "yuki",
    },
    {
        id: "p06",
        src: "/photos/p06.jpg",
        title: "冒険の証",
        titleEn: "Proof of Adventure",
        caption:
            "冒険、それは時とともに錆びつくもの。\n静かな夜、光に浮かぶ鉄の輪が、\n失われた旅の記憶をそっと映していた。",
        captionEn:
            "Adventure — it rusts with time.\nIn the quiet night, the iron wheel gleams faintly,\nreflecting the memory of journeys long past.",
        penname: "xlykrse__",
        pennameEn: "xlykrse__",
    },
    {
        id: "p07",
        src: "/photos/p07.jpg",
        title: "夏の果てに",
        titleEn: "As Summer Fade Away",
        caption:
            "冒険、咲き続けた定点カメラが見ていたもの\n夏を超えて、どんな景色を見続けていたのか\nひと夏の記憶を、彼女だけが覚えている",
        captionEn:
            "AdventureーWhat the Blooming Camera Saw\nBeyond the summer,\nwhat scenes did she keep watching?\nOnly she remembers the memories of that fleeting season.",
        penname: "",
        pennameEn: "",
    },
    {
        id: "p08",
        src: "/photos/p08.jpg",
        title: "石と緑のその先に",
        titleEn: "Beyond Stone and Green",
        caption:
            "冒険、それは一歩を踏み出す勇気。\n石と緑とその先に、\nどんな宝物が眠っているだろうか。",
        captionEn:
            "Adventure begins with the courage to step.\nBeyond stone and green,\nwhat treasures might be waiting there?",
        penname: "yuka",
        pennameEn: "yuka",
    },
    {
        id: "p09",
        src: "/photos/p09.jpg",
        title: "ランタン祭りの行方",
        titleEn: "The future of the Lantern",
        caption:
            "冒険、飛ばされたあの子の旅の話\n見上げると、美しいランタン祭り\nふと目線を下げれば、彼らの行方が分かる",
        captionEn:
            "Adventure, the Journey of the child who was swept away.\nWhen you look up, a beautiful lantern festival fills the sky.\nBut if you lower your gaze, you can see where they have gone.",
        penname: "greatmeat",
        pennameEn: "greatmeat",
    },
    {
        id: "p10",
        src: "/photos/p10.jpg",
        title: "「あの頃」の「その先」",
        titleEn: "Beyond “Back Then”",
        caption:
            "冒険、拠り所は子ども時代。\n渡るたび、向こうはいつも新しい色だった。\n今の私には、どんな色が見えるだろう。",
        captionEn:
            "Adventure finds its footing in childhood.\nWith every crossing, the other shore was newly colored.\nWhat color will I see now?",
        penname: "",
        pennameEn: "",
    },
    {
        id: "p11",
        src: "/photos/p11.jpg",
        title: "境界にて",
        titleEn: "At the Boundary",
        caption:
            "冒険、迷いもまた、旅のかたち。\n水面が自らを映す。\n静けさの中で、一歩を踏み出す。",
        captionEn:
            "Adventure, and the drift of doubt, are the way.\nThe water reflects what it is.\nIn the quiet, a first step begins.",
        penname: "kako",
        pennameEn: "kako",
    },
    {
        id: "p12",
        src: "/photos/p12.jpg",
        title: "まだ見ぬ世界へ",
        titleEn: "To the world yet to come",
        caption: "",
        captionEn: "",
        penname: "",
        pennameEn: "",
    },
    {
        id: "p13",
        src: "/photos/p13.jpg",
        title: "天狗のはしご",
        titleEn: "Path of the Tengu",
        caption:
            "冒険、知らない山に強く風が吹く。\nもしその先に誰かがいるのなら。\n天狗に会ってみたいと思った。",
        captionEn:
            "Adventure, a strong wind blows through an unknown mountain.\nIf someone is there,\nI’ll catch a glimpse of the Tengu.",
        penname: "",
        pennameEn: "",
    },
    {
        id: "p14",
        src: "/photos/p14.jpg",
        title: "市場1",
        titleEn: "MARKET 1",
        caption:
            "冒険、それは市場だ。\nあらゆる人が交差し狭い所に物が密にある。\nそんな複雑な時空間を切り取ってみた。",
        captionEn:
            "Adventure is a marketplace.\nWhere all people cross paths, where things crowd together in narrow spaces.\nI tried to capture that complex spacetime.",
        penname: "おがりょう",
        pennameEn: "Ogaryo",
    },
    {
        id: "p15",
        src: "/photos/p15.jpg",
        title: "消えゆく道の上で",
        titleEn: "On a Vanishing Path",
        caption:
            "普光洞、消えゆく再開発地区。\n記憶となる路地を巡る探検は、\n都市の最後の息吹を記録する。",
        captionEn:
            "Bogwang-dong Redevelopment Area.\nOnce a foundation of life, now a place fading into memory.\nExploring these narrow alleys documents a city's last breath.",
        penname: "Hyunsoo Park",
        pennameEn: "Hyunsoo Park",
    },
    {
        id: "p16",
        src: "/photos/p16.jpg",
        title: "旅立ちの大地",
        titleEn: "Origin of the Journey",
        caption:
            "冒険、それは今始まった。\n一歩を踏み出す空の下、\nこの大地が、私の世界となる。",
        captionEn:
            "The adventure began then.\nBeneath the sky where I took my first step,\nthis land became my world.",
        penname: "いつくしま",
        pennameEn: "Itsukushima",
    },
    {
        id: "p17",
        src: "/photos/p17.jpg",
        title: "メタ",
        titleEn: "metacognition",
        caption: "冒険、それは自分を見つめ直すこと",
        captionEn: "Adventure is metacognition disguised as a journey.",
        penname: "",
        pennameEn: "",
    },
    {
        id: "p18",
        src: "/photos/p18.jpg",
        title: "A day.",
        titleEn: "A day.",
        caption:
            "冒険、それは日常の中。\n自転車で、近所を散策する。\n街の知らない顔を見る、冒険。",
        captionEn:
            "Adventure, it exists in the ordinary.\nLooking around the neighbouring, by bicycle.\nAn experience of seeing a new face of our city.",
        penname: "lechat",
        pennameEn: "lechat",
    },
    {
        id: "p19",
        src: "/photos/p19.jpg",
        title: "道は続く。",
        titleEn: "The road runs.",
        caption:
            "冒険、それは見通しの悪い道の連続。\n道は曲がりくねり、休まる暇もない。\nでも、この道の先に海があるから、私は走る。",
        captionEn:
            "In Adventure,\nWe have blinders on our eyes.\nThe road leaves no time to rest.\nBut because the sea would spread out,\nI keep running.",
        penname: "アマ",
        pennameEn: "Ama",
    },
    {
        id: "p20",
        src: "/photos/p20.jpg",
        title: "未知を眺める",
        titleEn: "Gaze at Uncharted",
        caption: "冒険、知との出会い。大きな環から、未知を探して。",
        captionEn:
            "Adventure, an encounter with knowledge. From the great circle, EXPO2025, seeking the unknown.",
        penname: "h.s",
        pennameEn: "h.s",
    },
];
