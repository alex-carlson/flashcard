import { writable, derived } from 'svelte/store';
import { fetchCollectionById } from '$lib/api/collections';
import { fetchUser, completeQuiz } from '$lib/api/user';
// import { mapCards } from '$lib/api/utils';
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
    type: 'image' | 'text' | 'audio' | 'unknown';
    answerer?: string;
    incorrect?: boolean;
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
}

interface QuizState {
    cards: Card[];
    isLoading: boolean;
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
            author_slug: ''
        }
    }; const { subscribe, update } = writable(initialState);

    // Derived stats
    const stats = derived({ subscribe }, ($state): QuizStats => {
        const cards = $state.cards || [];
        return {
            total: cards.length,
            answered: cards.filter(c => c?.revealed).length,
            correct: cards.filter(c => c?.revealed && c?.userAnswer === c?.answer).length,
            percentage: cards.length > 0
                ? Math.round((cards.filter(c => c?.revealed && c?.userAnswer === c?.answer).length / cards.length) * 100)
                : 0,
            areAnyRevealed: cards.some(card => card?.revealed),
            canReset: cards.some(card => card?.scale !== 1 || card?.hidden),
            isComplete: cards.length > 0 && cards.every(card => card?.revealed)
        };
    });

    async function loadCollection(collectionId: string | null): Promise<void> {
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
            const data = await fetchCollectionById(collectionId);

            if (!data) {
                throw new Error('Collection not found');
            }

            const authorData = await fetchUser(data.author_public_id);

            if (!data.questions || data.questions.length === 0) {
                addToast({
                    type: 'warning',
                    message: 'This collection has no questions'
                });
            }

            // Fetch each card's data from the server using its id
            let cards: Card[] = [];
            if (data.questions && data.questions.length > 0) {
                // If questions are just IDs, fetch each item
                cards = await Promise.all(
                    data.questions.map(async (q) => {
                        if (typeof q === 'string' || typeof q.id === 'string') {
                            // If q is an id or has an id property
                            try {
                                const itemData = await import('../lib/Upload/uploader').then(m => m.fetchCollectionItemById(typeof q === 'string' ? q : q.id));
                                return {
                                    ...itemData,
                                    revealed: false,
                                    loaded: false,
                                    hidden: false,
                                    scale: 1,
                                    userAnswer: '',
                                    type: itemData.type || 'unknown'
                                };
                            } catch (err) {
                                console.error('Error fetching card item:', err);
                                return {
                                    id: typeof q === 'string' ? q : q.id,
                                    question: '',
                                    answer: '',
                                    revealed: false,
                                    loaded: false,
                                    hidden: false,
                                    scale: 1,
                                    userAnswer: '',
                                    type: 'unknown'
                                };
                            }
                        } else {
                            // If q is already a full object
                            return {
                                ...q,
                                revealed: false,
                                loaded: false,
                                hidden: false,
                                scale: 1,
                                userAnswer: '',
                                type: q.type || 'unknown'
                            };
                        }
                    })
                );
            }
            console.log('Fetched cards:', cards);
            update(state => ({
                ...state,
                cards,
                collection: {
                    id: collectionId,
                    name: data.category || '',
                    description: data.description || '',
                    thumbnail: String(data.thumbnail || ''),
                    author: authorData.username || '',
                    author_slug: authorData.username_slug || ''
                },
                hasInitialized: true,
                isLoading: false
            }));

            console.log('Collection loaded:', data);

            document.title = `${data.category} - ${authorData.username}`;

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

    function updateCard(index: number, updates: Partial<Card>): void {
        update(state => ({
            ...state,
            cards: state.cards.map((card, i) =>
                i === index ? { ...card, ...updates } : card
            )
        }));
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
                card => card?.revealed && card?.userAnswer === card?.answer
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
        console.log('Revealing all cards');
        update(state => ({
            ...state,
            cards: state.cards.map(card => ({
                ...card,
                revealed: true,
                incorrect: card?.userAnswer !== card?.answer
            }))
        }));
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
