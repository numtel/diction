import { useState } from 'react';

/**
 * A React hook to manage a sortable array with insertion, moving, and removal capabilities.
 */
function useSortableArray(initialArray = []) {
  const [array, setArray] = useState(initialArray);

  /**
   * Inserts an item into the array at the specified index.
   * @param {number} index The index at which to insert the item.
   * @param {*} item The item to insert.
   */
  const insertItem = (item, index) => {
    setArray(currentArray => {
      if(typeof index !== 'number') index = currentArray.length;
      return [
        ...currentArray.slice(0, index),
        item,
        ...currentArray.slice(index)
      ];
    });
    return index;
  };

  /**
   * Moves an item from one index to another.
   * @param {number} fromIndex The index of the item to move.
   * @param {number} toIndex The index to move the item to.
   */
  const moveItem = (fromIndex, toIndex) => {
    setArray(currentArray => {
      const newArray = [...currentArray];
      const [removedItem] = newArray.splice(fromIndex, 1);
      newArray.splice(toIndex, 0, removedItem);
      return newArray;
    });
  };

  /**
   * Removes an item from the array at the specified index.
   * @param {number} index The index of the item to remove.
   */
  const removeItem = (index) => {
    setArray(currentArray => [
      ...currentArray.slice(0, index),
      ...currentArray.slice(index + 1)
    ]);
  };

  return { array, insertItem, moveItem, removeItem };
}

export default useSortableArray;

