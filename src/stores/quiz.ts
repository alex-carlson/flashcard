import { writable, derived, get } from 'svelte/store';
import { fetchCollectionById } from '$lib/api/collections';
import { completeQuiz } from '$lib/api/user';
import { mapCards, areStringsClose } from '$lib/api/utils';
import { addToast } from './toast';
import { QuestionType, AnswerType } from '$lib/types/enums';

// Types
interface Card {
    id?: string;
    question?: string;
    answer: string;
    image?: string;
    audio?: string;
    imageUrl?: string;
    revealed: boolean;
    loaded: boolean;
    hidden: boolean;
    scale: number;
    userAnswer: string;
    questionType: QuestionType;
    answerType: AnswerType;
    answerer?: string;
    incorrect?: boolean;
    isCorrect?: boolean; // Whether the user's answer was correct
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // For additional properties from the API
}

interface Collection {
    id: string | null;
    name: string;
    description: string;
    thumbnail: string;
    author: string;
    author_slug: string;
    shuffle: boolean;
}

interface QuizState {
    cards: Card[];
    isLoading: boolean;
    isPractice: boolean;
    isParty: boolean;
    hasInitialized: boolean;
    currentMode: 'FILL_IN_THE_BLANK' | 'MULTIPLE_CHOICE' | 'FLASHCARD';
    showModal: boolean;
    isComplete: boolean;
    isGrid: boolean;
    isFullscreen: boolean;
    shuffleTrigger: number;
    loadingError: string | null;
    collection: Collection;
}

interface QuizStats {
    total: number;
    answered: number;
    correct: number;
    percentage: number;
    areAnyRevealed: boolean;
    canReset: boolean;
    isComplete: boolean;
}

export function createQuizStore() {
    const initialState: QuizState = {
        cards: [],
        isLoading: false,
        hasInitialized: false,
        currentMode: 'FILL_IN_THE_BLANK',
        showModal: false,
        isComplete: false,
        isPractice: false,
        isParty: false,
        isGrid: false,
        isFullscreen: false,
        shuffleTrigger: 0,
        loadingError: null,
        collection: {
            id: null,
            name: '',
            description: '',
            thumbnail: '',
            author: '',
            author_slug: '',
            shuffle: false
        }
    };

    const store = writable(initialState);
    const { subscribe, update } = store;

    // Add memoization to prevent unnecessary recalculations
    let lastStatsStateHash = '';
    let memoizedStats: QuizStats = {
        total: 0,
        answered: 0,
        correct: 0,
        percentage: 0,
        areAnyRevealed: false,
        canReset: false,
        isComplete: false
    };

    const stats = derived(store, ($state): QuizStats => {
        const cards = $state.cards || [];

        // Create a hash of the current state to detect changes
        const stateHash = JSON.stringify({
            cardsLength: cards.length,
            revealedCards: cards.map(c => ({ id: c?.id, revealed: c?.revealed, userAnswer: c?.userAnswer, isCorrect: c?.isCorrect })),
            isComplete: $state.isComplete
        });

        // Return memoized result if state hasn't changed
        if (stateHash === lastStatsStateHash) {
            return memoizedStats;
        }

        lastStatsStateHash = stateHash;

        const revealedCards = cards.filter(c => c?.revealed);

        const correctCards = revealedCards.filter(c => {
            // Use isCorrect flag if available (for multiple choice/multi-answer)
            if (c?.isCorrect !== undefined) {
                return c.isCorrect;
            }

            // Fall back to string comparison for single answer questions
            const userAnswer = c?.userAnswer;
            const correctAnswer = c?.answer;

            // Handle undefined/null values
            if (userAnswer == null || correctAnswer == null) {
                return false;
            }

            const userAnswerStr = String(userAnswer);
            const correctAnswerStr = String(correctAnswer);
            return areStringsClose(userAnswerStr, correctAnswerStr);
        });

        memoizedStats = {
            total: cards.length,
            answered: revealedCards.length,
            correct: correctCards.length,
            percentage: cards.length > 0
                ? Math.round((correctCards.length / cards.length) * 100)
                : 0,
            areAnyRevealed: cards.some(card => card?.revealed),
            canReset: cards.some(card => card?.scale !== 1 || card?.hidden),
            isComplete: cards.length > 0 && cards.every(card => card?.revealed)
        };

        return memoizedStats;
    }); async function loadCollection(collectionId: string | null): Promise<void> {
        if (!collectionId) {
            update(state => ({
                ...state,
                loadingError: 'No collection ID provided',
                isLoading: false
            }));
            addToast({
                type: 'error',
                message: 'No collection ID provided'
            });
            return;
        }

        // Check if quiz is already in progress (has revealed cards) and prevent reload
        const currentState = get(store);
        if (currentState.hasInitialized && currentState.cards.some(card => card?.revealed)) {
            console.log('Quiz already in progress - skipping collection reload');
            return;
        }

        update(state => ({
            ...state,
            isLoading: true,
            loadingError: null
        }));

        try {
            console.log('Fetching collection with ID:', collectionId);
            const data = await fetchCollectionById(collectionId);

            if (!data) {
                throw new Error('Collection not found');
            }



            if (!data.items || data.items.length === 0) {
                addToast({
                    type: 'warning',
                    message: 'This collection has no items'
                });
            }


            const cards = mapCards(data.items || []);
            update(state => ({
                ...state,
                cards,
                collection: {
                    id: collectionId,
                    name: data.category || '',
                    description: data.description || '',
                    thumbnail: String(data.thumbnail || ''),
                    author: (data.profiles && data.profiles.username) ? data.profiles.username : 'Unknown',
                    author_slug: (data.profiles && data.profiles.username_slug) ? data.profiles.username_slug : '',
                    shuffle: data.shuffle || false
                },
                hasInitialized: true,
                isLoading: false
            }));

            // Shuffle cards if collection.shuffle is true
            if (data.shuffle) {
                shuffleCards();
            }

        } catch (error) {
            console.error('Error fetching collection:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch collection';
            update(state => ({
                ...state,
                loadingError: errorMessage,
                isLoading: false
            }));
            addToast({
                type: 'error',
                message: `Failed to fetch collection: ${errorMessage}`
            });
        }
    }

    function setIsPractice(isPracticeMode: boolean): void {
        update(state => ({
            ...state,
            isPractice: isPracticeMode
        }));
    }

    // Throttle card updates to prevent excessive reactive recalculations
    let updateTimeout: number | null = null;
    let pendingUpdates: Map<number, Partial<Card>> = new Map();

    function updateCard(index: number, updates: Partial<Card>): void {
        // Merge updates for the same card index
        const existing = pendingUpdates.get(index) || {};
        pendingUpdates.set(index, { ...existing, ...updates });

        // Clear existing timeout
        if (updateTimeout !== null) {
            clearTimeout(updateTimeout);
        }

        // Batch updates with a small delay
        updateTimeout = window.setTimeout(() => {
            if (pendingUpdates.size === 0) return;

            update(state => {
                const newCards = [...state.cards];

                // Apply all pending updates
                for (const [cardIndex, cardUpdates] of pendingUpdates) {
                    if (cardIndex >= 0 && cardIndex < newCards.length) {
                        newCards[cardIndex] = { ...newCards[cardIndex], ...cardUpdates };
                    }
                }

                pendingUpdates.clear();
                updateTimeout = null;

                return {
                    ...state,
                    cards: newCards
                };
            });
        }, 16); // ~60fps throttle
    }

    function shuffleCards(seed?: number): void {
        update(state => {
            const newCards = [...state.cards];
            const shuffleSeed = seed !== undefined ? seed : state.shuffleSeed;

            // Use seeded random if seed is provided (for party mode), otherwise use Math.random
            let random: () => number;
            if (shuffleSeed !== undefined) {
                // Simple seeded random number generator (LCG)
                let seedValue = shuffleSeed;
                random = () => {
                    seedValue = (seedValue * 1664525 + 1013904223) % 4294967296;
                    return seedValue / 4294967296;
                };
            } else {
                random = Math.random;
            }

            // Fisher-Yates shuffle with seeded random
            for (let i = newCards.length - 1; i > 0; i--) {
                const j = Math.floor(random() * (i + 1));
                [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
            }

            return {
                ...state,
                cards: newCards,
                shuffleTrigger: state.shuffleTrigger + 1,
                shuffleSeed: shuffleSeed
            };
        });
    }

    function resetCards(): void {
        update(state => ({
            ...state,
            cards: state.cards.map(card => ({
                ...card,
                hidden: false,
                scale: 1,
                revealed: false
            }))
        }));
    }

    function setShuffleSeed(seed: number): void {
        update(state => ({
            ...state,
            shuffleSeed: seed
        }));
    }

    function toggleGrid(): void {
        update(state => ({ ...state, isGrid: !state.isGrid }));
    }

    function setMode(mode: QuizState['currentMode']): void {
        update(state => ({
            ...state,
            currentMode: mode,
            cards: state.cards.map(card => ({ ...card, revealed: false }))
        }));
    }

    async function completeQuizAction(userId?: string, token?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            update(state => {
                const correctAnswers = state.cards.filter(
                    card => card?.revealed && card.incorrect !== true
                ).length;
                const percentage = Math.round((correctAnswers / state.cards.length) * 100);

                // Handle API call if user data is available
                if (userId && token && state.collection.id) {
                    // Add timeout to prevent hanging
                    const apiTimeout = setTimeout(() => {
                        console.warn('Quiz completion API call timed out');
                        resolve(); // Resolve anyway to not block UI
                    }, 5000); // 5 second timeout

                    completeQuiz(userId, state.collection.id, percentage, token)
                        .then(() => {
                            clearTimeout(apiTimeout);
                            console.log('Quiz completion API call successful');
                            resolve();
                        })
                        .catch((error) => {
                            clearTimeout(apiTimeout);
                            console.error('Quiz completion API call failed:', error);
                            // Still resolve - don't fail the whole completion process for API errors
                            resolve();
                        });
                } else {
                    // No user data, just resolve immediately
                    resolve();
                }

                return {
                    ...state,
                    showModal: true,
                    isComplete: true
                };
            });
        });
    }

    function closeModal(): void {
        update(state => ({
            ...state,
            showModal: false
        }));
    }

    function revealCards(): void {
        update(state => {
            return {
                ...state,
                cards: state.cards.map(card => {
                    const userAnswer = String(card?.userAnswer || '');
                    const correctAnswer = String(card?.answer || '');
                    const hasUserAnswer = Boolean(card?.userAnswer && String(card.userAnswer).trim());
                    const isIncorrect = hasUserAnswer && !areStringsClose(userAnswer, correctAnswer);

                    console.log(`Card ${card?.id}: userAnswer="${userAnswer}", correctAnswer="${correctAnswer}", hasUserAnswer=${hasUserAnswer}, incorrect=${isIncorrect}`);

                    return {
                        ...card,
                        revealed: true,
                        incorrect: isIncorrect
                    };
                })
            };
        });
    }

    function resetCardsToInitialState(): void {
        update(state => ({
            ...state,
            cards: state.cards.map(card => ({
                ...card,
                hidden: false,
                scale: 1,
                revealed: false,
                userAnswer: ''
            })),
            isComplete: false
        }));
    }

    // Add cleanup function
    function cleanup(): void {
        if (updateTimeout !== null) {
            clearTimeout(updateTimeout);
            updateTimeout = null;
        }
        pendingUpdates.clear();
        lastStatsStateHash = '';
    }

    return {
        subscribe,
        stats,
        update,
        loadCollection,
        updateCard,
        setIsPractice,
        shuffleCards,
        resetCards,
        toggleGrid,
        setMode,
        completeQuiz: completeQuizAction,
        closeModal,
        revealCards,
        resetCardsToInitialState,
        cleanup,
        retry: () => {
            resetCardsToInitialState();
            update(state => ({ ...state, hasInitialized: false }));
            closeModal();
        }
    };
}
