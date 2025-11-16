"use client";
import React from "react";
import { useEffect, useRef, useState } from "react";

/* ===================== i18n ===================== */
type Locale = "ja" | "en";
const MESSAGES: Record<Locale, Record<string, string>> = {
    ja: {
        badge: "Photo Frame Lab",
        title: "冒険フレーム ジェネレーター",
        lead1: "写真をアップロードして、写真集「冒険」のフレームにはめ込んだ画像を生成できます。",
        lead2: "プレビュー上でドラッグして位置を調整できます。",
        step: "Step",
        step1: "写真をアップロード",
        step1_hint:
            "JPEG / PNG など。選択した画像はブラウザ内だけで処理され、サーバには送信されません。",
        chooseImage: "画像ファイルを選択",
        step2: "フレームを選択",
        step3_mobile_title: "プレビュー ＆ ダウンロード",
        step3_pc_title: "画像をダウンロード",
        step3_desc_mobile:
            "プレビュー上の画像を指でドラッグすると、写真の表示位置を調整できます。出力サイズは 1080×1350px の PNG です。",
        step3_desc_pc:
            "実際の出力と同じ比率で表示されます。プレビュー上をドラッグして、写真の位置を微調整できます。",
        btn_download_ready: "この画像を保存する",
        btn_download_ready_pc: "合成画像をダウンロード",
        btn_downloading: "描画中…",
        output_format: "出力形式：PNG（フレーム付き、1080×1350px）",
        no_photo_mobile:
            "まだ写真が選択されていません。上の「写真をアップロード」から画像を選んでください。",
        no_photo_pc:
            "まだ写真が選択されていません。左側の「写真をアップロード」から画像を選んでください。",
        footer: "写真は端末内のみで処理されます／Powered by Next.js & Canvas",
        using_frame: "使用フレーム：",
        lang_toggle: "EN",
        frame_label: "冒険フレーム",
    },
    en: {
        badge: "Photo Frame Lab",
        title: "Adventure Frame Generator",
        lead1:
            'Upload a photo and generate an image framed with the "Adventure" design.',
        lead2: "Drag on the preview to adjust the photo position.",
        step: "Step",
        step1: "Upload a Photo",
        step1_hint:
            "JPEG / PNG, etc. Your image is processed locally in the browser and never uploaded to the server.",
        chooseImage: "Choose Image File",
        step2: "Select a Frame",
        step3_mobile_title: "Preview & Download",
        step3_pc_title: "Download",
        step3_desc_mobile:
            "Drag on the preview to reposition your photo. Output image is PNG 1080×1350.",
        step3_desc_pc:
            "Preview shows the final aspect ratio. Drag to fine-tune the photo position.",
        btn_download_ready: "Save This Image",
        btn_download_ready_pc: "Download Composited Image",
        btn_downloading: "Rendering…",
        output_format: "Output: PNG with frame (1080×1350)",
        no_photo_mobile:
            'No photo selected yet. Use "Upload a Photo" above to choose one.',
        no_photo_pc:
            'No photo selected yet. Use "Upload a Photo" on the left to choose one.',
        footer: "All processing happens locally • Powered by Next.js & Canvas",
        using_frame: "Frame: ",
        lang_toggle: "日本語",
        frame_label: "Adventure Frame",
    },
};

/* ===================== Frames ===================== */
type Frame = {
    id: string;
    src: string;
    labelKey: string;
};

const FRAMES: Frame[] = [
    { id: "frame1", src: "/frames/frame1.png", labelKey: "frame_label" },
];

/* ============ Responsive (mobile detection) ============ */
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
            mq.addListener(update);
            return () => mq.removeListener(update);
        }
    }, [breakpoint]);
    return isMobile;
}

type Offset = { x: number; y: number };

export default function HomePage() {
    /* ===== i18n ===== */
    const [locale, setLocale] = useState<Locale>("ja");
    const t = (key: string) => MESSAGES[locale][key] ?? key;

    // 初期言語をブラウザ設定から推定
    useEffect(() => {
        if (typeof navigator === "undefined") return;
        const lang = (navigator.language || "ja").toLowerCase();
        setLocale(lang.startsWith("en") ? "en" : "ja");
    }, []);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const photoImageRef = useRef<HTMLImageElement | null>(null);
    const frameImageRef = useRef<HTMLImageElement | null>(null);

    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [selectedFrame, setSelectedFrame] = useState<Frame | null>(FRAMES[0]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // 写真の位置オフセット（ドラッグで動かす）
    const [photoOffset, setPhotoOffset] = useState<Offset>({ x: 0, y: 0 });

    // ドラッグ状態を保持
    const dragStateRef = useRef<{
        dragging: boolean;
        startX: number;
        startY: number;
        startOffsetX: number;
        startOffsetY: number;
    } | null>(null);

    const isMobile = useIsMobile();

    // アップロード画像URLのクリーンアップ
    useEffect(() => {
        return () => {
            if (photoUrl) URL.revokeObjectURL(photoUrl);
        };
    }, [photoUrl]);

    // 画像を読み込む
    useEffect(() => {
        if (!photoUrl || !selectedFrame) {
            setIsLoaded(false);
            setIsDrawing(false);
            return;
        }

        const loadImage = (src: string): Promise<HTMLImageElement> =>
            new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = (err) => reject(err);
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

                // 画像/フレームを変えたら位置をリセット
                setPhotoOffset({ x: 0, y: 0 });
                setIsLoaded(true);
            } catch (e) {
                console.error("画像の読み込みに失敗しました", e);
                alert(
                    locale === "ja"
                        ? "画像の読み込みに失敗しました。フレーム画像のパスやファイルを確認してください。"
                        : "Failed to load image. Please check the frame image path/file."
                );
                setIsLoaded(false);
            } finally {
                if (!cancelled) setIsDrawing(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [photoUrl, selectedFrame, locale]);

    // 描画関数
    const draw = () => {
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

        // 1. フレーム
        ctx.drawImage(frameImg, 0, 0, frameWidth, frameHeight);

        // 2. 白い枠領域（フレーム画像依存・調整可）
        const innerX = 41;
        const innerY = 41;
        const innerWidth = 998;
        const innerHeight = 1009;

        // 3. クリッピング
        ctx.save();
        ctx.beginPath();
        ctx.rect(innerX, innerY, innerWidth, innerHeight);
        ctx.clip();

        // 4. coverでフィット
        const scale = Math.max(innerWidth / photoImg.width, innerHeight / photoImg.height);
        const drawWidth = photoImg.width * scale;
        const drawHeight = photoImg.height * scale;

        // 中央基準 + ドラッグオフセット
        const baseX = innerX + (innerWidth - drawWidth) / 2;
        const baseY = innerY + (innerHeight - drawHeight) / 2;
        const offsetX = baseX + photoOffset.x;
        const offsetY = baseY + photoOffset.y;

        // 5. 写真描画
        ctx.drawImage(photoImg, offsetX, offsetY, drawWidth, drawHeight);

        // 6. 解除
        ctx.restore();
    };

    // 再描画
    useEffect(() => {
        if (!isLoaded) return;
        draw();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, photoOffset]);

    // 画像選択
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPhotoUrl(url);
    };

    // ダウンロード
    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "framed_photo.png";
                a.click();
                URL.revokeObjectURL(url);
            },
            "image/png",
            1.0
        );
    };

    const canDownload = !!photoUrl && !!selectedFrame && isLoaded && !isDrawing;

    /* ===== ドラッグ操作（Pointer Events） ===== */
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!photoUrl || !isLoaded) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.setPointerCapture(e.pointerId);
        dragStateRef.current = {
            dragging: true,
            startX: e.clientX,
            startY: e.clientY,
            startOffsetX: photoOffset.x,
            startOffsetY: photoOffset.y,
        };
    };
    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const st = dragStateRef.current;
        if (!st || !st.dragging) return;
        const dx = e.clientX - st.startX;
        const dy = e.clientY - st.startY;
        setPhotoOffset({ x: st.startOffsetX + dx, y: st.startOffsetY + dy });
    };
    const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        dragStateRef.current = null;
        if (canvas) {
            try {
                canvas.releasePointerCapture(e.pointerId);
            } catch { }
        }
    };

    /* ===================== UI ===================== */

    // 共通ヘッダー（右上言語トグル付き）
    const Header = ({ compact = false }: { compact?: boolean }) => (
        <header style={{ padding: compact ? "4px 4px 8px" : 0, position: "relative" }}>
            <button
                type="button"
                onClick={() => setLocale((prev) => (prev === "ja" ? "en" : "ja"))}
                aria-label="toggle language"
                style={{
                    position: "absolute",
                    top: compact ? 4 : 8,
                    right: compact ? 6 : 12,
                    padding: compact ? "8px 14px" : "10px 20px",
                    borderRadius: 999,
                    border: "2px solid rgba(14,165,233,0.6)",
                    background: "linear-gradient(135deg, #e0f2fe, #bae6fd)",
                    color: "#0369a1",
                    fontSize: compact ? 14 : 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    transition: "transform 0.15s ease",
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
            >
                🌐 {t("lang_toggle")}
            </button>

            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px",
                    borderRadius: 999,
                    backgroundColor: "rgba(15, 118, 110, 0.08)",
                    color: "#0f766e",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                }}
            >
                <span>{t("badge")}</span>
            </div>
            <h1
                style={{
                    marginTop: 10,
                    marginBottom: 4,
                    fontSize: compact ? 20 : 28,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                }}
            >
                {t("title")}
            </h1>
            <p
                style={{
                    fontSize: compact ? 12 : 13,
                    color: "#6b7280",
                    lineHeight: 1.5,
                    maxWidth: 520,
                }}
            >
                {t("lead1")} {t("lead2")}
            </p>
        </header>
    );


    if (isMobile) {
        /* ======== スマホ用レイアウト ======== */
        return (
            <main
                style={{
                    minHeight: "100vh",
                    background:
                        "radial-gradient(circle at 0% 0%, #fef3c7 0, #f5f5f5 40%, #e5e7eb 100%)",
                    display: "flex",
                    justifyContent: "center",
                    padding: "16px",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: 480,
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}
                >
                    <Header compact />

                    {/* Step 1 */}
                    <section
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: 16,
                            padding: 14,
                            boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
                            border: "1px solid rgba(148, 163, 184, 0.25)",
                        }}
                    >
                        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#9ca3af", marginBottom: 4 }}>
                            {t("step")} 1
                        </div>
                        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{t("step1")}</h2>
                        <label
                            style={{
                                display: "block",
                                padding: "14px 12px",
                                borderRadius: 14,
                                border: "1px dashed #d1d5db",
                                background:
                                    "repeating-linear-gradient(135deg,#f9fafb,#f9fafb 10px,#f3f4f6 10px,#f3f4f6 20px)",
                                cursor: "pointer",
                            }}
                        >
                            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{t("chooseImage")}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>{t("step1_hint")}</div>
                            <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                        </label>
                    </section>

                    {/* Step 2 */}
                    <section
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: 16,
                            padding: 14,
                            boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
                            border: "1px solid rgba(148, 163, 184, 0.25)",
                        }}
                    >
                        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#9ca3af", marginBottom: 4 }}>
                            {t("step")} 2
                        </div>
                        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{t("step2")}</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {FRAMES.map((frame) => (
                                <button
                                    key={frame.id}
                                    type="button"
                                    onClick={() => setSelectedFrame(frame)}
                                    style={{
                                        borderRadius: 14,
                                        padding: 6,
                                        border: selectedFrame?.id === frame.id ? "2px solid #0ea5e9" : "1px solid #e5e7eb",
                                        backgroundColor: selectedFrame?.id === frame.id ? "rgba(14,165,233,0.06)" : "#f9fafb",
                                        cursor: "pointer",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "stretch",
                                    }}
                                >
                                    <div style={{ width: "100%", borderRadius: 10, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
                                        <img src={frame.src} alt={t(frame.labelKey)} style={{ width: "100%", height: "auto", display: "block" }} />
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 500, marginTop: 6, textAlign: "left" }}>
                                        {t(frame.labelKey)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Step 3 */}
                    <section
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: 16,
                            padding: 14,
                            boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
                            border: "1px solid rgba(148, 163, 184, 0.25)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#9ca3af", marginBottom: 4 }}>
                                {t("step")} 3
                            </div>
                            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t("step3_mobile_title")}</h2>
                            <p style={{ fontSize: 11, color: "#6b7280" }}>{t("step3_desc_mobile")}</p>
                        </div>

                        <div
                            style={{
                                width: "100%",
                                borderRadius: 14,
                                padding: 10,
                                background:
                                    "linear-gradient(135deg, #f9fafb 0, #eef2ff 50%, #e0f2fe 100%)",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
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
                                    maxHeight: "70vh",
                                    borderRadius: 12,
                                    boxShadow: "0 8px 20px rgba(15,23,42,0.25)",
                                    backgroundColor: "#f3f4f6",
                                    touchAction: "none",
                                }}
                            />
                        </div>

                        {!photoUrl && (
                            <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>{t("no_photo_mobile")}</p>
                        )}

                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={!canDownload}
                            style={{
                                width: "100%",
                                padding: "12px 18px",
                                borderRadius: 999,
                                border: "none",
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: canDownload ? "pointer" : "not-allowed",
                                backgroundColor: canDownload ? "#0f766e" : "#d1d5db",
                                color: "#ffffff",
                                boxShadow: canDownload ? "0 10px 25px rgba(15,118,110,0.35)" : "none",
                            }}
                        >
                            {isDrawing ? t("btn_downloading") : t("btn_download_ready")}
                        </button>
                    </section>

                    <footer style={{ paddingTop: 4, paddingBottom: 8, textAlign: "center", fontSize: 10, color: "#9ca3af" }}>
                        {t("footer")}
                    </footer>
                </div>
            </main>
        );
    }

    /* ======== PC用レイアウト（2カラム） ======== */
    return (
        <main
            style={{
                minHeight: "100vh",
                padding: "40px 24px",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                background:
                    "radial-gradient(circle at 0% 0%, #fef3c7 0, #f5f5f5 40%, #e5e7eb 100%)",
            }}
        >
            <div style={{ width: "100%", maxWidth: 1120, display: "flex", flexDirection: "column", gap: 24 }}>
                <Header />

                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 360px) minmax(0, 1fr)", gap: 24, alignItems: "stretch" }}>
                    {/* Left Panel */}
                    <section
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            backdropFilter: "blur(10px)",
                            padding: "20px 20px 18px",
                            borderRadius: 18,
                            boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
                            border: "1px solid rgba(148, 163, 184, 0.25)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 18,
                        }}
                    >
                        {/* Step 1 */}
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#9ca3af", marginBottom: 4 }}>
                                {t("step")} 1
                            </div>
                            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t("step1")}</h2>
                            <label
                                style={{
                                    display: "block",
                                    padding: "14px 14px",
                                    borderRadius: 14,
                                    border: "1px dashed #d1d5db",
                                    background:
                                        "repeating-linear-gradient(135deg, #f9fafb, #f9fafb 10px, #f3f4f6 10px, #f3f4f6 20px)",
                                    cursor: "pointer",
                                }}
                            >
                                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{t("chooseImage")}</div>
                                <div style={{ fontSize: 11, color: "#6b7280" }}>{t("step1_hint")}</div>
                                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
                            </label>
                        </div>

                        {/* Step 2 */}
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#9ca3af", marginBottom: 4 }}>
                                {t("step")} 2
                            </div>
                            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t("step2")}</h2>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                {FRAMES.map((frame) => (
                                    <button
                                        key={frame.id}
                                        type="button"
                                        onClick={() => setSelectedFrame(frame)}
                                        style={{
                                            borderRadius: 14,
                                            padding: 6,
                                            border: selectedFrame?.id === frame.id ? "2px solid #0ea5e9" : "1px solid #e5e7eb",
                                            backgroundColor: selectedFrame?.id === frame.id ? "rgba(14,165,233,0.06)" : "#f9fafb",
                                            cursor: "pointer",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "stretch",
                                            width: "100%",
                                        }}
                                    >
                                        <div style={{ width: "100%", borderRadius: 10, overflow: "hidden", backgroundColor: "#e5e7eb" }}>
                                            <img src={frame.src} alt={t(frame.labelKey)} style={{ width: "100%", height: "auto", display: "block" }} />
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 500, marginTop: 6, textAlign: "left" }}>
                                            {t(frame.labelKey)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#9ca3af", marginBottom: 4 }}>
                                {t("step")} 3
                            </div>
                            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t("step3_pc_title")}</h2>
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={!canDownload}
                                style={{
                                    width: "100%",
                                    padding: "10px 18px",
                                    borderRadius: 999,
                                    border: "none",
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: canDownload ? "pointer" : "not-allowed",
                                    backgroundColor: canDownload ? "#0f766e" : "#d1d5db",
                                    color: "#ffffff",
                                    boxShadow: canDownload ? "0 10px 25px rgba(15,118,110,0.35)" : "none",
                                }}
                            >
                                {isDrawing ? t("btn_downloading") : t("btn_download_ready_pc")}
                            </button>
                            <p style={{ marginTop: 6, fontSize: 11, color: "#6b7280" }}>{t("output_format")}</p>
                        </div>
                    </section>

                    {/* Right: Preview */}
                    <section
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            backdropFilter: "blur(10px)",
                            padding: 20,
                            borderRadius: 18,
                            boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
                            border: "1px solid rgba(148, 163, 184, 0.25)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 14,
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <div>
                                <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>Preview</h2>
                                <p style={{ fontSize: 12, color: "#6b7280" }}>{t("step3_desc_pc")}</p>
                            </div>
                            {selectedFrame && (
                                <span style={{ fontSize: 11, color: "#9ca3af" }}>
                                    {t("using_frame")}
                                    {t(selectedFrame.labelKey)}
                                </span>
                            )}
                        </div>

                        <div
                            style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background:
                                    "linear-gradient(135deg, #f9fafb 0, #eef2ff 50%, #e0f2fe 100%)",
                                borderRadius: 14,
                                padding: 12,
                            }}
                        >
                            <canvas
                                ref={canvasRef}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={endDrag}
                                onPointerCancel={endDrag}
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "80vh",
                                    borderRadius: 12,
                                    boxShadow: "0 12px 30px rgba(15,23,42,0.25)",
                                    backgroundColor: "#f3f4f6",
                                    touchAction: "none",
                                    cursor: photoUrl ? "grab" : "default",
                                }}
                            />
                        </div>

                        {!photoUrl && (
                            <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>{t("no_photo_pc")}</p>
                        )}
                    </section>
                </div>

                <footer style={{ paddingTop: 8, textAlign: "center", fontSize: 10, color: "#9ca3af" }}>{t("footer")}</footer>
            </div>
        </main>
    );
}