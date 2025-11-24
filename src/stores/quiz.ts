import { writable, derived } from 'svelte/store';
import { fetchCollectionById } from '$lib/api/collections';
import { completeQuiz } from '$lib/api/user';
import { mapCards, areStringsClose } from '$lib/api/utils';
import { addToast } from './toast';

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
    questionType: 'image' | 'text' | 'audio';
    answerType: 'single' | 'multiplechoice' | 'multianswer';
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

    const stats = derived(store, ($state): QuizStats => {
        const cards = $state.cards || [];
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

        const statsResult = {
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

        return statsResult;
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

    function updateCard(index: number, updates: Partial<Card>): void {
        update(state => {
            const newState = {
                ...state,
                cards: state.cards.map((card, i) =>
                    i === index ? { ...card, ...updates } : card
                )
            };
            return newState;
        });
    }

    function shuffleCards(): void {
        update(state => {
            const newCards = [...state.cards];
            for (let i = newCards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
            }
            return {
                ...state,
                cards: newCards,
                shuffleTrigger: state.shuffleTrigger + 1
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

    function completeQuizAction(userId?: string, token?: string): void {
        update(state => {
            const correctAnswers = state.cards.filter(
                card => card?.revealed && card.incorrect !== true
            ).length;
            const percentage = Math.round((correctAnswers / state.cards.length) * 100);

            if (userId && token) {
                completeQuiz(userId, state.collection.id, percentage, token);
            }

            return {
                ...state,
                showModal: true,
                isComplete: true
            };
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
        retry: () => {
            resetCardsToInitialState();
            update(state => ({ ...state, hasInitialized: false }));
            closeModal();
        }
    };
}
