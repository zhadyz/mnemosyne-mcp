import { pipeline } from '@huggingface/transformers';
import { EmbeddingService, type EmbeddingModelInfo } from './EmbeddingService.js';
import { logger } from '../utils/logger.js';

/**
 * Configuration for local embedding service using transformers.js
 */
export interface LocalEmbeddingConfig {
  /**
   * Model name from Hugging Face (e.g., 'Xenova/bge-base-en-v1.5')
   */
  model?: string;

  /**
   * Override dimensions (auto-detected from model if not provided)
   */
  dimensions?: number;

  /**
   * Version string for tracking
   */
  version?: string;

  /**
   * Pooling strategy ('mean' or 'cls')
   */
  pooling?: 'mean' | 'cls';
}

/**
 * Model information for supported BGE models
 */
interface ModelConfig {
  dimensions: number;
  pooling: 'mean' | 'cls';
  version: string;
}

/**
 * Supported BGE models with their configurations
 */
const SUPPORTED_MODELS: Record<string, ModelConfig> = {
  'Xenova/bge-base-en-v1.5': {
    dimensions: 768,
    pooling: 'mean',
    version: '1.5.0',
  },
  'Xenova/bge-small-en-v1.5': {
    dimensions: 384,
    pooling: 'mean',
    version: '1.5.0',
  },
  'Xenova/bge-m3': {
    dimensions: 1024,
    pooling: 'cls',
    version: '3.0.0',
  },
  'Xenova/bge-large-en-v1.5': {
    dimensions: 1024,
    pooling: 'mean',
    version: '1.5.0',
  },
};

/**
 * Service implementation that generates embeddings locally using transformers.js and ONNX Runtime
 */
export class LocalEmbeddingService extends EmbeddingService {
  private model: string;
  private dimensions: number;
  private version: string;
  private pooling: 'mean' | 'cls';
  private extractor: any = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Create a new local embedding service
   *
   * @param config - Configuration for the service
   */
  constructor(config: LocalEmbeddingConfig = {}) {
    super();

    // Default to bge-base-en-v1.5
    this.model = config.model || 'Xenova/bge-base-en-v1.5';

    // Get model config or use defaults
    const modelConfig = SUPPORTED_MODELS[this.model];
    if (!modelConfig) {
      logger.warn(
        `Model ${this.model} is not in the supported list. Using default configuration.`
      );
    }

    this.dimensions = config.dimensions || modelConfig?.dimensions || 768;
    this.pooling = config.pooling || modelConfig?.pooling || 'mean';
    this.version = config.version || modelConfig?.version || '1.0.0';

    logger.info('LocalEmbeddingService initialized', {
      model: this.model,
      dimensions: this.dimensions,
      pooling: this.pooling,
    });
  }

  /**
   * Initialize the transformers.js pipeline
   *
   * @private
   */
  private async _initialize(): Promise<void> {
    if (this.extractor) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        logger.info('Loading local embedding model', {
          model: this.model,
          note: 'First run will download the model (~90-200MB depending on model)',
        });

        this.extractor = await pipeline('feature-extraction', this.model);

        logger.info('Local embedding model loaded successfully', {
          model: this.model,
        });
      } catch (error: unknown) {
        const errorMessage = this._getErrorMessage(error);
        logger.error('Failed to initialize local embedding model', {
          model: this.model,
          error: errorMessage,
        });
        throw new Error(`Failed to initialize local embedding model: ${errorMessage}`);
      }
    })();

    return this.initPromise;
  }

  /**
   * Generate an embedding for a single text
   *
   * @param text - Text to generate embedding for
   * @returns Promise resolving to embedding vector
   */
  override async generateEmbedding(text: string): Promise<number[]> {
    await this._initialize();

    if (!this.extractor) {
      throw new Error('Embedding model not initialized');
    }

    logger.debug('Generating local embedding', {
      text: text.substring(0, 50) + '...',
      model: this.model,
      pooling: this.pooling,
    });

    try {
      const output = await this.extractor(text, {
        pooling: this.pooling,
        normalize: true,
      });

      // Convert to array
      const embedding = Array.from(output.data as Float32Array);

      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        logger.error('Invalid embedding returned', { embedding });
        throw new Error('Invalid embedding returned from local model');
      }

      logger.debug('Generated local embedding', {
        length: embedding.length,
        sample: embedding.slice(0, 5),
      });

      // Transformers.js with normalize:true already normalizes, but let's ensure it
      this._normalizeVector(embedding);

      return embedding;
    } catch (error: unknown) {
      const errorMessage = this._getErrorMessage(error);
      logger.error('Failed to generate local embedding', { error: errorMessage });
      throw new Error(`Error generating local embedding: ${errorMessage}`);
    }
  }

  /**
   * Generate embeddings for multiple texts
   *
   * @param texts - Array of texts to generate embeddings for
   * @returns Promise resolving to array of embedding vectors
   */
  override async generateEmbeddings(texts: string[]): Promise<number[][]> {
    await this._initialize();

    if (!this.extractor) {
      throw new Error('Embedding model not initialized');
    }

    logger.debug('Generating local embeddings for multiple texts', {
      count: texts.length,
      model: this.model,
    });

    try {
      const output = await this.extractor(texts, {
        pooling: this.pooling,
        normalize: true,
      });

      // Convert tensor to array of arrays
      const embeddings: number[][] = [];
      const data = output.data as Float32Array;
      const embeddingSize = this.dimensions;

      for (let i = 0; i < texts.length; i++) {
        const start = i * embeddingSize;
        const end = start + embeddingSize;
        const embedding = Array.from(data.slice(start, end));
        this._normalizeVector(embedding);
        embeddings.push(embedding);
      }

      logger.debug('Generated local embeddings', {
        count: embeddings.length,
        dimensions: embeddingSize,
      });

      return embeddings;
    } catch (error: unknown) {
      const errorMessage = this._getErrorMessage(error);
      logger.error('Failed to generate local embeddings', { error: errorMessage });
      throw new Error(`Failed to generate local embeddings: ${errorMessage}`);
    }
  }

  /**
   * Get information about the embedding model
   *
   * @returns Model information
   */
  override getModelInfo(): EmbeddingModelInfo {
    return {
      name: this.model,
      dimensions: this.dimensions,
      version: this.version,
    };
  }

  /**
   * Extract error message from error object
   *
   * @private
   * @param error - Error object
   * @returns Error message string
   */
  private _getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Normalize a vector to unit length (L2 norm)
   *
   * @private
   * @param vector - Vector to normalize in-place
   */
  private _normalizeVector(vector: number[]): void {
    // Calculate magnitude (Euclidean norm / L2 norm)
    let magnitude = 0;
    for (let i = 0; i < vector.length; i++) {
      magnitude += vector[i] * vector[i];
    }
    magnitude = Math.sqrt(magnitude);

    // Avoid division by zero
    if (magnitude > 0) {
      // Normalize each component
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    } else {
      // If magnitude is 0, set first element to 1 for a valid unit vector
      vector[0] = 1;
    }
  }

  /**
   * Get information about the embedding provider
   *
   * @returns Provider information
   */
  override getProviderInfo() {
    return {
      provider: 'local-onnx',
      model: this.model,
      dimensions: this.dimensions,
    };
  }
}
