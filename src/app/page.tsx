"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, useDragControls } from "framer-motion";
import creds from "@/app/creds.json";

const SHEET_ID = creds.SHEET_ID;
const API_KEY = creds.API_KEY;
const RANGE = "Sheet1!A:B"; // Adjust based on your sheet structure

const fetchFlashcards = async () => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch data");
    const data = await response.json();
    return data.values ? data.values.slice(1) : [];
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return null;
  }
};

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<[string, string][] | null>(null);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const controls = useDragControls();

  useEffect(() => {
    fetchFlashcards().then(setFlashcards);
  }, []);

  const nextCard = () => {
    setShowAnswer(false);
    setIndex((prev) => (prev + 1) % (flashcards?.length || 1));
  };

  const prevCard = () => {
    setShowAnswer(false);
    setIndex((prev) => (prev - 1 + (flashcards?.length || 1)) % (flashcards?.length || 1));
  };

  const shuffleCards = () => {
    if (flashcards) {
      const shuffledIndex = Math.floor(Math.random() * flashcards.length);
      setIndex(shuffledIndex);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {flashcards === null ? (
        <p className="text-red-500">Error loading flashcards. Please try again later.</p>
      ) : flashcards.length === 0 ? (
        <p className="text-gray-500">No flashcards available.</p>
      ) : (
        <div className="w-96 perspective-1000">
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
            {/* Front card (question) */}
            <div className="absolute w-full backface-hidden aspect-w-2 aspect-h-1">
              <Card className="p-4 text-center">
                <CardContent>
                  {isValidUrl(flashcards[index][0]) ? (
                    <img src={flashcards[index][0]} alt="Flashcard" className="w-full h-auto select-none" />
                  ) : (
                    <h2 className="text-xl font-bold">{flashcards[index][0]}</h2>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Back card (answer), only rendered when flipped */}
            {showAnswer && (
              <div className="absolute w-full backface-hidden rotateY-180 aspect-w-2 aspect-h-1">
                <Card className="p-4 text-center">
                  <CardContent className="rotateY-180">
                    <p className="mt-2" style={{ transform: "rotateY(180deg)" }}>{flashcards[index][1]}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        </div>
      )}
      <div className="absolute bottom-8 flex justify-center w-full">
        <Button onClick={prevCard} className="mr-4">Prev</Button>
        <Button onClick={shuffleCards} className="mx-4">Shuffle</Button>
        <Button onClick={nextCard} className="ml-4">Next</Button>
      </div>
    </div>
  );
}
