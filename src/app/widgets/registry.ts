import { Type } from '@angular/core';

/**
 * Named interactive widgets that JSON content can reference with
 *   { "type": "widget", "name": "<key>", "props": { ... } }
 * Each entry loads its file on demand, so a chapter only downloads the widgets it uses.
 * Use a widget only when the interaction needs real logic; prefer generic blocks otherwise.
 * A widget that takes props declares `readonly props = input<...>()`.
 */
export const WIDGETS: Record<string, () => Promise<Type<unknown>>> = {
  'fruit-similarity': () => import('./basics.widgets').then((m) => m.FruitSimilarityWidget),
  'utf8-bytes': () => import('./tokens.widgets').then((m) => m.Utf8BytesWidget),
  'token-cost': () => import('./tokens.widgets').then((m) => m.TokenCostWidget),
  'utf8-byte-table': () => import('./tokens.widgets').then((m) => m.Utf8ByteTableWidget),
  'letter-count': () => import('./tokens.widgets').then((m) => m.LetterCountWidget),
  'context-fit': () => import('./tokens.widgets').then((m) => m.ContextFitWidget),
  'embedding-table': () => import('./tokens.widgets').then((m) => m.EmbeddingTableWidget),
  'embedding-geometry': () => import('./tokens.widgets').then((m) => m.EmbeddingGeometryWidget),
  'positional-heatmap': () => import('./tokens.widgets').then((m) => m.PositionalHeatmapWidget),
  rope: () => import('./tokens.widgets').then((m) => m.RopeWidget),
  'residual-matrix': () => import('./tokens.widgets').then((m) => m.ResidualMatrixWidget),
  'attention-arcs': () => import('./attention.widgets').then((m) => m.AttentionArcsWidget),
  'qkv-matrices': () => import('./attention.widgets').then((m) => m.QkvMatricesWidget),
  'score-matrix': () => import('./attention.widgets').then((m) => m.ScoreMatrixWidget),
  'causal-mask': () => import('./attention.widgets').then((m) => m.CausalMaskWidget),
  'attention-weights': () => import('./attention.widgets').then((m) => m.AttentionWeightsWidget),
  'attention-heads': () => import('./attention.widgets').then((m) => m.AttentionHeadsWidget),
  'attention-cost': () => import('./attention.widgets').then((m) => m.AttentionCostWidget),
  'residual-stream': () => import('./block.widgets').then((m) => m.ResidualStreamWidget),
  'rms-norm': () => import('./block.widgets').then((m) => m.RmsNormWidget),
  activations: () => import('./block.widgets').then((m) => m.ActivationsWidget),
  'param-counter': () => import('./block.widgets').then((m) => m.ParamCounterWidget),
  'moe-router': () => import('./block.widgets').then((m) => m.MoeRouterWidget),
  temperature: () => import('./output.widgets').then((m) => m.TemperatureWidget),
  sampling: () => import('./output.widgets').then((m) => m.SamplingWidget),
  'kv-cache': () => import('./output.widgets').then((m) => m.KvCacheWidget),
  'cross-entropy': () => import('./training.widgets').then((m) => m.CrossEntropyWidget),
  'gradient-descent': () => import('./training.widgets').then((m) => m.GradientDescentWidget),
  'loss-curve': () => import('./training.widgets').then((m) => m.LossCurveWidget),
  'assistant-architecture': () =>
    import('./architecture.widget').then((m) => m.AssistantArchitectureWidget),
  'prompt-assembly': () => import('./assistant.widgets').then((m) => m.PromptAssemblyWidget),
  'classifier-threshold': () =>
    import('./assistant.widgets').then((m) => m.ClassifierThresholdWidget),
  'injection-defenses': () => import('./assistant.widgets').then((m) => m.InjectionDefensesWidget),
  'thinking-budget': () => import('./reasoning.widgets').then((m) => m.ThinkingBudgetWidget),
  'singleton-rate': () => import('./hallucination.widgets').then((m) => m.SingletonRateWidget),
  'guess-or-abstain': () => import('./hallucination.widgets').then((m) => m.GuessOrAbstainWidget),
};

const loaded = new Map<string, Type<unknown>>();

/** Fetch a widget's code (once) and remember it so later renders are synchronous. */
export function loadWidget(name: string): Promise<Type<unknown> | undefined> {
  const hit = loaded.get(name);
  if (hit) return Promise.resolve(hit);
  const load = WIDGETS[name];
  if (!load) return Promise.resolve(undefined);
  return load().then((type) => {
    loaded.set(name, type);
    return type;
  });
}

/** A widget that has already been fetched, or undefined. */
export const loadedWidget = (name: string) => loaded.get(name);
