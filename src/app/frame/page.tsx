"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Analytics } from "@vercel/analytics/next"

type Frame = {
    id: string;
    src: string;
    label: string;
    innerX: number;
    innerY: number;
    innerWidth: number;
    innerHeight: number;
};

const FRAMES: Frame[] = [
    {
        id: "frame1",
        src: "/frames/frame1.png",
        label: "冒険フレーム A",
        innerX: 41,
        innerY: 41,
        innerWidth: 998,
        innerHeight: 1030,
    },
    {
        id: "frame2",
        src: "/frames/frame2.png",
        label: "冒険フレーム B",
        innerX: 41,
        innerY: 41,
        innerWidth: 998,
        innerHeight: 1030,
    },
    {
        id: "frame3",
        src: "/frames/frame3.png",
        label: "冒険フレーム C",
        innerX: 41,
        innerY: 41,
        innerWidth: 998,
        innerHeight: 1030,
    },
    {
        id: "frame4",
        src: "/frames/frame4.png",
        label: "冒険フレーム D",
        innerX: 41,
        innerY: 41,
        innerWidth: 998,
        innerHeight: 1030,
    },
    {
        id: "frame5",
        src: "/frames/frame5.png",
        label: "冒険フレーム E",
        innerX: 41,
        innerY: 41,
        innerWidth: 998,
        innerHeight: 1030,
    },
    {
        id: "frame6",
        src: "/frames/frame6.png",
        label: "冒険フレーム F",
        innerX: 41,
        innerY: 41,
        innerWidth: 998,
        innerHeight: 1030,
    },
];

type Offset = { x: number; y: number };
type Step = "upload" | "frame" | "adjust" | "done";

function useIsMobile(breakpoint = 768): boolean {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
        const update = () => setIsMobile(mq.matches);
        update();
        if (mq.addEventListener) {
            mq.addEventListener("change", update);
            return () => mq.removeEventListener("change", update);
        } else {
            // @ts-ignore
            mq.addListener(update);
            return () => {
                // @ts-ignore
                mq.removeListener(update);
            };
        }
    }, [breakpoint]);
    return isMobile;
}

export default function FrameGeneratorPage() {
    const isMobile = useIsMobile();
    const router = useRouter();

    const [step, setStep] = useState<Step>("upload");
    const [menuOpen, setMenuOpen] = useState(false);

    const [selectedFrameId, setSelectedFrameId] = useState<string>(FRAMES[0].id);
    const selectedFrame = FRAMES.find((f) => f.id === selectedFrameId)!;

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const photoImageRef = useRef<HTMLImageElement | null>(null);
    const frameImageRef = useRef<HTMLImageElement | null>(null);

    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    // 表示用の offset（ドラッグ終了時にのみ更新）
    const [photoOffset, setPhotoOffset] = useState<Offset>({ x: 0, y: 0 });
    // 実際のドラッグ中の offset（ぬるぬる用）
    const photoOffsetRef = useRef<Offset>({ x: 0, y: 0 });

    const [isLoaded, setIsLoaded] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);

    const [finalUrl, setFinalUrl] = useState<string | null>(null);

    const [iosSaveMode, setIosSaveMode] = useState(false);

    const dragStateRef = useRef<{
        dragging: boolean;
        startX: number;
        startY: number;
        startOffsetX: number;
        startOffsetY: number;
    } | null>(null);

    const isIOS =
        typeof navigator !== "undefined" &&
        /iP(hone|od|ad)/.test(navigator.userAgent);

    // objectURL クリーンアップ
    useEffect(() => {
        return () => {
            if (photoUrl) URL.revokeObjectURL(photoUrl);
        };
    }, [photoUrl]);

    /* ===== ステップインジケータ ===== */
    const stepsMeta: { id: Step; label: string }[] = [
        { id: "upload", label: "Upload" },
        { id: "frame", label: "Frame" },
        { id: "adjust", label: "Adjust" },
        { id: "done", label: "Done" },
    ];

    const StepIndicator: React.FC<{ current: Step }> = ({ current }) => {
        const currentIndex = stepsMeta.findIndex((s) => s.id === current);

        return (
            <div style={{ padding: "8px 14px 10px", borderBottom: "1px solid #1f2933" }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                    }}
                >
                    {stepsMeta.map((s, index) => {
                        const isDone = index < currentIndex;
                        const isCurrent = index === currentIndex;
                        const active = isDone || isCurrent;

                        return (
                            <div
                                key={s.id}
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    position: "relative",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 9,
                                        marginBottom: 10,
                                        color: active ? "#e0f2fe" : "#9ca3af",
                                        fontWeight: active ? 700 : 500,
                                        textAlign: "center",
                                    }}
                                >
                                    {s.label}
                                </div>

                                <div
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        height: 30,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {index < stepsMeta.length - 1 && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "50%",
                                                left: "50%",
                                                width: "100%",
                                                transform: "translate(-50%, -50%)",
                                                zIndex: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: 2,
                                                    marginLeft: "50%",
                                                    marginRight: "-50%",
                                                    background:
                                                        index < currentIndex
                                                            ? "linear-gradient(to right,#0ea5e9,#38bdf8)"
                                                            : "#374151",
                                                    opacity: index < currentIndex ? 1 : 0.6,
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div
                                        style={{
                                            width: 18,
                                            height: 18,
                                            borderRadius: "50%",
                                            zIndex: 1,
                                            border: active ? "0" : "2px solid #4b5563",
                                            backgroundColor: active ? "#0ea5e9" : "#000000",
                                            boxShadow: active
                                                ? "0 0 0 2px rgba(56,189,248,0.4)"
                                                : "0 0 0 0 transparent",
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    /* ===== ヘッダー ===== */
    const TopHeader: React.FC = () => (
        <header
            style={{
                height: 56,
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #333333",
            }}
        >
            <button
                type="button"
                onClick={() => {
                    router.push("/");
                }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                }}
            >
                <img
                    src="/logo/kettei_3.png"
                    alt="冒険 Through the Lens of Adventure"
                    style={{ height: 40, width: "auto" }}
                />
            </button>

            <button
                type="button"
                onClick={() => setMenuOpen(true)}
                style={{
                    width: 28,
                    height: 22,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: 0,
                }}
                aria-label="Open menu"
            >
                {[0, 1, 2].map((_, i) => (
                    <span
                        key={i}
                        style={{
                            display: "block",
                            height: 2,
                            width: "100%",
                            backgroundColor: "#ffffff",
                            opacity: 1,
                        }}
                    />
                ))}
            </button>
        </header>
    );

    /* ===== フレーム選択 UI（Frame ステップで使う） ===== */
    const FrameSelector: React.FC = () => {
        return (
            <div
                style={{
                    marginTop: 6,
                    marginBottom: 6,
                }}
            >
                <div
                    style={{
                        fontSize: 10,
                        fontWeight: 700,
                        marginBottom: 4,
                    }}
                >
                    フレームを選択
                </div>
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                    }}
                >
                    {FRAMES.map((frame) => {
                        const active = frame.id === selectedFrameId;
                        return (
                            <button
                                key={frame.id}
                                type="button"
                                onClick={() => {
                                    setSelectedFrameId(frame.id);
                                    // 必要ならここで photoOffsetRef をリセット
                                    // photoOffsetRef.current = { x: 0, y: 0 };
                                    // setPhotoOffset({ x: 0, y: 0 });
                                }}
                                style={{
                                    flex: "1 1 0",
                                    minWidth: 0,
                                    padding: 4,
                                    borderRadius: 8,
                                    border: active
                                        ? "1px solid #38bdf8"
                                        : "1px solid #4b5563",
                                    backgroundColor: active ? "#0b1120" : "#020617",
                                    cursor: "pointer",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 4,
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        aspectRatio: "4 / 5",
                                        backgroundColor: "#111827",
                                        overflow: "hidden",
                                        borderRadius: 6,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <img
                                        src={frame.src}
                                        alt={frame.label}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            opacity: active ? 1 : 0.8,
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontSize: 9,
                                        color: active ? "#e0f2fe" : "#9ca3af",
                                        textAlign: "center",
                                    }}
                                >
                                    {frame.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    /* ===== 画像読み込み ===== */
    useEffect(() => {
        if (!photoUrl) {
            setIsLoaded(false);
            setIsDrawing(false);
            return;
        }

        const loadImage = (src: string): Promise<HTMLImageElement> =>
            new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });

        let cancelled = false;
        setIsDrawing(true);
        setIsLoaded(false);

        (async () => {
            try {
                const [photoImg, frameImg] = await Promise.all([
                    loadImage(photoUrl),
                    loadImage(selectedFrame.src),
                ]);
                if (cancelled) return;
                photoImageRef.current = photoImg;
                frameImageRef.current = frameImg;
                const initOffset = { x: 0, y: 0 };
                photoOffsetRef.current = initOffset;
                setPhotoOffset(initOffset);
                setIsLoaded(true);
            } catch (e) {
                console.error(e);
                alert("画像の読み込みに失敗しました。ファイルやパスを確認してください。");
                setIsLoaded(false);
            } finally {
                if (!cancelled) setIsDrawing(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [photoUrl, selectedFrame]);

    /* ===== 描画（オプションで offset を指定） ===== */
    const draw = (offsetOverride?: Offset) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        const photoImg = photoImageRef.current;
        const frameImg = frameImageRef.current;
        if (!canvas || !ctx || !photoImg || !frameImg) return;

        const frameWidth = frameImg.width;
        const frameHeight = frameImg.height;

        canvas.width = frameWidth;
        canvas.height = frameHeight;
        ctx.clearRect(0, 0, frameWidth, frameHeight);

        ctx.drawImage(frameImg, 0, 0, frameWidth, frameHeight);

        const { innerX, innerY, innerWidth, innerHeight } = selectedFrame;

        ctx.save();
        ctx.beginPath();
        ctx.rect(innerX, innerY, innerWidth, innerHeight);
        ctx.clip();

        const scale = Math.max(
            innerWidth / photoImg.width,
            innerHeight / photoImg.height
        );
        const drawWidth = photoImg.width * scale;
        const drawHeight = photoImg.height * scale;

        const baseX = innerX + (innerWidth - drawWidth) / 2;
        const baseY = innerY + (innerHeight - drawHeight) / 2;

        const offset = offsetOverride ?? photoOffsetRef.current;
        const offsetX = baseX + offset.x;
        const offsetY = baseY + offset.y;

        ctx.drawImage(photoImg, offsetX, offsetY, drawWidth, drawHeight);

        ctx.restore();

        try {
            const dataUrl = canvas.toDataURL("image/png");
            setFinalUrl(dataUrl);
        } catch {
            /* ignore */
        }
    };

    // state が変わったとき / ステップやフレームが変わったとき再描画
    useEffect(() => {
        if (!isLoaded) return;
        draw();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, step, selectedFrame, photoOffset]);

    /* ===== ハンドラ ===== */

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPhotoUrl(url);
        setFinalUrl(null);
        setStep("frame"); // 画像選択後は Frame ステップへ
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!photoUrl || !isLoaded || step !== "adjust") return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.setPointerCapture(e.pointerId);
        dragStateRef.current = {
            dragging: true,
            startX: e.clientX,
            startY: e.clientY,
            startOffsetX: photoOffsetRef.current.x,
            startOffsetY: photoOffsetRef.current.y,
        };
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const st = dragStateRef.current;
        if (!st || !st.dragging) return;
        const dx = e.clientX - st.startX;
        const dy = e.clientY - st.startY;
        const newOffset: Offset = {
            x: st.startOffsetX + 1.2 * dx,
            y: st.startOffsetY + 1.2 * dy,
        };
        // state に入れず、ref + 直接 draw でぬるぬる
        photoOffsetRef.current = newOffset;
        draw(newOffset);
    };

    const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        dragStateRef.current = null;
        if (canvas) {
            try {
                canvas.releasePointerCapture(e.pointerId);
            } catch {
                // ignore
            }
        }
        // 最終位置だけ state に反映
        setPhotoOffset(photoOffsetRef.current);
    };

    const handleDownload = () => {
        if (!finalUrl) return;
        if (typeof window === "undefined") return;

        if (isIOS) {
            setIosSaveMode(true);
            window.scrollTo(0, 0);
            return;
        }

        const a = document.createElement("a");
        a.href = finalUrl;
        a.download = "framed_photo.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleReset = () => {
        if (photoUrl) URL.revokeObjectURL(photoUrl);
        setPhotoUrl(null);
        const initOffset = { x: 0, y: 0 };
        photoOffsetRef.current = initOffset;
        setPhotoOffset(initOffset);
        setIsLoaded(false);
        setFinalUrl(null);
        setStep("upload");
        setIosSaveMode(false);
    };

    const canDownload = !!finalUrl && !isDrawing;

    /* ===== メニューオーバーレイ ===== */
    const MenuOverlay: React.FC = () => (
        <AnimatePresence>
            {menuOpen && (
                <motion.div
                    className="fixed inset-0 z-[55] bg-black/90 backdrop-blur-sm flex flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen(false);
                                router.push("/");
                            }}
                            className="flex items-center"
                        >
                            <img
                                src="/logo/kettei_3.png"
                                alt="冒険 Through the Lens of Adventure"
                                className="h-12 w-auto md:h-16"
                            />
                        </button>

                        <button
                            className="inline-flex h-10 w-10 items-center justify-center rounded ring-1 ring-white/30 bg-white/10 hover:bg-white/20 transition"
                            onClick={() => setMenuOpen(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center gap-10 text-center">
                        <button
                            className="text-2xl md:text-3xl tracking-wide text-white hover:text-white/60 transition"
                            onClick={() => {
                                setMenuOpen(false);
                                router.push("/");
                            }}
                        >
                            Home
                        </button>

                        <button
                            className="text-2xl md:text-3xl tracking-wide text-white hover:text-white/60 transition"
                            onClick={() => {
                                setMenuOpen(false);
                                router.push("/frame");
                            }}
                        >
                            広告ジェネレータ
                        </button>
                    </div>

                    <div className="pb-6 text-center text-xs md:text-sm text-white/50">
                        画面をタップすると閉じます
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    /* ===== iPhone 用 保存ガイドページ ===== */
    if (iosSaveMode && finalUrl) {
        return (
            <>
                <main
                    style={{
                        minHeight: "100vh",
                        backgroundColor: "#000000",
                        color: "#ffffff",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-start",
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: 480,
                        }}
                    >
                        <TopHeader />

                        <section style={{ padding: "12px 4px 8px" }}>
                            <h1
                                style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    marginBottom: 8,
                                }}
                            >
                                画像の保存方法（iPhone）
                            </h1>
                            <p
                                style={{
                                    fontSize: 12,
                                    color: "#e5e7eb",
                                    lineHeight: 1.6,
                                    marginBottom: 12,
                                }}
                            >
                                下に表示されている画像を保存するには、次の手順を行ってください。
                            </p>

                            <ol
                                style={{
                                    fontSize: 12,
                                    color: "#d1d5db",
                                    lineHeight: 1.6,
                                    paddingLeft: 18,
                                    marginBottom: 16,
                                }}
                            >
                                <li>画面下（または上）の共有ボタンをタップします。</li>
                                <li>表示されたメニューから「画像を保存」または「写真に保存」を選択します。</li>
                                <li>写真アプリを開き、保存された画像を確認できます。</li>
                            </ol>
                        </section>

                        <section
                            style={{
                                border: "1px solid #ffffff",
                                backgroundColor: "#111111",
                                padding: 8,
                                borderRadius: 8,
                                marginBottom: 16,
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    backgroundColor: "#000000",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <img
                                    src={finalUrl}
                                    alt="保存する画像"
                                    style={{
                                        width: "100%",
                                        height: "auto",
                                        objectFit: "contain",
                                    }}
                                />
                            </div>
                        </section>

                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setIosSaveMode(false)}
                                style={{
                                    flex: 1,
                                    padding: "8px 0",
                                    borderRadius: 999,
                                    border: "1px solid #ffffff",
                                    backgroundColor: "#000000",
                                    color: "#ffffff",
                                    fontSize: 12,
                                    cursor: "pointer",
                                }}
                            >
                                戻る（編集画面に戻る）
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                style={{
                                    flex: 1,
                                    padding: "8px 0",
                                    borderRadius: 999,
                                    border: "1px solid #ffffff",
                                    backgroundColor: "#111827",
                                    color: "#ffffff",
                                    fontSize: 12,
                                    cursor: "pointer",
                                }}
                            >
                                最初から作り直す
                            </button>
                        </div>

                        <p
                            style={{
                                fontSize: 11,
                                color: "#9ca3af",
                                marginTop: 10,
                            }}
                        >
                            ※このページは iPhone 用のガイドです。画像の保存は、共有メニューから行ってください。
                        </p>
                    </div>
                </main>
                <MenuOverlay />
            </>
        );
    }

    /* ===== モバイルレイアウト ===== */
    const renderMobile = () => {
        const phoneWidth = "100%";

        return (
            <main
                style={{
                    minHeight: "100vh",
                    backgroundColor: "#000000",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    padding: 0,
                }}
            >
                <div
                    style={{
                        width: phoneWidth,
                        maxWidth: 480,
                        backgroundColor: "#000000",
                        color: "#ffffff",
                        borderRadius: 0,
                        boxShadow: "none",
                        paddingBottom: 16,
                    }}
                >
                    <TopHeader />

                    {/* 共通タイトル */}
                    <section
                        style={{
                            padding: "8px 14px 6px",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                marginBottom: 4,
                            }}
                        >
                            冒険フレームジェネレーター
                        </div>
                        <p
                            style={{
                                fontSize: 9,
                                color: "#cccccc",
                                lineHeight: 1.5,
                            }}
                        >
                            写真をアップロードし、「写真集 冒険」のフレームにはめ込んだ画像を生成できます。
                            プレビュー上でドラッグして位置調整も可能です。
                        </p>
                    </section>

                    <StepIndicator current={step} />

                    {/* Step: Upload */}
                    {step === "upload" && (
                        <section style={{ padding: "10px 14px 8px" }}>
                            <div
                                style={{
                                    marginBottom: 6,
                                    fontSize: 10,
                                    fontWeight: 700,
                                }}
                            >
                                Upload
                            </div>

                            <div
                                style={{
                                    border: "1px solid #ffffff",
                                    backgroundColor: "#111111",
                                    height: 200,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 9,
                                    marginBottom: 6,
                                    padding: 4,
                                }}
                            >
                                {photoUrl ? (
                                    <img
                                        src={photoUrl}
                                        alt="uploaded"
                                        style={{
                                            maxWidth: "100%",
                                            maxHeight: "100%",
                                            objectFit: "contain",
                                        }}
                                    />
                                ) : (
                                    <span>ここに選択した画像が表示される</span>
                                )}
                            </div>
                            <label
                                style={{
                                    display: "inline-block",
                                    padding: "4px 10px",
                                    borderRadius: 999,
                                    border: "1px solid #ffffff",
                                    fontSize: 9,
                                    cursor: "pointer",
                                    marginRight: 8,
                                }}
                            >
                                画像ファイルを選択
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: "none" }}
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    if (photoUrl) {
                                        setStep("frame");
                                    } else {
                                        alert("先に画像ファイルを選択してください。");
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    padding: "4px 10px",
                                    borderRadius: 999,
                                    border: "1px solid #ffffff",
                                    backgroundColor: "#000000",
                                    color: "#ffffff",
                                    fontSize: 10,
                                    cursor: "pointer",
                                    marginRight: 8,
                                }}
                            >
                                次へ（Frame）
                            </button>
                        </section>
                    )}

                    {/* Step: Frame 選択 */}
                    {step === "frame" && (
                        <section style={{ padding: "10px 14px 10px" }}>
                            <div
                                style={{
                                    marginBottom: 6,
                                    fontSize: 10,
                                    fontWeight: 700,
                                }}
                            >
                                Frame
                            </div>

                            <FrameSelector />

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 8,
                                    marginTop: 10,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setStep("upload")}
                                    style={{
                                        flex: 1,
                                        padding: "5px 0",
                                        borderRadius: 999,
                                        border: "1px solid #ffffff",
                                        backgroundColor: "#000000",
                                        color: "#ffffff",
                                        fontSize: 10,
                                        cursor: "pointer",
                                    }}
                                >
                                    戻る（Upload）
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep("adjust")}
                                    style={{
                                        flex: 1,
                                        padding: "5px 0",
                                        borderRadius: 999,
                                        border: "1px solid #ffffff",
                                        backgroundColor: "#ffffff",
                                        color: "#000000",
                                        fontSize: 10,
                                        cursor: "pointer",
                                    }}
                                >
                                    次へ（Adjust）
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Step: Adjust */}
                    {step === "adjust" && (
                        <section style={{ padding: "10px 14px 10px" }}>
                            <div
                                style={{
                                    marginBottom: 6,
                                    fontSize: 10,
                                    fontWeight: 700,
                                }}
                            >
                                Adjust
                            </div>

                            <div
                                style={{
                                    border: "1px solid #ffffff",
                                    backgroundColor: "#111111",
                                    marginBottom: 6,
                                    padding: 4,
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        aspectRatio: "4 / 5",
                                        backgroundColor: "#000000",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <canvas
                                        ref={canvasRef}
                                        onPointerDown={handlePointerDown}
                                        onPointerMove={handlePointerMove}
                                        onPointerUp={endDrag}
                                        onPointerCancel={endDrag}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            display: "block",
                                            cursor:
                                                step === "adjust" && photoUrl
                                                    ? "grab"
                                                    : "default",
                                        }}
                                    />
                                </div>
                            </div>

                            <p
                                style={{
                                    fontSize: 9,
                                    color: "#cccccc",
                                    marginBottom: 8,
                                }}
                            >
                                プレビュー上をドラッグして、写真の位置を調整してください。
                            </p>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 8,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setStep("frame")}
                                    style={{
                                        flex: 1,
                                        padding: "5px 0",
                                        borderRadius: 999,
                                        border: "1px solid #ffffff",
                                        backgroundColor: "#000000",
                                        color: "#ffffff",
                                        fontSize: 10,
                                        cursor: "pointer",
                                    }}
                                >
                                    戻る（Frame）
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep("done")}
                                    style={{
                                        flex: 1,
                                        padding: "5px 0",
                                        borderRadius: 999,
                                        border: "1px solid #ffffff",
                                        backgroundColor: "#ffffff",
                                        color: "#000000",
                                        fontSize: 10,
                                        cursor: "pointer",
                                    }}
                                >
                                    次へ（Done）
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Step: Done */}
                    {step === "done" && (
                        <section style={{ padding: "10px 14px 10px" }}>
                            <div
                                style={{
                                    marginBottom: 6,
                                    fontSize: 10,
                                    fontWeight: 700,
                                }}
                            >
                                Done
                            </div>

                            <div
                                style={{
                                    border: "1px solid #ffffff",
                                    backgroundColor: "#111111",
                                    padding: 4,
                                    marginBottom: 10,
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        aspectRatio: "4 / 5",
                                        backgroundColor: "#000000",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    {finalUrl ? (
                                        <img
                                            src={finalUrl}
                                            alt="final"
                                            style={{
                                                maxWidth: "100%",
                                                maxHeight: "100%",
                                                objectFit: "contain",
                                            }}
                                        />
                                    ) : (
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color: "#bbbbbb",
                                            }}
                                        >
                                            完成品
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 8,
                                    marginBottom: 6,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setStep("adjust")}
                                    style={{
                                        flex: 1,
                                        padding: "6px 0",
                                        borderRadius: 999,
                                        border: "1px solid #ffffff",
                                        backgroundColor: "#000000",
                                        color: "#ffffff",
                                        fontSize: 10,
                                        cursor: "pointer",
                                    }}
                                >
                                    戻る（Adjust）
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    disabled={!canDownload}
                                    style={{
                                        flex: 1,
                                        padding: "6px 0",
                                        borderRadius: 999,
                                        border: "1px solid #ffffff",
                                        backgroundColor: canDownload ? "#ffffff" : "#444444",
                                        color: canDownload ? "#000000" : "#aaaaaa",
                                        fontSize: 10,
                                        cursor: canDownload ? "pointer" : "not-allowed",
                                    }}
                                >
                                    ダウンロード
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleReset}
                                style={{
                                    width: "100%",
                                    padding: "6px 0",
                                    borderRadius: 999,
                                    border: "1px solid #ffffff",
                                    backgroundColor: "#000000",
                                    color: "#ffffff",
                                    fontSize: 10,
                                    cursor: "pointer",
                                }}
                            >
                                もう一度作る
                            </button>
                        </section>
                    )}
                </div>
            </main>
        );
    };

    /* ===== PC レイアウト ===== */
    const renderDesktop = () => {
        return (
            <main
                style={{
                    minHeight: "100vh",
                    backgroundColor: "#555555",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    padding: 24,
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: 960,
                        backgroundColor: "#000000",
                        color: "#ffffff",
                        borderRadius: 6,
                        boxShadow: "0 0 0 1px #444444",
                        paddingBottom: 20,
                    }}
                >
                    <TopHeader />

                    <section
                        style={{
                            padding: "10px 18px 6px",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 14,
                                fontWeight: 700,
                                marginBottom: 4,
                            }}
                        >
                            冒険フレームジェネレーター
                        </div>
                        <p
                            style={{
                                fontSize: 11,
                                color: "#cccccc",
                                lineHeight: 1.6,
                                maxWidth: 640,
                            }}
                        >
                            写真をアップロードし、「写真集 冒険」のフレームにはめ込んだ画像を生成できます。
                            ステップに沿って位置調整・ダウンロードを行ってください。
                        </p>
                    </section>

                    <StepIndicator current={step} />

                    <section
                        style={{
                            padding: "14px 18px 0",
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)",
                                gap: 20,
                                alignItems: "flex-start",
                            }}
                        >
                            {/* 左：ステップごとのUI */}
                            <div>
                                {step === "upload" && (
                                    <div>
                                        <h2
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                marginBottom: 6,
                                            }}
                                        >
                                            Step 1: 写真をアップロード
                                        </h2>
                                        <p
                                            style={{
                                                fontSize: 11,
                                                color: "#d1d5db",
                                                marginBottom: 10,
                                            }}
                                        >
                                            JPEG / PNG などの画像ファイルを選択してください。
                                            選択した画像はブラウザ内だけで処理され、サーバには送信されません。
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (photoUrl) {
                                                    setStep("frame");
                                                } else {
                                                    alert("先に画像ファイルを選択してください。");
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: "4px 10px",
                                                borderRadius: 999,
                                                border: "1px solid #ffffff",
                                                backgroundColor: "#000000",
                                                color: "#ffffff",
                                                fontSize: 10,
                                                cursor: "pointer",
                                                marginRight: 8,
                                            }}
                                        >
                                            次へ（Frame）
                                        </button>
                                        <label
                                            style={{
                                                display: "inline-block",
                                                padding: "6px 14px",
                                                borderRadius: 999,
                                                border: "1px solid #ffffff",
                                                fontSize: 11,
                                                cursor: "pointer",
                                            }}
                                        >
                                            画像ファイルを選択
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                style={{ display: "none" }}
                                            />
                                        </label>
                                        <p
                                            style={{
                                                fontSize: 10,
                                                color: "#9ca3af",
                                                marginTop: 8,
                                            }}
                                        >
                                            選択後、フレーム選択ステップへ進みます。
                                        </p>
                                    </div>
                                )}

                                {step === "frame" && (
                                    <div>
                                        <h2
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                marginBottom: 6,
                                            }}
                                        >
                                            Step 2: フレームを選択
                                        </h2>
                                        <p
                                            style={{
                                                fontSize: 11,
                                                color: "#d1d5db",
                                                marginBottom: 10,
                                            }}
                                        >
                                            使用したいフレームを選んでください。
                                            右側のプレビューで、選択したフレームの見た目を確認できます。
                                        </p>

                                        <FrameSelector />

                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: 10,
                                                marginTop: 12,
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setStep("upload")}
                                                style={{
                                                    flex: 1,
                                                    padding: "6px 0",
                                                    borderRadius: 999,
                                                    border: "1px solid #ffffff",
                                                    backgroundColor: "#000000",
                                                    color: "#ffffff",
                                                    fontSize: 11,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                戻る（Upload）
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStep("adjust")}
                                                style={{
                                                    flex: 1,
                                                    padding: "6px 0",
                                                    borderRadius: 999,
                                                    border: "1px solid #ffffff",
                                                    backgroundColor: "#ffffff",
                                                    color: "#000000",
                                                    fontSize: 11,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                次へ（Adjust）
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === "adjust" && (
                                    <div>
                                        <h2
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                marginBottom: 6,
                                            }}
                                        >
                                            Step 3: 写真の位置を調整
                                        </h2>
                                        <p
                                            style={{
                                                fontSize: 11,
                                                color: "#d1d5db",
                                                marginBottom: 10,
                                            }}
                                        >
                                            右側のプレビュー上でドラッグし、写真の見せたい部分がフレーム内に入るように調整してください。
                                        </p>

                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: 10,
                                                marginTop: 12,
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setStep("frame")}
                                                style={{
                                                    flex: 1,
                                                    padding: "6px 0",
                                                    borderRadius: 999,
                                                    border: "1px solid #ffffff",
                                                    backgroundColor: "#000000",
                                                    color: "#ffffff",
                                                    fontSize: 11,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                戻る（Frame）
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStep("done")}
                                                style={{
                                                    flex: 1,
                                                    padding: "6px 0",
                                                    borderRadius: 999,
                                                    border: "1px solid #ffffff",
                                                    backgroundColor: "#ffffff",
                                                    color: "#000000",
                                                    fontSize: 11,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                次へ（Done）
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === "done" && (
                                    <div>
                                        <h2
                                            style={{
                                                fontSize: 13,
                                                fontWeight: 700,
                                                marginBottom: 6,
                                            }}
                                        >
                                            Step 4: ダウンロード
                                        </h2>
                                        <p
                                            style={{
                                                fontSize: 11,
                                                color: "#d1d5db",
                                                marginBottom: 10,
                                            }}
                                        >
                                            完成したフレーム付き画像を PNG としてダウンロードできます。
                                        </p>

                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                gap: 10,
                                                marginBottom: 10,
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setStep("adjust")}
                                                style={{
                                                    flex: 1,
                                                    padding: "6px 0",
                                                    borderRadius: 999,
                                                    border: "1px solid #ffffff",
                                                    backgroundColor: "#000000",
                                                    color: "#ffffff",
                                                    fontSize: 11,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                戻る（Adjust）
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDownload}
                                                disabled={!canDownload}
                                                style={{
                                                    flex: 1,
                                                    padding: "6px 0",
                                                    borderRadius: 999,
                                                    border: "1px solid #ffffff",
                                                    backgroundColor: canDownload ? "#ffffff" : "#444444",
                                                    color: canDownload ? "#000000" : "#aaaaaa",
                                                    fontSize: 11,
                                                    cursor: canDownload ? "pointer" : "not-allowed",
                                                }}
                                            >
                                                ダウンロード
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            style={{
                                                width: "100%",
                                                padding: "6px 0",
                                                borderRadius: 999,
                                                border: "1px solid #ffffff",
                                                backgroundColor: "#000000",
                                                color: "#ffffff",
                                                fontSize: 11,
                                                cursor: "pointer",
                                            }}
                                        >
                                            もう一度作る
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 右：プレビュー（Adjust 以外も表示） */}
                            <div>
                                <div
                                    style={{
                                        border: "1px solid #ffffff",
                                        backgroundColor: "#111111",
                                        padding: 8,
                                        marginBottom: 10,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "100%",
                                            aspectRatio: "4 / 5",
                                            backgroundColor: "#000000",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <canvas
                                            ref={canvasRef}
                                            onPointerDown={handlePointerDown}
                                            onPointerMove={handlePointerMove}
                                            onPointerUp={endDrag}
                                            onPointerCancel={endDrag}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                display: "block",
                                                cursor:
                                                    step === "adjust" && photoUrl ? "grab" : "default",
                                                pointerEvents: step === "adjust" ? "auto" : "none",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        );
    };

    return (
        <>
            {isMobile ? renderMobile() : renderDesktop()}
            <MenuOverlay />
        </>
    );
}
