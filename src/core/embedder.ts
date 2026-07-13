import { embed } from '@ternlight/base';

/**
 * Generates an embedding for a given text.
 * The model (@ternlight/base) returns a 384-dimensional L2-normalized Float32Array.
 * The model is loaded automatically upon first import, so no explicit init is needed.
 * 
 * @param text The input text to embed
 * @returns A 384-dimensional Float32Array representing the semantic embedding
 */
export function getEmbedding(text: string): Float32Array {
    return embed(text);
}

/**
 * Generates embeddings for an array of texts.
 * 
 * @param texts Array of input texts
 * @returns Array of Float32Array embeddings
 */
export function getEmbeddings(texts: string[]): Float32Array[] {
    return texts.map(text => embed(text));
}
