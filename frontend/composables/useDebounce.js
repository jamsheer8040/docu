import { ref, watch, onUnmounted } from 'vue';

/**
 * useDebounce logic to delay updating a value or calling a function
 * @param value Ref to watch
 * @param delay Milliseconds to wait before update
 * @returns Debounced ref
 */
export function useDebounce(value, delay = 400) {
  const debouncedValue = ref(value.value);
  let timeoutId = null;

  const cleanup = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };

  watch(value, (newValue) => {
    cleanup();
    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue;
    }, delay);
  });

  onUnmounted(cleanup);

  return debouncedValue;
}
