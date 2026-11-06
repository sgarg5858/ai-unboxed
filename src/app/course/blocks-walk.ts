import { Block } from './content.model';

/** Walk every block, including blocks nested in panels, tabs and steppers. */
export function* allBlocks(blocks: readonly Block[] = []): Generator<Block> {
  for (const b of blocks) {
    yield b;
    if (b.type === 'panel') yield* allBlocks(b.blocks);
    if (b.type === 'tabs') for (const t of b.tabs) yield* allBlocks(t.blocks);
    if (b.type === 'stepper') for (const s of b.steps) yield* allBlocks(s.blocks);
  }
}
