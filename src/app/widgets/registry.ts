import { AssistantArchitectureWidget } from './architecture.widget';
import { FruitSimilarityWidget } from './basics.widgets';
import { Type } from '@angular/core';
import { GuessOrAbstainWidget, SingletonRateWidget } from './hallucination.widgets';
import {
  ClassifierThresholdWidget,
  InjectionDefensesWidget,
  PromptAssemblyWidget,
} from './assistant.widgets';
import {
  AttentionArcsWidget,
  AttentionCostWidget,
  AttentionHeadsWidget,
  AttentionWeightsWidget,
  CausalMaskWidget,
  QkvMatricesWidget,
  ScoreMatrixWidget,
} from './attention.widgets';
import {
  ActivationsWidget,
  MoeRouterWidget,
  ParamCounterWidget,
  ResidualStreamWidget,
  RmsNormWidget,
} from './block.widgets';
import { KvCacheWidget, SamplingWidget, TemperatureWidget } from './output.widgets';
import {
  EmbeddingGeometryWidget,
  EmbeddingTableWidget,
  PositionalHeatmapWidget,
  ResidualMatrixWidget,
  RopeWidget,
  TokenizerWidget,
} from './tokens.widgets';
import { CrossEntropyWidget, GradientDescentWidget, LossCurveWidget } from './training.widgets';

/**
 * Named interactive widgets that JSON content can reference with
 *   { "type": "widget", "name": "<key>", "props": { ... } }
 * Use a widget only when the interaction needs real logic; prefer generic blocks otherwise.
 * A widget that takes props declares `readonly props = input<...>()`.
 */
export const WIDGETS: Record<string, Type<unknown>> = {
  // 00 big picture
  'fruit-similarity': FruitSimilarityWidget,
  // 01 tokens & embeddings
  tokenizer: TokenizerWidget,
  'embedding-table': EmbeddingTableWidget,
  'embedding-geometry': EmbeddingGeometryWidget,
  'positional-heatmap': PositionalHeatmapWidget,
  rope: RopeWidget,
  'residual-matrix': ResidualMatrixWidget,
  // 02 attention
  'attention-arcs': AttentionArcsWidget,
  'qkv-matrices': QkvMatricesWidget,
  'score-matrix': ScoreMatrixWidget,
  'causal-mask': CausalMaskWidget,
  'attention-weights': AttentionWeightsWidget,
  'attention-heads': AttentionHeadsWidget,
  'attention-cost': AttentionCostWidget,
  // 03 transformer block
  'residual-stream': ResidualStreamWidget,
  'rms-norm': RmsNormWidget,
  activations: ActivationsWidget,
  'param-counter': ParamCounterWidget,
  'moe-router': MoeRouterWidget,
  // 04 output & inference
  temperature: TemperatureWidget,
  sampling: SamplingWidget,
  'kv-cache': KvCacheWidget,
  // 05 training
  'cross-entropy': CrossEntropyWidget,
  'gradient-descent': GradientDescentWidget,
  'loss-curve': LossCurveWidget,
  // 06 assistant architecture
  'assistant-architecture': AssistantArchitectureWidget,
  'prompt-assembly': PromptAssemblyWidget,
  'classifier-threshold': ClassifierThresholdWidget,
  'injection-defenses': InjectionDefensesWidget,
  // why LLMs hallucinate
  'singleton-rate': SingletonRateWidget,
  'guess-or-abstain': GuessOrAbstainWidget,
};
