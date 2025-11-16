"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PHOTOS } from "@/components/photoData";

type ExtPhoto = (typeof PHOTOS)[number] & {
  titleEn?: string;
  captionEn?: string;
  locationEn?: string;
};

const pad2 = (n: number) => n.toString().padStart(2, "0");

/** 01/21 の「01」だけを上下スライドさせるコンポーネント */
const SlideNumber: React.FC<{ value: number }> = ({ value }) => {
  const v = pad2(value);
  return (
    <div className="relative inline-block h-[1.4em] overflow-hidden align-baseline">
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

export default function Page() {
  const photos = PHOTOS as ExtPhoto[];

  const [lang, setLang] = useState<"ja" | "en">("ja");
  const [currentIdx, setCurrentIdx] = useState(0); // 一覧で中央にいる写真
  const [detailIdx, setDetailIdx] = useState<number | null>(null); // 詳細で表示中の写真
  const [introDone, setIntroDone] = useState(false); // イントロが終わったか
  const [menuOpen, setMenuOpen] = useState(false); // ハンバーガーメニュー

  const containerRef = useRef<HTMLDivElement | null>(null);

  // ===== イントロ（自動終了） =====
  useEffect(() => {
    const timer = setTimeout(() => setIntroDone(true), 3200);
    return () => clearTimeout(timer);
  }, []);

  // ===== 横スクロール中に「今どの写真か」を判定 =====
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

  // ================================
  // 一覧ビュー：下スクロールで詳細へ
  // ================================
  const [listTouchStartY, setListTouchStartY] = useState<number | null>(null);

  const handleListWheel = (e: React.WheelEvent<HTMLElement>) => {
    if (detailIdx !== null) return;
    if (e.deltaY > 40) {
      e.preventDefault();
      setDetailIdx(currentIdx);
    }
  };

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

    // 上方向スワイプ（指は上へ）で詳細オープン
    if (dy < -60) {
      setDetailIdx(currentIdx);
    }
  };

  // ================================
  // 詳細ビュー：左右スワイプ + 上スワイプで戻る
  // ================================
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

    // 1. 横スワイプ優先：左右で前後の写真
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && detailIdx < photos.length - 1) {
        setDetailIdx(detailIdx + 1);
      } else if (dx > 0 && detailIdx > 0) {
        setDetailIdx(detailIdx - 1);
      }
      return;
    }

    // 2. 上方向スワイプ（指を上へ動かす: dy < 0）で一覧へ戻る
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) && dy < 0) {
      setDetailIdx(null);
    }
  };

  const detail = detailIdx !== null ? photos[detailIdx] : null;

  // ===== テキスト =====
  const text = {
    introLine:
      lang === "ja"
        ? "冒険、その瞬間は一枚の写真から始まる。"
        : "Every adventure begins with a single frame.",
    tapToOpen: lang === "ja" ? "タップして開く" : "Tap to open",
    penLabel: lang === "ja" ? "ペンネーム" : "Pen Name",
    scrollGuide:
      lang === "ja" ? "下にスクロールで詳細へ" : "Scroll down for details",
    back: lang === "ja" ? "Back" : "Back",
    home: lang === "ja" ? "Home" : "Home",
    next: lang === "ja" ? "Next" : "Next",
    menuAbout: lang === "ja" ? "About us" : "About us",
    menuAdGen: lang === "ja" ? "広告ジェネレータ" : "Ad Generator",
    menuClose: lang === "ja" ? "閉じる" : "Close",
  };

  // 一覧用：英語タイトル（ペンネーム）と日本語タイトル
  const penTitleEn = currentPhoto.titleEn ?? currentPhoto.title;
  const titleJa = currentPhoto.title;

  return (
    <main
      className="relative min-h-screen bg-black text-white overflow-hidden"
      onWheel={handleListWheel}
      onTouchStart={handleListTouchStart}
      onTouchEnd={handleListTouchEnd}
    >
      {/* ===================================================== */}
      {/* 1. フルスクリーン ロゴイントロ                         */}
      {/* ===================================================== */}
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

            <div className="absolute inset-0 overflow-hidden">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute h-[1px] md:h-[2px] w-[160%] bg-white/80"
                  style={{
                    top: `${30 + i * 18}%`,
                    left: "-40%",
                    rotate: "-18deg",
                  }}
                  initial={{ x: "-140%", opacity: 0 }}
                  animate={{ x: "40%", opacity: [0, 1, 0.3] }}
                  transition={{
                    delay: 0.15 + i * 0.12,
                    duration: 0.9,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              ))}
            </div>

            <motion.div
              className="absolute h-[260px] w-[260px] md:h-[420px] md:w-[420px] rounded-full bg-white/5 blur-3xl"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1.2, opacity: [0.4, 0.8, 0.3] }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />

            <motion.div className="relative flex flex-col items-center">
              <motion.img
                src="/logo/kettei_3.png"
                alt="冒険 Through the Lens of Adventure"
                className="w-[260px] md:w-[420px] h-auto drop-shadow-[0_22px_65px_rgba(0,0,0,0.9)]"
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
                className="mt-6 text-xs md:text-sm text-white/90 tracking-wide text-center px-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.8 }}
              >
                {text.introLine}
              </motion.p>

              <motion.span
                className="mt-5 text-[11px] md:text-xs text-white/70 inline-flex items-center gap-2"
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

      {/* ===================================================== */}
      {/* 2. ヘッダー                                           */}
      {/* ===================================================== */}
      <header className="fixed left-0 right-0 top-0 z-30 flex items-start justify-between px-4 pt-4 pb-3 md:px-6 md:pt-5 md:pb-4 bg-gradient-to-b from-black via-black/60 to-transparent">
        <img
          src="/logo/kettei_3.png"
          alt="冒険 Through the Lens of Adventure"
          className="h-9 w-auto md:h-11"
        />
        <div className="flex items-center gap-2">
          <button
            className="text-xs md:text-sm px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
            onClick={() => setLang((l) => (l === "ja" ? "en" : "ja"))}
          >
            {lang === "ja" ? "EN" : "JP"}
          </button>
          <button
            className="h-9 w-9 flex flex-col items-center justify-center gap-[5px] rounded bg-white/5 hover:bg-white/15 transition"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <span className="h-[1.5px] w-5 bg-white" />
            <span className="h-[1.5px] w-5 bg-white" />
            <span className="h-[1.5px] w-5 bg-white" />
          </button>
        </div>
      </header>

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
                className="h-9 w-auto md:h-11"
              />
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded ring-1 ring-white/30 bg-white/5 hover:bg-white/10 transition"
                onClick={() => setMenuOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center">
              <button
                className="text-xl md:text-2xl tracking-wide hover:text-white/60 transition"
                onClick={() => setMenuOpen(false)}
              >
                {text.menuAbout}
              </button>
              <button
                className="text-xl md:text-2xl tracking-wide hover:text-white/60 transition"
                onClick={() => setMenuOpen(false)}
              >
                {text.menuAdGen}
              </button>
            </div>
            <div className="pb-6 text-center text-xs text-white/50">
              {text.menuClose}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================== */}
      {/* 3. 横スクロール写真ビュー                             */}
      {/* ===================================================== */}
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
              className="absolute inset-0 h-full w-full object-cover md:object-cover object-center"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setDetailIdx(i)} // タップでも開ける
            />
            {p.date && (
              <div className="absolute bottom-3 right-3 text-[11px] md:text-xs text-white/80">
                {p.date}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* ===================================================== */}
      {/* 4. 下部 黒帯テキスト                                  */}
      {/* ===================================================== */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center pb-1">
        <div
          className="
            w-full max-w-4xl bg-black/95 rounded-t-xl
            px-3 pt-1 pb-2
            md:px-6 md:pt-4 md:pb-5
            shadow-2xl
            max-h-[25vh] md:max-h-none
          "
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIdx}-${lang}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              {/* 上段：Pen Name / カウンタ */}
              <div className="flex items-end justify-between gap-4 border-b border-white/30 pb-2 md:pb-3">
                <div className="space-y-1">
                  <div className="inline-block bg-white text-black text-[11px] md:text-xs font-semibold px-2 py-0.5 rounded-sm">
                    {text.penLabel}
                  </div>
                  {/* 英字ペンネーム（titleEn） */}
                  <div className="text-[12px] md:text-sm text-white/85">
                    {penTitleEn}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 text-xs">
                  <div className="rounded-md border border-white/80 px-3 py-1 bg-black flex items-baseline gap-1 text-lg md:text-2xl font-semibold tracking-[0.18em]">
                    <SlideNumber value={currentIdx + 1} />
                    <span className="text-sm md:text-base leading-none">
                      /{pad2(photos.length)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => scrollToIndex(currentIdx - 1)}
                      disabled={currentIdx === 0}
                      className="disabled:opacity-30 hover:text-white"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => scrollToIndex(currentIdx + 1)}
                      disabled={currentIdx === photos.length - 1}
                      className="disabled:opacity-30 hover:text-white"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>

              {/* 下段：白背景の日本語タイトルのみ */}
              <div className="mt-2 md:mt-3">
                <h1 className="inline-block bg-white text-black text-2xl md:text-[30px] font-extrabold tracking-tight px-2 py-1 leading-snug">
                  {titleJa}
                </h1>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* ガイド */}
          <div className="mt-2 md:mt-3 flex items-center justify-center gap-2 text-[11px] md:text-xs text-white/70">
            <span>{text.scrollGuide}</span>
            <div className="h-[1px] w-16 bg-white/40 overflow-hidden">
              <div className="h-full w-1/3 bg-white scroll-dot" />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* 5. 詳細ビュー                                         */}
      {/* ===================================================== */}
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
            {/* 左右の黒いゾーンタップで閉じる */}
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

            <header className="flex items-start justify-between px-4 pt-4 pb-3 md:px-6 md:pt-5 md:pb-4 bg-black">
              <img
                src="/logo/kettei_3.png"
                alt="冒険 Through the Lens of Adventure"
                className="h-9 w-auto md:h-11"
              />
              <div className="flex items-center gap-2">
                <button
                  className="text-xs md:text-sm px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
                  onClick={() => setLang((l) => (l === "ja" ? "en" : "ja"))}
                >
                  {lang === "ja" ? "EN" : "JP"}
                </button>
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded ring-1 ring-white/30 bg-white/5 hover:bg-white/10 transition"
                  onClick={() => setDetailIdx(null)}
                >
                  ✕
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto pb-10">
              <div className="mx-auto max-w-5xl px-3 md:px-6 pt-4 md:pt-6 space-y-8 md:space-y-10">
                {/* 写真 */}
                <motion.div
                  className="relative w-full aspect-[3/2] md:h-[70vh] overflow-hidden bg-black"
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
                    <div className="absolute bottom-3 right-3 text-[11px] md:text-xs text-white/85">
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
                  <div className="flex items-center justify-between gap-4 text-xs md:text-sm text-white/70">
                    <div className="flex flex-col gap-1">
                      <span className="inline-block bg-white text-black text-[11px] md:text-xs font-semibold px-2 py-0.5 rounded-sm">
                        {text.penLabel}
                      </span>
                      <span className="text-sm md:text-base">
                        {detail.titleEn ?? detail.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-md border border-white/60 px-2.5 py-1 text-base md:text-lg font-semibold tracking-wider bg-black">
                        {pad2(detailIdx! + 1)}/{pad2(photos.length)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h1 className="inline-block bg-white text-black text-2xl md:text-[34px] font-extrabold tracking-tight px-2 py-1 leading-snug">
                      {detail.title}
                    </h1>
                    {(detail.location || detail.locationEn) && (
                      <div className="mt-2 text-xs md:text-sm text-white/70">
                        {lang === "ja"
                          ? detail.location
                          : detail.locationEn ?? detail.location}
                      </div>
                    )}
                  </div>

                  {(detail.caption || detail.captionEn) && (
                    <p className="max-w-3xl text-[13px] md:text-base leading-relaxed text-white/90 bg-white/5 px-3 py-3 md:px-4 md:py-4 rounded-md">
                      {lang === "ja"
                        ? detail.caption
                        : detail.captionEn ?? detail.caption}
                    </p>
                  )}
                </motion.section>

                {/* Back / Home / Next */}
                <section className="pt-4">
                  <div className="relative flex items-center justify-between text-xs md:text-sm">
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-white" />
                    <button
                      onClick={() =>
                        setDetailIdx((i) =>
                          i !== null && i > 0 ? i - 1 : i
                        )
                      }
                      disabled={detailIdx === 0}
                      className="relative z-10 px-4 py-1 bg-black disabled:opacity-40"
                    >
                      {text.back}
                    </button>
                    <button
                      onClick={() => setDetailIdx(null)}
                      className="relative z-10 px-4 py-1 bg-black"
                    >
                      {text.home}
                    </button>
                    <button
                      onClick={() =>
                        setDetailIdx((i) =>
                          i !== null && i < photos.length - 1 ? i + 1 : i
                        )
                      }
                      disabled={detailIdx === photos.length - 1}
                      className="relative z-10 px-4 py-1 bg-black disabled:opacity-40"
                    >
                      {text.next}
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* スクロールインジケータ用 keyframes */}
      <style jsx global>{`
        @keyframes scrollDot {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateX(200%);
            opacity: 0;
          }
        }
        .scroll-dot {
          animation: scrollDot 1.4s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
