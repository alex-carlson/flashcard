const scoreTexts = {
    100: [
        "Wow! Here's the keys to the website!",
        "Ring ring, MENSA is on the line!"
    ],
    90: [
        "Nice work! Can I cheat off you?",
        "Where did those last few points go?"
    ],
    80: [
        "B is for Badass!",
        "Almost genius, but you'll have to settle for “smart.”"
    ],
    70: [
        "Not bad, but I think you can do better!",
        "Impressive(to those that are easily impressed)"
    ],
    60: [
        "By most standards at least you didn't fail.",
        "You have approximate knowledge of some things."
    ],
    50: [
        "I bet you like half and half in your coffee.",
        "Which half of your brain did you use for this one?"
    ],
    40: [
        "Sometimes quizzes are like ice cream: the answers come in sprinkles.",
        "At least you tried!"
    ],
    30: [
        "If you squint, this ain't so bad!",
        "A third is a third is a third."
    ],
    20: [
        "I don't care that you're old, this will require a parent's signature.",
        "Mama let's research."
    ],
    10: [
        "We don't need no education!",
        "Consider cracking open Quizzems for Dummies."
    ],
    0: [
        "Go ahead give us nothing.",
        "I think you forgot how to type!"
    ],
}

export function getScoreMessage(score) {
    const grade = toLetterGrade(score);
    const article = /^[AF]/.test(grade) ? "an" : "a";
    return `You scored ${score}%, that's ${article} ${grade}`;
}

export function toLetterGrade(score) {
    if (score > 99) return "A+";
    if (score >= 95) return "A";
    if (score >= 90) return "A-";
    if (score >= 85) return "B+";
    if (score >= 80) return "B";
    if (score >= 75) return "B-";
    if (score >= 70) return "C+";
    if (score >= 65) return "C";
    if (score >= 60) return "C-";
    if (score >= 55) return "D+";
    if (score >= 50) return "D";
    return "F";
}

export function getRandomPhraseForScore(score) {
    // Find the highest available score threshold that the user's score meets or exceeds
    const scoreThresholds = Object.keys(scoreTexts)
        .map(Number)
        .sort((a, b) => b - a); // Sort in descending order

    let applicableThreshold = 0;
    for (const threshold of scoreThresholds) {
        if (score >= threshold) {
            applicableThreshold = threshold;
            break;
        }
    }

    const phrases = scoreTexts[applicableThreshold];
    if (!phrases || phrases.length === 0) {
        return "Great job!"; // Fallback message
    }

    // Return a random phrase from the applicable threshold
    const randomIndex = Math.floor(Math.random() * phrases.length);
    return phrases[randomIndex];
}