import test from "node:test";
import assert from "node:assert/strict";
import { getOrderedCategories, sortMenuItems, planCategoryMove, planItemMove, planItemPlacement } from "../lib/menu-order.js";

const apply = (items, changes) => items.map((item) => ({ ...item, ...changes.find((change) => change.id === item.id)?.fields }));
const ids = (items) => items.map((item) => item.id);

test("las cartas existentes conservan su orden y las categorías nuevas quedan al final", () => {
  const items = [{ id: "1", category: "Postres" }, { id: "2", category: "Entradas" },
    { id: "3", category: "Vegano" }, { id: "4", category: "Especiales" }];
  assert.deepEqual(getOrderedCategories(items), ["Entradas", "Postres", "Especiales", "Vegano"]);
  assert.deepEqual(ids(sortMenuItems(items)), ["1", "2", "3", "4"]);
});

test("el orden guardado incluye platos ocultos y se conserva al volver a cargar", () => {
  const items = [{ id: "a", category: "Entradas", price: 4000 },
    { id: "b", category: "Postres", hidden: true }, { id: "c", category: "Postres" }];
  const changes = planCategoryMove(items, "Postres", -1);
  const reloaded = JSON.parse(JSON.stringify(apply(items, changes)));
  assert.deepEqual(getOrderedCategories(reloaded), ["Postres", "Entradas"]);
  assert.equal(reloaded.find((item) => item.id === "b").categoryOrder, 0);
  assert.equal(reloaded.find((item) => item.id === "c").categoryOrder, 0);
  assert.equal(reloaded[0].price, 4000);
  assert.equal(reloaded[1].hidden, true);
  assert.equal(items[0].categoryOrder, undefined);
});

test("se reordena un plato solo dentro de su categoría", () => {
  const items = [{ id: "a", category: "Entradas" }, { id: "x", category: "Postres", order: 8 },
    { id: "b", category: "Entradas", hidden: true }, { id: "c", category: "Entradas" }];
  const changes = planItemMove(items, "b", -1);
  const reloaded = apply(items, changes);
  assert.deepEqual(ids(sortMenuItems(reloaded.filter((item) => item.category === "Entradas"))), ["b", "a", "c"]);
  assert.equal(reloaded.find((item) => item.id === "x").order, 8);
  assert.ok(changes.every((change) => Object.keys(change.fields).join() === "order"));
});

test("el primer y último elemento no pueden moverse fuera de la lista", () => {
  const items = [{ id: "a", category: "Entradas" }, { id: "b", category: "Postres" }];
  assert.deepEqual(planCategoryMove(items, "Entradas", -1), []);
  assert.deepEqual(planCategoryMove(items, "Postres", 1), []);
  assert.deepEqual(planItemMove(items, "a", -1), []);
  assert.deepEqual(planItemMove(items, "missing", 1), []);
  assert.deepEqual(planCategoryMove(items, "Entradas", 2), []);
});

test("los valores de orden inválidos no alteran el orden de creación de los platos pendientes", () => {
  const items = [{ id: "legacy", order: null }, { id: "saved", order: 2 },
    { id: "new" }, { id: "invalid", order: NaN }];
  assert.deepEqual(ids(sortMenuItems(items)), ["saved", "legacy", "new", "invalid"]);
  assert.deepEqual(ids(items), ["legacy", "saved", "new", "invalid"]);
});

test("un plato nuevo se agrega al final aunque convivan datos antiguos y ordenados", () => {
  const items = [{ id: "a", category: "Entradas", order: 4, categoryOrder: 1 },
    { id: "b", category: "Entradas" }, { id: "c", category: "Postres", categoryOrder: 0 }];
  const placement = planItemPlacement(items, "Entradas");
  const saved = [...apply(items, placement.changes), { id: "new", category: "Entradas", order: placement.order, categoryOrder: placement.categoryOrder }];
  assert.deepEqual(ids(sortMenuItems(saved.filter((item) => item.category === "Entradas"))), ["a", "b", "new"]);
  assert.deepEqual(getOrderedCategories(saved), ["Postres", "Entradas"]);
});

test("cambiar un plato de categoría lo coloca al final del destino", () => {
  const items = [{ id: "moving", category: "Entradas", order: 0, categoryOrder: 0 },
    { id: "a", category: "Postres", order: 5, categoryOrder: 1 }, { id: "b", category: "Postres" }];
  const placement = planItemPlacement(items, "Postres", "moving");
  const saved = apply(items, placement.changes).map((item) => item.id === "moving"
    ? { ...item, category: "Postres", order: placement.order, categoryOrder: placement.categoryOrder } : item);
  assert.deepEqual(ids(sortMenuItems(saved)), ["a", "b", "moving"]);
  assert.equal(saved[0].categoryOrder, 1);
});

test("las categorías agregadas después de ordenar aparecen al final", () => {
  const items = [{ id: "a", category: "Postres", categoryOrder: 0 }, { id: "b", category: "Entradas", categoryOrder: 1 }];
  const placement = planItemPlacement(items, "Especiales");
  assert.equal(placement.categoryOrder, 2);
  assert.deepEqual(getOrderedCategories([...items, { id: "new", category: "Especiales", categoryOrder: placement.categoryOrder }]), ["Postres", "Entradas", "Especiales"]);
  assert.equal(planItemPlacement([], "Entradas").categoryOrder, undefined);
});
