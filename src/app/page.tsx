"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PHOTOS } from "@/components/photoData";
import { useRouter } from "next/navigation";

type ExtPhoto = (typeof PHOTOS)[number];

const pad2 = (n: number) => n.toString().padStart(2, "0");

/** スライドする 2 桁カウンタ（見切れ防止＋スタイリッシュな数字） */
const SlideNumber = ({ value }: { value: number }) => {
  const v = pad2(value);
  return (
    <div className="relative h-[2.2rem] md:h-[2.6rem] overflow-hidden leading-none flex items-center">
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={v}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="block font-noto text-[2.2rem] md:text-[2.6rem] font-semibold tracking-[0.02em]"
        >
          {v}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

/** 01/21 + 両矢印（右寄せ・写真集っぽい UI） */
type PageIndicatorProps = {
  current: number;
  total: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const PageIndicator: React.FC<PageIndicatorProps> = ({
  current,
  total,
  canPrev,
  canNext,
  onPrev,
  onNext,
}) => {
  return (
    <div className="flex flex-col items-end gap-1 font-['Roboto_Condensed']">
      {/* 数字ボックス */}
      <div className="border border-white/50 px-1 py-0 bg-black/85 shadow-[0_0_0_1px_rgba(0,0,0,0.7)]">
        <div className="flex items-baseline gap-0">
          <SlideNumber value={current} />
          <span className="font-noto text-3xl md:text-1xl font-semibold tracking-[0.02em]">
            /{pad2(total)}
          </span>
        </div>
      </div>

      {/* ドッキング矢印 */}
      <div className="flex items-center justify-center mt-1">
        {/* ←（Prev） */}
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="group flex items-center disabled:opacity-30 mr-3"
        >
          <div className="flex items-center -mr-[6px]">
            {/* 左向き三角（◀） */}
            <div className="w-0 h-0 border-y-[5px] border-y-transparent border-r-[11px] border-r-white" />
            <div className="h-[2px] w-10 md:w-16 bg-white group-hover:h-[3px] transition-all" />
          </div>
        </button>
        {/* →（Next） */}
        <button
          onClick={onNext}
          disabled={!canNext}
          className="group flex items-center disabled:opacity-30 -ml-[6px]"
        >
          <div className="flex items-center">
            {/* 右向き三角（▶） */}
            <div className="h-[2px] w-10 md:w-16 bg-white group-hover:h-[3px] transition-all" />
            <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[11px] border-l-white" />
          </div>
        </button>
      </div>
    </div>
  );
};

/** 詳細画面用 BottomBar（Back / Home / Next） */
type DetailBottomBarProps = {
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onHome: () => void;
};

const DetailBottomBar: React.FC<DetailBottomBarProps> = ({
  canPrev,
  canNext,
  onPrev,
  onNext,
  onHome,
}) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] bg-black/95 border-t border-white/30">
      {/* ===== 3つのボタンを1/4ずつ等間隔に配置 ===== */}
      <div
        className="
          max-w-lg mx-auto 
          grid grid-cols-4 
          text-white text-xs md:text-sm 
          px-4 py-2 md:px-8 md:py-3
        "
      >
        {/* Back（左から1/4位置） */}
        <div className="col-span-1 flex justify-center items-center">
          <button
            onClick={onPrev}
            disabled={!canPrev}
            className="disabled:opacity-30 hover:text-white"
          >
            Back
          </button>
        </div>

        {/* Home（中央1/4位置） */}
        <div className="col-span-2 flex justify-center items-center">
          <button
            onClick={onHome}
            className="
              px-4 py-1 md:px-6 md:py-1.5 
              bg-white text-black 
              text-xs md:text-sm font-semibold rounded-sm 
              hover:bg-gray-100 transition
            "
          >
            Home
          </button>
        </div>

        {/* Next（右から1/4位置） */}
        <div className="col-span-1 flex justify-center items-center">
          <button
            onClick={onNext}
            disabled={!canNext}
            className="disabled:opacity-30 hover:text-white"
          >
            Next
          </button>
        </div>
      </div>

      {/* ===== 下段：ロング矢印 ===== */}
      <div className="flex items-center justify-center py-0">
        <div className="flex items-center w-[92vw]">
          {/* 左側：◀━━━━ */}
          <div className="flex items-center flex-1">
            <div className="w-0 h-0 border-y-[7px] border-y-transparent border-r-[14px] border-r-white" />
            <div className="h-[2px] w-full bg-white" />
          </div>

          {/* 右側：━━━━▶ */}
          <div className="flex items-center flex-1">
            <div className="h-[2px] w-full bg-white" />
            <div className="w-0 h-0 border-y-[7px] border-y-transparent border-l-[14px] border-l-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

const DETAIL_SWIPE_CONFIDENCE = 100;

export default function Page() {
  const photos = PHOTOS as ExtPhoto[];
  const router = useRouter();

  // ヒーロー写真：PHOTOSの先頭を使用（最初に表示される写真と揃える）
  const heroPhoto = photos[0];

  const [lang, setLang] = useState<"ja" | "en">("ja");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [detailIdx, setDetailIdx] = useState<number | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const detailScrollRef = useRef<HTMLDivElement | null>(null);

  // detailIdx が null のとき用の安全な index
  const activeDetailIdx = detailIdx ?? 0;

  // イントロ自動終了
  useEffect(() => {
    const timer = setTimeout(() => setIntroDone(true), 3200);
    return () => clearTimeout(timer);
  }, []);
  // detailIdx が変わったら currentIdx を合わせる
  useEffect(() => {
    if (detailIdx !== null) {
      setCurrentIdx(detailIdx);
    }
  }, [detailIdx]);
  // 詳細ビューが閉じられたとき、一覧を正しい位置にスクロール
  useEffect(() => {
    if (detailIdx === null && containerRef.current) {
      containerRef.current.scrollTo({
        left: currentIdx * window.innerWidth,
        behavior: "instant", // iOS Safari では instant が安定
      });
    }
  }, [detailIdx]);


  // 横スクロール中に「今どの写真か」を判定
  useEffect(() => {
    if (detailIdx !== null) return;
    const root = containerRef.current;
    if (!root) return;

    const slides = Array.from(
      root.querySelectorAll<HTMLElement>("[data-index]")
    );

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const i = Number(
            (visible.target as HTMLElement).dataset.index || "0"
          );
          setCurrentIdx(i);
        }
      },
      { root, threshold: [0.4, 0.6, 0.8] }
    );

    slides.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [detailIdx]);

  const scrollToIndex = (idx: number) => {
    const root = containerRef.current;
    if (!root) return;
    const clamped = Math.max(0, Math.min(photos.length - 1, idx));
    root.scrollTo({
      left: clamped * window.innerWidth,
      behavior: "smooth",
    });
  };

  const currentPhoto = photos[currentIdx];
  const detail = detailIdx !== null ? photos[detailIdx] : null;

  // 一覧 → 詳細（タッチ）
  const [listTouchStartY, setListTouchStartY] = useState<number | null>(null);

  const handleListTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (detailIdx !== null) return;
    const t = e.touches[0];
    setListTouchStartY(t.clientY);
  };

  const handleListTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    if (detailIdx !== null || listTouchStartY === null) return;
    const t = e.changedTouches[0];
    const dy = t.clientY - listTouchStartY;
    setListTouchStartY(null);
    if (dy < -60) {
      setDetailIdx(currentIdx);
    }
  };

  // 詳細 → 一覧（タッチ：下方向で戻る）
  const [detailTouchStart, setDetailTouchStart] = useState<{
    x: number;
    y: number;
    scrollTop: number;
  } | null>(null);

  const handleDetailTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (detailIdx === null) return;
    const t = e.touches[0];
    const container = detailScrollRef.current;

    setDetailTouchStart({
      x: t.clientX,
      y: t.clientY,
      scrollTop: container?.scrollTop ?? 0,
    });
  };

  const handleDetailTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (detailIdx === null || !detailTouchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - detailTouchStart.x;
    const dy = t.clientY - detailTouchStart.y;
    setDetailTouchStart(null);

    // 縦方向に十分下へスワイプしたときのみ一覧に戻る
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) && dy > 0) {
      setDetailIdx(null);
    }
  };

  // 一覧 → 詳細（ホイール）
  const [listScrollAccum, setListScrollAccum] = useState(0);
  const LIST_SCROLL_THRESHOLD = 160;

  const handleMainWheel = (e: React.WheelEvent<HTMLElement>) => {
    if (detailIdx !== null) return;

    if (e.deltaY > 0) {
      setListScrollAccum((prev) => {
        const next = prev + e.deltaY;
        if (next > LIST_SCROLL_THRESHOLD) {
          setDetailIdx(currentIdx);
          return 0;
        }
        return next;
      });
    } else if (e.deltaY < 0) {
      setListScrollAccum(0);
    }
  };

  // 詳細 → 一覧（ホイール：上方向で戻る仕様のまま）
  const [detailScrollAccum, setDetailScrollAccum] = useState(0);
  const DETAIL_SCROLL_THRESHOLD = 160;

  const handleDetailWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (detailIdx === null) return;
    const container = detailScrollRef.current;
    if (!container) return;

    const { scrollTop } = container;

    if (e.deltaY < 0 && scrollTop <= 0) {
      setDetailScrollAccum((prev) => {
        const next = prev + e.deltaY;
        if (Math.abs(next) > DETAIL_SCROLL_THRESHOLD) {
          setDetailIdx(null);
          return 0;
        }
        return next;
      });
    } else if (e.deltaY > 0) {
      setDetailScrollAccum(0);
    }
  };

  const text = {
    introLine:
      lang === "ja"
        ? "冒険、その瞬間は一枚の写真から始まる。"
        : "Every adventure begins with a single frame.",
    tapToOpen: lang === "ja" ? "タップして開く" : "Tap to open",
    penLabel: lang === "ja" ? "Pen Name" : "Pen Name",
    scrollGuide:
      lang === "ja"
        ? "下にスクロール／スワイプで詳細へ"
        : "Scroll down for details",
    menuAbout: lang === "ja" ? "About us" : "About us",
    menuAdGen: lang === "ja" ? "広告ジェネレータ" : "Ad Generator",
    menuClose: lang === "ja" ? "閉じる" : "Close",
    swipeUpBack:
      lang === "ja"
        ? "上にスクロール／スワイプで一覧へ"
        : "Scroll up to go back",
  };

  const titleJa = currentPhoto.title;
  const titleEn = currentPhoto.titleEn;
  const penNameDisplay = currentPhoto.penname;
  const penNameDisplayEn = currentPhoto.pennameEn;

  return (
    <main
      className="relative h-screen bg-black text-white overflow-hidden"
      onTouchStart={handleListTouchStart}
      onTouchEnd={handleListTouchEnd}
      onWheel={handleMainWheel}
    >
      {/* イントロ：冒険の文字マスクに heroPhoto をはめる */}
      <AnimatePresence>
        {!introDone && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
            role="button"
            tabIndex={0}
            onClick={() => setIntroDone(true)}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* メインの文字アニメ */}
            <motion.div
              className="relative flex flex-col items-center"
              initial={{ scale: 0.75, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* 冒険の文字マスク（背景色無し） */}
              <motion.div
                className="relative flex items-center justify-center select-none pointer-events-none"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: [0.9, 1.05, 1], opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="text-photo-mask font-extrabold font-noto leading-[0.9] text-center"
                  style={{
                    fontSize: "48vw",
                    backgroundImage: `url(${heroPhoto.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  冒<br />
                  険
                </div>
              </motion.div>

              {/* キャッチコピー */}
              <motion.p
                className="mt-10 text-sm md:text-base text-white/90 tracking-wide text-center px-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.8 }}
              >
                {text.introLine}
              </motion.p>

              {/* タップして開くガイド */}
              <motion.span
                className="mt-6 text-xs md:text-sm text-white/70 inline-flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.2, 1, 0.4, 1] }}
                transition={{
                  duration: 1.2,
                  delay: 1.2,
                  repeat: Infinity,
                  repeatType: "mirror",
                }}
              >
                {text.tapToOpen}
                <span className="inline-block h-[1px] w-10 bg-white/60" />
              </motion.span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ヘッダー */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-start justify-between pl-1 pr-4 pt-5 pb-4 md:pl-4 md:pr-8 md:pt-7 bg-gradient-to-b from-black via-black/70 to-transparent">
        <img
          src="/logo/kettei_3.png"
          alt="冒険 Through the Lens of Adventure"
          className="h-20 w-auto md:h-24"
        />
        <div className="flex items-center gap-2 md:gap-3">
          <button
            className="text-sm md:text-base px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 transition"
            onClick={() => setLang((l) => (l === "ja" ? "en" : "ja"))}
          >
            {lang === "ja" ? "EN" : "JP"}
          </button>
          <button
            className="h-10 w-10 md:h-11 md:w-11 flex flex-col items-center justify-center gap-[5px] rounded bg-white/10 hover:bg:white/20 transition"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <span className="h-[2px] w-6 bg-white" />
            <span className="h-[2px] w-6 bg-white" />
            <span className="h-[2px] w-6 bg-white" />
          </button>
        </div>
      </header>

      {/* 右側 SCROLL インジケータ（一覧ビューの全ページで表示＋アニメーション） */}
      <AnimatePresence>
        {detailIdx === null && (
          <motion.div
            className="fixed inset-y-0 right-5 z-20 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-row items-center gap-3">
              {/* 縦書き SCROLL テキスト（ふわっと上下＋点滅） */}
              <motion.span
                className="text-xs md:text-sm tracking-[0.3em] text-white/80 [writing-mode:vertical-rl]"
                initial={{ opacity: 0.4, y: 0 }}
                animate={{
                  opacity: [0.4, 1, 0.4],
                  y: [0, -6, 0],
                }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                }}
              >
                SCROLL
              </motion.span>

              {/* 右側：縦ライン＋矢印を縦並び */}
              <div className="flex flex-col items-center gap-2">
                {/* 縦ライン（伸び縮み） */}
                <motion.span
                  className="block h-12 w-px bg-white/70 origin-top"
                  initial={{ scaleY: 0.6, opacity: 0.7 }}
                  animate={{
                    scaleY: [0.6, 1, 0.6],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                  }}
                />

                {/* 下向き矢印（三角形）上下にゆっくり動かす */}
                <motion.span
                  className="inline-block border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px] border-t-white"
                  initial={{ y: 0, opacity: 0.9 }}
                  animate={{
                    y: [0, 6, 0],
                    opacity: [0.9, 1, 0.9],
                  }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ハンバーガーメニュー */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[55] bg-black/90 backdrop-blur-sm flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <img
                src="/logo/kettei_3.png"
                alt="冒険 Through the Lens of Adventure"
                className="h-10 w-auto md:h-12"
              />
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded ring-1 ring-white/30 bg-white/10 hover:bg-white/20 transition"
                onClick={() => setMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* ====== メニュー項目 ====== */}
            <div className="flex-1 flex flex-col items-center justify-center gap-10 text-center">
              {/* About Us */}
              <button
                className="text-2xl md:text-3xl tracking-wide hover:text-white/60 transition"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/about");
                }}
              >
                {text.menuAbout}
              </button>

              {/* 広告ジェネレータ → /frame */}
              <button
                className="text-2xl md:text-3xl tracking-wide hover:text-white/60 transition"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/frame");
                }}
              >
                {text.menuAdGen}
              </button>
            </div>

            <div className="pb-6 text-center text-xs md:text-sm text-white/50">
              {text.menuClose}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 横スクロール写真ビュー */}
      <div
        ref={containerRef}
        className="snap-x snap-mandatory flex h-screen w-screen overflow-x-auto overflow-y-hidden scroll-smooth touch-pan-x"
      >
        {photos.map((p, i) => (
          <section
            key={p.id}
            data-index={i}
            className="relative snap-start shrink-0 w-screen h-screen bg-black"
          >
            <motion.img
              src={p.src}
              alt={p.title}
              className="absolute inset-0 h-full w-full object-cover object-center"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setDetailIdx(i)}
            />
            {p.date && (
              <div className="absolute bottom-3 right-3 text-xs md:text-sm text-white/85">
                {p.date}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* 下部黒帯 */}
      <div className="fixed inset-x-0 bottom-0 z-20">
        <motion.div
          className="w-full bg-black/95 md:bg-black/90 md:rounded-none shadow-2xl"
          drag={detailIdx === null ? "y" : false}
          dragConstraints={{ top: -80, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (detailIdx === null && info.offset.y < -40) {
              setDetailIdx(currentIdx);
            }
          }}
        >
          <div className="relative mx-auto w-full max-w-[480px] md:max-w-5xl px-4 pt-2 pb-3 md:px-8 md:pt-5 md:pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentIdx}-${lang}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                {/* 上段：Pen Name + カウンタ（右寄せ） */}
                <div className="flex items-end justify-between pb-3 md:pb-2">
                  <div className="space-y-0.5">
                    {/* 英語ペンネーム：あるときだけ表示 */}
                    {penNameDisplayEn && (
                      <div className="inline-block text-white text-xs md:text-sm font-normal px-0 py-0">
                        {penNameDisplayEn}
                      </div>
                    )}

                    {/* 英語タイトルがある場合のみ表示 */}
                    {titleEn && (
                      <div className="text-lg md:text-base font-semibold text-white py-0">
                        {titleEn}
                      </div>
                    )}

                    {/* 日本語ペンネーム（常に表示） */}
                    {penNameDisplay && (
                      <div className="inline-block bg-white text-black px-0.5 py-0.5 text-xs md:text-sm font-semibold leading-tight">
                        {penNameDisplay}
                      </div>
                    )}
                  </div>

                  <PageIndicator
                    current={currentIdx + 1}
                    total={photos.length}
                    canPrev={currentIdx > 0}
                    canNext={currentIdx < photos.length - 1}
                    onPrev={() => scrollToIndex(currentIdx - 1)}
                    onNext={() => scrollToIndex(currentIdx + 1)}
                  />
                </div>

                {/* タイトル帯 */}
                <div className="mt-0 md:mt-1 flex flex-col space-y-0">
                  <h1 className="w-fit inline-block bg-white text-black px-2 py-1 text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                    {titleJa}
                  </h1>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* ガイド */}
            <div className="mt-3 md:mt-4 flex items-center justify-center gap-2 text-xs md:text-sm text-white/80">
              <span>{text.scrollGuide}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 詳細ビュー */}
      <AnimatePresence>
        {detail && (
          <motion.div
            className="fixed inset-0 z-[50] flex flex-col bg-black/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onTouchStart={handleDetailTouchStart}
            onTouchEnd={handleDetailTouchEnd}
          >
            <button
              className="absolute inset-y-0 left-0 w-[16vw] z-40"
              onClick={() => setDetailIdx(null)}
              aria-label="close left"
            />
            <button
              className="hidden md:block absolute inset-y-0 right-0 w-[16vw] z-40"
              onClick={() => setDetailIdx(null)}
              aria-label="close right"
            />

            <header className="flex items-start justify-between px-4 pt-4 pb-3 md:px-6 md:pt-5 md:pb-4 bg-black">
              <img
                src="/logo/kettei_3.png"
                alt="冒険 Through the Lens of Adventure"
                className="h-10 w-auto md:h-12"
              />
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  className="text-sm md:text-base px-3 py-1.5 rounded bg-white/15 hover:bg-white/25 transition"
                  onClick={() => setLang((l) => (l === "ja" ? "en" : "ja"))}
                >
                  {lang === "ja" ? "EN" : "JP"}
                </button>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded ring-1 ring-white/30 bg-white/10 hover:bg-white/20 transition"
                  onClick={() => setDetailIdx(null)}
                >
                  ✕
                </button>
              </div>
            </header>

            <div
              ref={detailScrollRef}
              className="flex-1 overflow-y-auto pb-20"
              onWheel={handleDetailWheel}
            >
              <div className="mx-auto max-w-5xl px-4 md:px-6 pt-4 md:pt-6 space-y-8 md:space-y-10">
                {/* 写真部分：横 drag */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={detail.id}
                    className="relative w-full aspect-[3/2] md:h-[70vh] overflow-hidden bg-black md:rounded-2xl"
                    initial={{ opacity: 0, scale: 0.92, x: 0 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.96, x: 0 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    drag={photos.length > 1 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_, info) => {
                      const swipePower = info.offset.x + info.velocity.x * 40;

                      if (
                        swipePower < -DETAIL_SWIPE_CONFIDENCE &&
                        activeDetailIdx < photos.length - 1
                      ) {
                        setDetailIdx((prev) =>
                          prev !== null && prev < photos.length - 1
                            ? prev + 1
                            : prev
                        );
                      } else if (
                        swipePower > DETAIL_SWIPE_CONFIDENCE &&
                        activeDetailIdx > 0
                      ) {
                        setDetailIdx((prev) =>
                          prev !== null && prev > 0 ? prev - 1 : prev
                        );
                      }
                    }}
                  >
                    <img
                      src={detail.src}
                      alt={detail.title}
                      className="h-full w-full object-cover object-center"
                    />
                    {detail.date && (
                      <div className="absolute bottom-3 right-3 text-xs md:text-sm text-white/90">
                        {detail.date}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <motion.section
                  className="space-y-4 md:space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                >
                  {/* Pen Name & 番号 */}
                  <div className="flex items-center justify-between gap-3 text-sm md:text-base text-white">
                    <div className="flex flex-col gap-2">
                      <span className="w-fit inline-block text-white text-xs md:text-sm font-nomal px-0 py-0.5">
                        {detail.pennameEn}
                      </span>
                      <span className="text-white text-xl font-semibold md:text-lg">
                        {detail.titleEn}
                      </span>
                      <span className="text-white text-nomal font-nomal md:text-lg">
                        {detail.captionEn}
                      </span>
                    </div>
                    <PageIndicator
                      current={activeDetailIdx + 1}
                      total={photos.length}
                      canPrev={activeDetailIdx > 0}
                      canNext={activeDetailIdx < photos.length - 1}
                      onPrev={() =>
                        setDetailIdx((prev) =>
                          prev !== null && prev > 0 ? prev - 1 : prev
                        )
                      }
                      onNext={() =>
                        setDetailIdx((prev) =>
                          prev !== null && prev < photos.length - 1
                            ? prev + 1
                            : prev
                        )
                      }
                    />
                  </div>

                  {/* タイトル */}
                  <div>
                    <div className="flex flex-col gap-2">
                      <span className="w-fit bg-white text-black text-nomal font-semibold md:text-lg">
                        {detail.penname}
                      </span>
                      <span className="w-fit bg-white inline-block text-black text-2xl md:text-sm font-semibold px-0 py-0.5">
                        {detail.title}
                      </span>
                      <span className="w-fit bg-white text-black text-nomal font-semibold md:text-lg">
                        {detail.caption}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 pb-4 flex items-center justify-center text-xs md:text-sm text-white/70">
                    {text.swipeUpBack}
                  </div>
                </motion.section>
              </div>
            </div>

            {detailIdx !== null && (
              <DetailBottomBar
                canPrev={activeDetailIdx > 0}
                canNext={activeDetailIdx < photos.length - 1}
                onPrev={() => {
                  setDetailIdx((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : prev
                  );
                }}
                onNext={() => {
                  setDetailIdx((prev) =>
                    prev !== null && prev < photos.length - 1
                      ? prev + 1
                      : prev
                  );
                }}
                onHome={() => setDetailIdx(null)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
