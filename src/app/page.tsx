"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PHOTOS } from "@/components/photoData";

type ExtPhoto = (typeof PHOTOS)[number] & {
  titleEn?: string;
  captionEn?: string;
  locationEn?: string;
};

const pad2 = (n: number) => n.toString().padStart(2, "0");

/** 01/21 の「01」部分だけをスライドさせるカウンタ */
const SlideNumber = ({ value }: { value: number }) => {
  const v = pad2(value);
  return (
    <div className="relative inline-block h-[1.6em] overflow-hidden align-baseline">
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={v}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="block leading-none"
        >
          {v}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

/** 画像のデザイン通りの 01/21 + 左右矢印 UI */
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
    <div className="flex flex-col items-center gap-1 text-xs md:text-sm">
      {/* 上の数字ボックス（枠つき） */}
      <div className="border border-white px-4 py-1 bg-black">
        <span className="flex items-baseline text-white text-2xl md:text-3xl font-bold tracking-widest">
          {/* 左側 01 はスライドアニメーション */}
          <SlideNumber value={current} />
          {/* 右側 /21 */}
          <span className="ml-1 opacity-80 text-xl md:text-2xl leading-none">
            /{pad2(total)}
          </span>
        </span>
      </div>

      {/* 下の矢印 + 横ライン */}
      <div className="flex items-center justify-center gap-2 mt-1">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="text-white text-lg md:text-xl disabled:opacity-30 hover:text-white"
        >
          ←
        </button>

        <div className="w-20 md:w-24 border-t border-white" />

        <button
          onClick={onNext}
          disabled={!canNext}
          className="text-white text-lg md:text-xl disabled:opacity-30 hover:text-white"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default function Page() {
  const photos = PHOTOS as ExtPhoto[];

  const [lang, setLang] = useState<"ja" | "en">("ja");
  const [currentIdx, setCurrentIdx] = useState(0); // 一覧で中央の写真
  const [detailIdx, setDetailIdx] = useState<number | null>(null); // 詳細表示中の写真
  const [introDone, setIntroDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const detailScrollRef = useRef<HTMLDivElement | null>(null);

  // イントロ自動終了
  useEffect(() => {
    const timer = setTimeout(() => setIntroDone(true), 3200);
    return () => clearTimeout(timer);
  }, []);

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

  // ===== スワイプ（タッチ）用：一覧 → 詳細 =====
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

    // 指を上にスワイプ（dy < 0） → 詳細オープン
    if (dy < -60) {
      setDetailIdx(currentIdx);
    }
  };

  // ===== スワイプ（タッチ）用：詳細 → 一覧 =====
  const [detailTouchStart, setDetailTouchStart] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleDetailTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (detailIdx === null) return;
    const t = e.touches[0];
    setDetailTouchStart({ x: t.clientX, y: t.clientY });
  };

  const handleDetailTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (detailIdx === null || !detailTouchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - detailTouchStart.x;
    const dy = t.clientY - detailTouchStart.y;
    setDetailTouchStart(null);

    // 横スワイプが大きいとき → 前後の写真
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && detailIdx < photos.length - 1) {
        setDetailIdx(detailIdx + 1);
      } else if (dx > 0 && detailIdx > 0) {
        setDetailIdx(detailIdx - 1);
      }
      return;
    }

    // 指を上にスワイプ（dy < 0） → 一覧へ戻る
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) && dy < 0) {
      setDetailIdx(null);
    }
  };

  // ===== スクロール（マウスホイール・トラックパッド）用 =====

  // 一覧 → 詳細
  const [listScrollAccum, setListScrollAccum] = useState(0);
  const LIST_SCROLL_THRESHOLD = 160;

  const handleMainWheel = (e: React.WheelEvent<HTMLElement>) => {
    if (detailIdx !== null) return; // 詳細表示中はここでは何もしない

    if (e.deltaY > 0) {
      // 下方向スクロール
      setListScrollAccum((prev) => {
        const next = prev + e.deltaY;
        if (next > LIST_SCROLL_THRESHOLD) {
          setDetailIdx(currentIdx);
          return 0;
        }
        return next;
      });
    } else if (e.deltaY < 0) {
      // 上方向ならリセットだけ
      setListScrollAccum(0);
    }
  };

  // 詳細 → 一覧
  const [detailScrollAccum, setDetailScrollAccum] = useState(0);
  const DETAIL_SCROLL_THRESHOLD = 160;

  const handleDetailWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (detailIdx === null) return;
    const container = detailScrollRef.current;
    if (!container) return;

    const { scrollTop } = container;

    // 上方向スクロール ＆ すでに一番上にいるときだけチェック
    if (e.deltaY < 0 && scrollTop <= 0) {
      setDetailScrollAccum((prev) => {
        const next = prev + e.deltaY; // deltaY は負
        if (Math.abs(next) > DETAIL_SCROLL_THRESHOLD) {
          setDetailIdx(null);
          return 0;
        }
        return next;
      });
    } else if (e.deltaY > 0) {
      // 下方向なら戻る意図ではないのでリセット
      setDetailScrollAccum(0);
    }
  };

  // 文言
  const text = {
    introLine:
      lang === "ja"
        ? "冒険、その瞬間は一枚の写真から始まる。"
        : "Every adventure begins with a single frame.",
    tapToOpen: lang === "ja" ? "タップして開く" : "Tap to open",
    penLabel: lang === "ja" ? "ペンネーム" : "Pen Name",
    scrollGuide:
      lang === "ja" ? "下にスクロール／スワイプで詳細へ" : "Scroll down for details",
    menuAbout: lang === "ja" ? "About us" : "About us",
    menuAdGen: lang === "ja" ? "広告ジェネレータ" : "Ad Generator",
    menuClose: lang === "ja" ? "閉じる" : "Close",
    swipeUpBack:
      lang === "ja"
        ? "上にスクロール／スワイプで一覧へ"
        : "Scroll up to go back",
  };

  const penTitleEn = currentPhoto.titleEn ?? currentPhoto.title;
  const titleJa = currentPhoto.title;

  return (
    <main
      className="relative min-h-screen bg-black text-white overflow-hidden"
      onTouchStart={handleListTouchStart}
      onTouchEnd={handleListTouchEnd}
      onWheel={handleMainWheel}
    >
      {/* イントロ */}
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
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#020617] to-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
            <motion.div
              className="absolute -inset-[30%] bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.12),transparent_50%),radial-gradient(circle_at_100%_100%,rgba(96,165,250,0.25),transparent_55%)]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1.05 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            />
            <motion.div
              className="absolute h-[280px] w-[280px] md:h-[440px] md:w-[440px] rounded-full bg-white/5 blur-3xl"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1.2, opacity: [0.4, 0.8, 0.3] }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />
            <motion.div className="relative flex flex-col items-center">
              <motion.img
                src="/logo/kettei_3.png"
                alt="冒険 Through the Lens of Adventure"
                className="w-[280px] md:w-[440px] h-auto drop-shadow-[0_22px_65px_rgba(0,0,0,0.9)]"
                initial={{ scale: 0.7, opacity: 0, y: 20 }}
                animate={{
                  scale: [0.7, 1.1, 1.02],
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 1.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
              <motion.p
                className="mt-7 text-sm md:text-base text-white/90 tracking-wide text-center px-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.8 }}
              >
                {text.introLine}
              </motion.p>
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

      {/* ヘッダー：ロゴ画像＋メニュー */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-start justify-between pl-1 pr-4 pt-5 pb-4 md:pl-2 md:pr-6 md:pt-7 bg-gradient-to-b from-black via-black/70 to-transparent">
        <img
          src="/logo/kettei_3.png"
          alt="冒険 Through the Lens of Adventure"
          className="h-24 w-auto md:h-28"
        />
        <div className="flex items-center gap-2 md:gap-3">
          <button
            className="text-sm md:text-base px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 transition"
            onClick={() => setLang((l) => (l === "ja" ? "en" : "ja"))}
          >
            {lang === "ja" ? "EN" : "JP"}
          </button>
          <button
            className="h-10 w-10 md:h-11 md:w-11 flex flex-col items-center justify-center gap-[5px] rounded bg-white/10 hover:bg-white/20 transition"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <span className="h-[2px] w-6 bg-white" />
            <span className="h-[2px] w-6 bg-white" />
            <span className="h-[2px] w-6 bg-white" />
          </button>
        </div>
      </header>

      {/* 右側の縦 SCROLL インジケータ（1枚目・一覧ビューだけ表示） */}
      {detailIdx === null && currentIdx === 0 && (
        <div className="fixed inset-y-0 right-5 z-20 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs md:text-sm tracking-[0.3em] text-white/80 [writing-mode:vertical-rl]">
              SCROLL
            </span>
            <span className="block h-12 w-px bg-white/70" />
            <span className="inline-block border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px] border-t-white" />
          </div>
        </div>
      )}

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
            <div className="flex-1 flex flex-col items-center justify-center gap-10 text-center">
              <button
                className="text-2xl md:text-3xl tracking-wide hover:text-white/60 transition"
                onClick={() => setMenuOpen(false)}
              >
                {text.menuAbout}
              </button>
              <button
                className="text-2xl md:text-3xl tracking-wide hover:text-white/60 transition"
                onClick={() => setMenuOpen(false)}
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
        className="snap-x snap-mandatory flex h-screen w-screen overflow-x-auto overflow-y-hidden scroll-smooth"
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
              onClick={() => setDetailIdx(i)} // タップでも詳細へ
            />
            {p.date && (
              <div className="absolute bottom-3 right-3 text-xs md:text-sm text-white/85">
                {p.date}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* 下部の黒帯（Pen Name + 日本語タイトル） */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center pb-1 md:pb-2">
        <div className="w-full max-w-4xl bg-black/95 rounded-t-2xl px-4 pt-2 pb-3 md:px-8 md:pt-5 md:pb-6 shadow-2xl max-h-[28vh] md:max-h-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIdx}-${lang}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              {/* 上段：Pen Name + カウンタ */}
              <div className="flex items-end justify-between gap-4 border-b border-white/30 pb-3 md:pb-4">
                <div className="space-y-2">
                  <div className="inline-block bg-white text-black text-xs md:text-sm font-semibold px-3 py-1 rounded-sm">
                    {text.penLabel}
                  </div>
                  <div className="text-sm md:text-base text-white/90">
                    {penTitleEn}
                  </div>
                </div>

                {/* ★ ここが新しい PageIndicator ★ */}
                <PageIndicator
                  current={currentIdx + 1}
                  total={photos.length}
                  canPrev={currentIdx > 0}
                  canNext={currentIdx < photos.length - 1}
                  onPrev={() => scrollToIndex(currentIdx - 1)}
                  onNext={() => scrollToIndex(currentIdx + 1)}
                />
              </div>

              {/* 下段：白背景の日本語タイトル */}
              <div className="mt-3 md:mt-4">
                <h1 className="inline-block bg-white text-black text-3xl md:text-4xl font-extrabold tracking-tight px-3 py-1.5 leading-snug">
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
            {/* 左右タップで閉じるゾーン */}
            <button
              className="absolute inset-y-0 left-0 w-[16vw] z-40"
              onClick={() => setDetailIdx(null)}
              aria-label="close left"
            />
            <button
              className="absolute inset-y-0 right-0 w-[16vw] z-40"
              onClick={() => setDetailIdx(null)}
              aria-label="close right"
            />

            {/* 詳細ヘッダー：ロゴ画像 */}
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
              className="flex-1 overflow-y-auto pb-10"
              onWheel={handleDetailWheel}
            >
              <div className="mx-auto max-w-5xl px-4 md:px-6 pt-4 md:pt-6 space-y-8 md:space-y-10">
                {/* 写真 */}
                <motion.div
                  className="relative w-full aspect-[3/2] md:h-[70vh] overflow-hidden bg-black rounded-xl md:rounded-2xl"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
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

                {/* テキスト */}
                <motion.section
                  className="space-y-4 md:space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.45, delay: 0.1 }}
                >
                  <div className="flex items-center justify-between gap-4 text-sm md:text-base text白/80">
                    <div className="flex flex-col gap-2">
                      <span className="inline-block bg-white text-black text-xs md:text-sm font-semibold px-3 py-1 rounded-sm">
                        {text.penLabel}
                      </span>
                      <span className="text-base md:text-lg">
                        {detail.titleEn ?? detail.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-md border border-white/60 px-3 py-1.5 text-base md:text-lg font-semibold tracking-wider bg-black">
                        {pad2(detailIdx! + 1)}/{pad2(photos.length)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h1 className="inline-block bg-white text-black text-3xl md:text-4xl font-extrabold tracking-tight px-3 py-1.5 leading-snug">
                      {detail.title}
                    </h1>
                    {(detail.location || detail.locationEn) && (
                      <div className="mt-3 text-sm md:text-base text-white/80">
                        {lang === "ja"
                          ? detail.location
                          : detail.locationEn ?? detail.location}
                      </div>
                    )}
                  </div>

                  {(detail.caption || detail.captionEn) && (
                    <p className="max-w-3xl text-sm md:text-lg leading-relaxed text-white/90 bg-white/10 px-4 py-4 md:px-5 md:py-5 rounded-lg">
                      {lang === "ja"
                        ? detail.caption
                        : detail.captionEn ?? detail.caption}
                    </p>
                  )}

                  {/* 一覧に戻るガイド */}
                  <div className="pt-2 pb-4 flex items-center justify-center text-xs md:text-sm text-white/70">
                    {text.swipeUpBack}
                  </div>
                </motion.section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
