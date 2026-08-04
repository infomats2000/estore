export const normalizeProductForDb = (input: Record<string, any>): any => {
  const normalized: Record<string, any> = { ...input };

  const jsonFields = ['specs', 'tags', 'additionalImages', 'colors', 'sizes'] as const;
  for (const field of jsonFields) {
    if (normalized[field] === undefined || normalized[field] === null) {
      normalized[field] = field === 'specs' ? '{}' : '[]';
      continue;
    }

    if (typeof normalized[field] === 'string') {
      continue;
    }

    normalized[field] = JSON.stringify(normalized[field]);
  }

  return normalized as any;
};

export const serializeProductForResponse = (product: Record<string, any>) => {
  const serialized = { ...product };

  for (const field of ['specs', 'tags', 'additionalImages', 'colors', 'sizes'] as const) {
    if (typeof serialized[field] === 'string') {
      try {
        serialized[field] = JSON.parse(serialized[field]);
      } catch {
        serialized[field] = field === 'specs' ? {} : [];
      }
    }
  }

  return serialized;
};
