// lib/HuggingFaceAPIEmbedding.ts
import { InferenceClient } from "@huggingface/inference";

export class HuggingFaceAPIEmbedding {
  private client: InferenceClient;
  private model: string;

  constructor(model = "intfloat/multilingual-e5-large") {
    this.client = new InferenceClient(process.env.HF_TOKEN!);
    this.model = model;
  }

  private async embed(text: string): Promise<number[]> {
    const res = await this.client.featureExtraction({
      model: this.model,
      inputs: text,
      provider: "hf-inference",
    });

    if (Array.isArray(res) && Array.isArray(res[0])) {
      return res[0] as number[];
    }
    return res as number[];
  }

  async getTextEmbedding(text: string): Promise<number[]> {
    return this.embed(text);
  }

  async getQueryEmbedding(query: string): Promise<number[] | null> {
    if (!query.trim()) return null;
    return this.embed(query);
  }
}
