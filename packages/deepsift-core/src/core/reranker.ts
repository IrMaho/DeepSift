import { AutoTokenizer, AutoModelForSequenceClassification } from '@xenova/transformers';

export class Reranker {
    private static tokenizer: any = null;
    private static model: any = null;

    static async getInstance() {
        if (!this.tokenizer || !this.model) {
            // We use bge-reranker-base for extremely high precision semantic matching
            // It runs locally via ONNX and WASM.
            this.tokenizer = await AutoTokenizer.from_pretrained('Xenova/bge-reranker-base');
            this.model = await AutoModelForSequenceClassification.from_pretrained('Xenova/bge-reranker-base', {
                quantized: true,
            });
        }
        return { tokenizer: this.tokenizer, model: this.model };
    }

    /**
     * Reranks a list of chunks based on a query using a Cross-Encoder.
     * @param query The search query
     * @param chunks The candidate chunks to rerank
     * @param topK How many top results to return
     * @returns The reranked and truncated array of chunks
     */
    static async rerank<T extends { content: string }>(
        query: string,
        chunks: T[],
        topK: number = 20
    ): Promise<(T & { crossScore: number })[]> {
        if (chunks.length === 0) return [];

        try {
            const { tokenizer, model } = await this.getInstance();
            const scoredChunks: (T & { crossScore: number })[] = [];

            const promises = chunks.map(async (chunk) => {
                try {
                    // Pass query and text_pair
                    const inputs = tokenizer(query, { text_pair: chunk.content, padding: true, truncation: true });
                    const { logits } = await model(inputs);
                    
                    // bge-reranker outputs a single logit per pair
                    const logit = logits.data[0] || 0;
                    
                    // Apply Sigmoid to bound the score between 0 and 1
                    const score = 1 / (1 + Math.exp(-logit));
                    
                    return { ...chunk, crossScore: score };
                } catch (e) {
                    console.error("Reranking error on chunk:", e);
                    return { ...chunk, crossScore: -100 }; // Very low score on error
                }
            });

            const results = await Promise.all(promises);
            
            // Sort by crossScore descending
            results.sort((a, b) => b.crossScore - a.crossScore);
            
            return results.slice(0, topK);
        } catch (error) {
            console.error("Failed to initialize or run Reranker:", error);
            return chunks.slice(0, topK).map(c => ({ ...c, crossScore: -100 }));
        }
    }
}
