"use client";

import type React from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ========= 共通：2桁ゼロ埋め ========= */
const pad2 = (n: number) => n.toString().padStart(2, "0");

/* ========= ArrowButton ========= */

type ArrowButtonProps = {
    direction: "left" | "right";
    disabled?: boolean;
    onClick: () => void;
};

const ArrowButton: React.FC<ArrowButtonProps> = ({
    direction,
    disabled,
    onClick,
}) => {
    const isLeft = direction === "left";

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={disabled ? undefined : onClick}
            className="disabled:opacity-40 disabled:cursor-default"
        >
            {/* カウンタと同じ幅に揃える */}
            <div className="flex items-center w-[72px]">
                {isLeft ? (
                    <>
                        {/* 三角形：サイズは固定 */}
                        <div className="w-0 h-0 border-r-[6px] border-y-[4px] border-transparent border-r-white" />
                        {/* 棒線：残りスペース全部に伸ばす */}
                        <div className="h-[1px] flex-1 bg-white ml-1" />
                    </>
                ) : (
                    <>
                        <div className="h-[1px] flex-1 bg-white mr-1" />
                        <div className="w-0 h-0 border-l-[6px] border-y-[4px] border-transparent border-l-white" />
                    </>
                )}
            </div>
        </button>
    );
};

/* ========= PageIndicator ========= */

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
        <div className="flex items-center gap-2 text-[0.8rem] md:text-sm">
            <ArrowButton direction="left" disabled={!canPrev} onClick={onPrev} />

            {/* 白い枠：幅固定。文字間を変えても長さは変わらない */}
            <div className="bg-white text-black rounded-md px-3 py-1 w-[72px] flex items-center justify-center">
                <span className="flex items-center">
                    {/* 数字の字間をギュッと詰める */}
                    <span className="tabular-nums tracking-[-0.1em] text-lg font-bold">
                        {pad2(current)}
                    </span>
                    <span className="mx-[0.15em] text-base">/</span>
                    <span className="tabular-nums tracking-[-0.1em] text-base opacity-70">
                        {pad2(total)}
                    </span>
                </span>
            </div>

            <ArrowButton direction="right" disabled={!canNext} onClick={onNext} />
        </div>
    );
};

/* ========= 下部の黒帯（ペンネーム＋タイトル帯含む） ========= */

type BottomBarProps = {
    currentIdx: number;
    total: number;
    penLabel: string;    // 「Pen Name」や「ペンネーム」
    penTitleEn: string;  // 英語タイトル
    titleJa: string;     // 日本語タイトル
    onPrev: () => void;
    onNext: () => void;
};

export const PhotoBottomBar: React.FC<BottomBarProps> = ({
    currentIdx,
    total,
    penLabel,
    penTitleEn,
    titleJa,
    onPrev,
    onNext,
}) => {
    return (
        <div className="w-full bg-black/95 md:bg-black/90 md:rounded-none shadow-2xl">
            <div className="relative mx-auto w-full max-w-[480px] md:max-w-5xl px-4 pt-2 pb-3 md:px-8 md:pt-5 md:pb-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIdx} // 写真が変わるたびにフェード
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                    >
                        {/* 上段：Pen Name + カウンタ */}
                        <div className="flex items-end justify-between pb-3 md:pb-2">
                            <div className="space-y-0.5">
                                <div className="inline-block text-white text-xs md:text-sm font-normal px-1 py-0.5 rounded-sm">
                                    {penLabel}
                                </div>
                                <div className="text-2xl md:text-base font-semibold text-white">
                                    {penTitleEn}
                                </div>
                            </div>

                            <PageIndicator
                                current={currentIdx + 1}
                                total={total}
                                canPrev={currentIdx > 0}
                                canNext={currentIdx < total - 1}
                                onPrev={onPrev}
                                onNext={onNext}
                            />
                        </div>

                        {/* 下段：日本語のペンネーム帯＋タイトル帯（縦並び・白帯は文字分だけ） */}
                        <div className="mt-3 md:mt-4 flex flex-col space-y-1">
                            {/* 白帯1：ペンネームラベル（文字分だけ） */}
                            <div>
                                <span className="inline-block bg-white text-black px-2 py-0.5 rounded text-xs md:text-sm font-normal leading-tight">
                                    {penLabel}
                                </span>
                            </div>

                            {/* 白帯2：日本語タイトル（文字分だけ） */}
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                                <span className="inline-block bg-white text-black px-2 py-1 rounded">
                                    {titleJa}
                                </span>
                            </h1>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
