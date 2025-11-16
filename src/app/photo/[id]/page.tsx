"use client";

import { useRouter, useParams } from "next/navigation";
import { PHOTOS } from "@/components/photoData";

export default function PhotoDetailPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const photo = PHOTOS.find((p) => p.id === id);

    if (!photo) {
        return (
            <main className="grid min-h-screen place-items-center bg-black text-white">
                <p className="text-white/80">写真が見つかりません。</p>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen bg-black text-white overflow-hidden">
            {/* 背景暗転フェード */}
            <div className="absolute inset-0 bg-black opacity-0 fade-in-overlay" />

            {/* 画像カード */}
            <section className="relative z-10 flex min-h-screen items-center justify-center p-4 md:p-10">
                <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white/5 shadow-2xl ring-1 ring-white/10 backdrop-blur
                        opacity-0 translate-y-3 scale-[0.985] card-animate">
                    <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-0 md:gap-6">
                        <div className="relative aspect-[3/2] md:aspect-auto md:h-[68vh]">
                            <img
                                src={photo.src}
                                alt={photo.title}
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col gap-4 p-5 md:p-6">
                            <h1 className="text-2xl md:text-3xl font-semibold">{photo.title}</h1>
                            {photo.caption && (
                                <p className="text-white/80 leading-relaxed">{photo.caption}</p>
                            )}
                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-white/70">
                                {photo.location && (
                                    <div>
                                        <div className="text-white/50">Location</div>
                                        <div>{photo.location}</div>
                                    </div>
                                )}
                                {photo.date && (
                                    <div>
                                        <div className="text-white/50">Date</div>
                                        <div>{photo.date}</div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-auto pt-4">
                                <button
                                    onClick={() => router.back()}
                                    className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition"
                                >
                                    戻る
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}
