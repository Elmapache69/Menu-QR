import { sortCategories } from "./format.js";

function rank(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : Infinity;
}

export function itemCategory(item) {
  return item.category || "Otros";
}

export function getOrderedCategories(items) {
  const categories = sortCategories([...new Set(items.map(itemCategory))]);
  const positions = new Map();
  for (const item of items) {
    const category = itemCategory(item);
    positions.set(category, Math.min(positions.get(category) ?? Infinity, rank(item.categoryOrder)));
  }
  return categories.sort((a, b) => {
    const first = positions.get(a);
    const second = positions.get(b);
    return first === second ? 0 : first < second ? -1 : 1;
  });
}

export function sortMenuItems(items) {
  return [...items].sort((a, b) => {
    const first = rank(a.order);
    const second = rank(b.order);
    return first === second ? 0 : first < second ? -1 : 1;
  });
}

function move(list, index, direction) {
  const next = index + direction;
  if ((direction !== -1 && direction !== 1) || index < 0 || next < 0 || next >= list.length) return null;
  const result = [...list];
  [result[index], result[next]] = [result[next], result[index]];
  return result;
}

export function planCategoryMove(items, category, direction) {
  const categories = getOrderedCategories(items);
  const reordered = move(categories, categories.indexOf(category), direction);
  if (!reordered) return [];
  const positions = new Map(reordered.map((name, index) => [name, index]));
  return items.flatMap((item) => {
    const categoryOrder = positions.get(itemCategory(item));
    return item.categoryOrder === categoryOrder ? [] : [{ id: item.id, fields: { categoryOrder } }];
  });
}

export function planItemMove(items, itemId, direction) {
  const item = items.find((entry) => entry.id === itemId);
  if (!item) return [];
  const group = sortMenuItems(items.filter((entry) => itemCategory(entry) === itemCategory(item)));
  const reordered = move(group, group.findIndex((entry) => entry.id === itemId), direction);
  return reordered ? reordered.flatMap((entry, order) =>
    entry.order === order ? [] : [{ id: entry.id, fields: { order } }]) : [];
}

// Los platos nuevos o cambiados de categoría se agregan al final del grupo.
export function planItemPlacement(items, category, itemId = null) {
  const group = sortMenuItems(items.filter((item) => item.id !== itemId && itemCategory(item) === category));
  const categoryRanks = items.filter((item) => itemCategory(item) === category)
    .map((item) => rank(item.categoryOrder)).filter(Number.isFinite);
  const savedRanks = items.map((item) => rank(item.categoryOrder)).filter(Number.isFinite);
  return {
    order: group.length,
    categoryOrder: categoryRanks.length ? Math.min(...categoryRanks)
      : savedRanks.length ? Math.max(...savedRanks) + 1 : undefined,
    changes: group.flatMap((item, order) => item.order === order ? [] : [{ id: item.id, fields: { order } }]),
  };
}
