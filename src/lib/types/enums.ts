/**
 * Type enums for flash card application
 * Provides strict typing for question and answer types
 */

/**
 * Question Type Enumeration
 * Defines the type of content being displayed as a question
 */
export enum QuestionType {
    IMAGE = 'image',
    TEXT = 'text',
    AUDIO = 'audio'
}

/**
 * Answer Type Enumeration  
 * Defines the format of answers expected from users
 */
export enum AnswerType {
    SINGLE = 'single',
    MULTIPLE_CHOICE = 'multiplechoice',
    MULTI_ANSWER = 'multianswer'
}

/**
 * Type guards for runtime validation
 */
export function isValidQuestionType(value: string): value is QuestionType {
    return Object.values(QuestionType).includes(value as QuestionType);
}

export function isValidAnswerType(value: string): value is AnswerType {
    return Object.values(AnswerType).includes(value as AnswerType);
}

/**
 * Helper functions to convert between enum and string values
 */
export function toQuestionType(value: string | undefined | null): QuestionType {
    if (!value || !isValidQuestionType(value)) {
        return QuestionType.TEXT; // Default fallback
    }
    return value as QuestionType;
}

export function toAnswerType(value: string | undefined | null): AnswerType {
    if (!value || !isValidAnswerType(value)) {
        return AnswerType.SINGLE; // Default fallback
    }
    return value as AnswerType;
}