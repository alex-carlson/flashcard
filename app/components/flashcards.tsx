"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { motion, useDragControls } from "framer-motion";

const SHEET_ID = process.env.NEXT_PUBLIC_SHEET_ID;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

interface Sheet {
    properties: {
        title: string;
    };
}

interface SheetData {
    sheets: Sheet[];
}


const fetcher = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch data");
    return response.json();
};

export default function Flashcards() {
    const { data: sheetData, error: sheetError } = useSWR(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`,
        fetcher
    );
    const sheetNames = (sheetData as SheetData)?.sheets?.map((sheet) => sheet.properties.title) || [];

    const [selectedSheet, setSelectedSheet] = useState<string | null>(sheetNames[0] || null);

    const { data: flashcardData, error: flashcardsError } = useSWR(
        selectedSheet
            ? `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${selectedSheet}!A:B?key=${API_KEY}`
            : null,
        fetcher
    );
    const flashcards = flashcardData?.values?.slice(1) || [];

    const [index, setIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const controls = useDragControls();

    if (sheetError || flashcardsError) return <div>Error loading data</div>;
    if (!sheetData) return <div>Loading sheets...</div>;

    function isValidUrl(string: string) {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }

    return (
        <>
            <div className="p-4 shadow-md text-center bg-white text-black">
                <select onChange={(e) => setSelectedSheet(e.target.value)} value={selectedSheet || ""}>
                    {sheetNames.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="relative flex items-center justify-center p-4">
                <div className="w-96 aspect-square perspective-1000">
                    {flashcards[index] ? (
                        <motion.div
                            className="relative w-full h-full"
                            animate={{ rotateY: showAnswer ? 180 : 0 }}
                            transition={{ duration: 0.5 }}
                            drag="x"
                            dragControls={controls}
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={(event, info) => {
                                if (info.offset.x > 50 || info.offset.x < -50) {
                                    setShowAnswer(!showAnswer);
                                }
                            }}
                        >
                            <div className="absolute w-full h-full">
                                <Card className="p-4 text-center w-full h-full">
                                    <CardContent className="flex items-center justify-center w-full h-full overflow-hidden">
                                        {isValidUrl(flashcards[index][0]) ? (
                                            <img
                                                src={flashcards[index][0]}
                                                alt="flashcard"
                                                className="max-h-96 pointer-events-none select-none"
                                                draggable="false"
                                            />
                                        ) : (
                                            <h2 className="text-xl font-bold">{flashcards[index][0]}</h2>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {showAnswer && (
                                <div className="absolute w-full h-full backface-hidden rotateY-180">
                                    <Card className="p-4 text-center w-full h-full relative">
                                        <CardContent className="absolute inset-0 flex items-center justify-center w-full h-full overflow-hidden">
                                            <p className="text-xl font-bold" style={{ transform: "rotateY(180deg)" }}>
                                                {flashcards[index][1]}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="text-center text-gray-500">Loading flashcards...</div>
                    )}
                </div>

                <div className="fixed bottom-20 flex justify-center w-full text-center">
                    <Button onClick={() => setIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)} className="mr-4 bg-yellow-500 text-black hover:bg-yellow-200">
                        Prev
                    </Button>
                    <Button onClick={() => setIndex(Math.floor(Math.random() * flashcards.length))} className="mx-4 bg-yellow-500 text-black hover:bg-yellow-200">
                        Shuffle
                    </Button>
                    <Button onClick={() => setIndex((prev) => (prev + 1) % flashcards.length)} className="ml-4 bg-yellow-500 text-black hover:bg-yellow-200">
                        Next
                    </Button>
                </div>
            </div>
        </>
    );
}
