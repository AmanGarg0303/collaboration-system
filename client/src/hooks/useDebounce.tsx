import { useEffect, useState } from "react";

const useDebounce = (inputVal: string, delay: number = 300) => {
  const [debouncedVal, setDebouncedVal] = useState(inputVal);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedVal(inputVal);
    }, delay);

    return () => clearTimeout(handler);
  }, [inputVal, delay]);

  return debouncedVal;
};

export default useDebounce;
