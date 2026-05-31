import type { TagVariant } from '../components/Tag/Tag';

const variants: TagVariant[] = ['blue', 'green', 'purple', 'orange', 'teal'];

export function categoryTagVariant(name: string, index = 0): TagVariant {
  let hash = index;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % variants.length;
  }
  return variants[hash]!;
}
