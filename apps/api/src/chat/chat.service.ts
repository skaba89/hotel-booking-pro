import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HOTEL_SYSTEM_PROMPT } from './hotel-context';
import { PROVIDERS, callProvider, ChatTurn, ProviderConfig } from './ai-providers';

export interface ChatResult {
  /** Assistant reply, or null when no provider could answer (client falls back to local FAQ). */
  reply: string | null;
  /** Provider id that produced the reply, or 'none'. */
  provider: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger('ChatService');

  constructor(private readonly config: ConfigService) {}

  /** Providers that have an API key configured, ordered by AI_PROVIDER_ORDER. */
  private resolveOrder(): ProviderConfig[] {
    const configured = PROVIDERS.filter((p) => {
      const key = this.config.get<string>(p.apiKeyEnv, '').trim();
      return key.length > 0;
    });

    const raw = this.config.get<string>('AI_PROVIDER_ORDER', '').trim();
    if (!raw) return configured;

    const wanted = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const byId = new Map(configured.map((p) => [p.id, p]));
    const ordered: ProviderConfig[] = [];
    // First the explicitly requested ids (that are also configured), in order.
    for (const id of wanted) {
      const p = byId.get(id);
      if (p && !ordered.includes(p)) ordered.push(p);
    }
    // Then any remaining configured providers not listed, as extra fallbacks.
    for (const p of configured) if (!ordered.includes(p)) ordered.push(p);
    return ordered;
  }

  /**
   * Try each configured provider in order until one answers. Returns
   * { reply: null } when none are configured or all fail, so the caller can
   * fall back to the static FAQ on the client.
   */
  async ask(turns: ChatTurn[]): Promise<ChatResult> {
    const order = this.resolveOrder();
    if (order.length === 0) {
      this.logger.warn('No AI provider configured; returning fallback signal.');
      return { reply: null, provider: 'none' };
    }

    for (const provider of order) {
      const apiKey = this.config.get<string>(provider.apiKeyEnv, '').trim();
      const model = this.config.get<string>(provider.modelEnv, '').trim() || provider.defaultModel;
      try {
        const reply = await callProvider(provider, apiKey, model, HOTEL_SYSTEM_PROMPT, turns);
        this.logger.log(`Answered via ${provider.label} (${model})`);
        return { reply, provider: provider.id };
      } catch (err) {
        this.logger.warn(`${provider.label} failed: ${(err as Error).message}. Trying next provider.`);
      }
    }

    this.logger.warn('All providers failed; returning fallback signal.');
    return { reply: null, provider: 'none' };
  }

  /** List of providers currently usable (for diagnostics / health). */
  enabledProviders(): string[] {
    return this.resolveOrder().map((p) => p.id);
  }
}
