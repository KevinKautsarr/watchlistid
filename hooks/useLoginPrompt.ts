export function useLoginPrompt() {
  const showLoginPrompt = () => {
    if (typeof global !== 'undefined' && global.showLoginPrompt) {
      global.showLoginPrompt();
    } else if (typeof window !== 'undefined' && (window as any).showLoginPrompt) {
      (window as any).showLoginPrompt();
    }
  };

  return { showLoginPrompt };
}
