export function getScoreMessage(score) {
    const grade = toLetterGrade(score);
    const article = /^[AF]/.test(grade) ? "an" : "a";
    return `You scored ${score}%, that's ${article} ${grade}`;
}

export function toLetterGrade(score) {
    if (score >= 85) return "A";
    if (score >= 80) return "A-";
    if (score >= 70) return "B";
    if (score >= 65) return "B-";
    if (score >= 60) return "C+";
    if (score >= 55) return "C";
    if (score >= 50) return "D";
    return "F";
}