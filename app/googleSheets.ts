import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

interface Flashcard {
    question: string;
    answer: string;
}

const credentialsPath = path.resolve(process.cwd(), 'credentials.json');

// Check if credentials.json exists
if (!fs.existsSync(credentialsPath)) {
    throw new Error(`MISSING_CREDENTIALS: Could not find credentials file at ${credentialsPath}`);
}

const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

export const getFlashcardsFromSheet = async (): Promise<Flashcard[]> => {
    try {
        console.log("Connecting to Google Sheets...");

        const spreadsheetId = '1HJQ6NaJT34igFRXkkS5yN_L-c3Rr-WcihlEGaV_zFrU'; // Replace with actual ID
        const range = 'Sheet1!B:C'; // Ensure correct range

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        if (!response.data.values) {
            console.error("No data returned from Google Sheets.");
            return [];
        }

        console.log("Raw data from Google Sheets:", response.data.values);

        return response.data.values.map(([question, answer]) => ({ question, answer }));
    } catch (error) {
        console.error("Google Sheets API Error:", error);
        throw new Error("Failed to fetch data from Google Sheets.");
    }
};
