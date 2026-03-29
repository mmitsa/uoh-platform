import { useEffect, useState } from 'react';

export function GrayModeToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('grayMode') === '1';
    setOn(saved);
    document.documentElement.dataset.gray = saved ? '1' : '0';
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    localStorage.setItem('grayMode', next ? '1' : '0');
    document.documentElement.dataset.gray = next ? '1' : '0';
  }

  return (
    <button
      className="rounded-md border border-neutral-200 bg-neutral-0 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
      onClick={toggle}
      type="button"
    >
      Gray
    </button>
  );
}

