with open('src/components/features/manager-dashboard/hooks/useManagerDashboard.ts', 'r', encoding='utf-8') as f:
    content = f.read()

bad_part = '''// Debounce helper to protect database quotas
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDarkMode, setIsDarkMode] = useState(true);'''

good_part = '''// Debounce helper to protect database quotas
function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useManagerDashboard(initialData?: any) {
  const [isDarkMode, setIsDarkMode] = useState(true);'''

content = content.replace(bad_part, good_part)

with open('src/components/features/manager-dashboard/hooks/useManagerDashboard.ts', 'w', encoding='utf-8') as f:
    f.write(content)
