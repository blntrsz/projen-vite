/**
 * Type of a map mapping strings to some arbitrary type
 */
export type Obj<T> = { [key: string]: T };

/**
 * Return whether the given value is an object
 *
 * Even though arrays and instances of classes technically are objects, we
 * usually want to treat them differently, so we return false in those cases.
 */
export function isObject(x: any): x is Obj<any> {
  return (
    x !== null &&
    typeof x === "object" &&
    !Array.isArray(x) &&
    x.constructor.name === "Object"
  );
}

/**
 * Recursively merge objects together
 *
 * The leftmost object is mutated and returned. Arrays are not merged
 * but overwritten just like scalars.
 *
 * If an object is merged into a non-object, the non-object is lost.
 *
 * `undefined`s will cause a value to be deleted if destructive is enabled.
 */
export function deepMerge(
  objects: Array<Obj<any> | undefined>,
  destructive: boolean = false,
) {
  function mergeOne(target: Obj<any>, source: Obj<any>) {
    for (const key of Object.keys(source)) {
      const value = source[key];

      if (isObject(value)) {
        // if the value at the target is not an object, override it with an
        // object so we can continue the recursion
        if (typeof target[key] !== "object") {
          target[key] = value;
        }

        if ("__$APPEND" in value && Array.isArray(value.__$APPEND)) {
          if (Array.isArray(target[key])) {
            target[key].push(...value.__$APPEND);
          } else {
            target[key] = value.__$APPEND;
          }
        }

        mergeOne(target[key], value);

        // if the result of the merge is an empty object, it's because the
        // eventual value we assigned is `undefined`, and there are no
        // sibling concrete values alongside, so we can delete this tree.
        const output = target[key];
        if (
          typeof output === "object" &&
          Object.keys(output).length === 0 &&
          destructive
        ) {
          delete target[key];
        }
      } else if (value === undefined && destructive) {
        delete target[key];
      } else if (typeof value !== "undefined") {
        target[key] = value;
      }
    }
  }

  const others = objects.filter((x) => x != null) as Array<Obj<any>>;

  if (others.length === 0) {
    return {};
  }
  const into = others.splice(0, 1)[0];

  others.forEach((other) => mergeOne(into, other));
  return into;
}
