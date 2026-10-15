export type DiffOperation = {
  type: "same" | "added" | "removed";
  text: string;
  leftLine: number | null;
  rightLine: number | null;
};

export type DiffRow = {
  type: "same" | "changed" | "added" | "removed";
  left: DiffOperation | null;
  right: DiffOperation | null;
};

export type DiffSummary = {
  rows: DiffRow[];
  added: number;
  removed: number;
  changed: number;
};

export function compareLines(left: string[], right: string[]): DiffSummary {
  const columns = right.length + 1;
  const table = new Uint16Array((left.length + 1) * columns);

  for (let leftIndex = left.length - 1; leftIndex >= 0; leftIndex -= 1) {
    for (let rightIndex = right.length - 1; rightIndex >= 0; rightIndex -= 1) {
      const index = leftIndex * columns + rightIndex;
      table[index] =
        left[leftIndex] === right[rightIndex]
          ? table[(leftIndex + 1) * columns + rightIndex + 1] + 1
          : Math.max(table[(leftIndex + 1) * columns + rightIndex], table[index + 1]);
    }
  }

  const operations: DiffOperation[] = [];
  let leftIndex = 0;
  let rightIndex = 0;
  let added = 0;
  let removed = 0;

  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      operations.push({
        type: "same",
        text: left[leftIndex],
        leftLine: leftIndex + 1,
        rightLine: rightIndex + 1,
      });
      leftIndex += 1;
      rightIndex += 1;
    } else if (
      table[(leftIndex + 1) * columns + rightIndex] >= table[leftIndex * columns + rightIndex + 1]
    ) {
      operations.push({
        type: "removed",
        text: left[leftIndex],
        leftLine: leftIndex + 1,
        rightLine: null,
      });
      leftIndex += 1;
      removed += 1;
    } else {
      operations.push({
        type: "added",
        text: right[rightIndex],
        leftLine: null,
        rightLine: rightIndex + 1,
      });
      rightIndex += 1;
      added += 1;
    }
  }

  while (leftIndex < left.length) {
    operations.push({
      type: "removed",
      text: left[leftIndex],
      leftLine: leftIndex + 1,
      rightLine: null,
    });
    leftIndex += 1;
    removed += 1;
  }
  while (rightIndex < right.length) {
    operations.push({
      type: "added",
      text: right[rightIndex],
      leftLine: null,
      rightLine: rightIndex + 1,
    });
    rightIndex += 1;
    added += 1;
  }

  const rows: DiffRow[] = [];
  let operationIndex = 0;
  let changed = 0;

  while (operationIndex < operations.length) {
    const operation = operations[operationIndex];
    if (operation.type === "same") {
      rows.push({ type: "same", left: operation, right: operation });
      operationIndex += 1;
      continue;
    }

    const removedOperations: DiffOperation[] = [];
    const addedOperations: DiffOperation[] = [];
    while (operationIndex < operations.length && operations[operationIndex].type !== "same") {
      const nextOperation = operations[operationIndex];
      if (nextOperation.type === "removed") removedOperations.push(nextOperation);
      if (nextOperation.type === "added") addedOperations.push(nextOperation);
      operationIndex += 1;
    }

    const pairedCount = Math.min(removedOperations.length, addedOperations.length);
    changed += pairedCount;
    for (
      let index = 0;
      index < Math.max(removedOperations.length, addedOperations.length);
      index += 1
    ) {
      const leftOperation = removedOperations[index] ?? null;
      const rightOperation = addedOperations[index] ?? null;
      rows.push({
        type: leftOperation && rightOperation ? "changed" : leftOperation ? "removed" : "added",
        left: leftOperation,
        right: rightOperation,
      });
    }
  }

  return { rows, added: added - changed, removed: removed - changed, changed };
}
