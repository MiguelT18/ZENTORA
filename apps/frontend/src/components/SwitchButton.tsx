export default function SwitchButton({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      type="button"
      className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-0 border border-light-bg-secondary dark:border-dark-bg-secondary bg-light-bg dark:bg-dark-bg`}
    >
      <span
        className={`inline-block size-4 transform rounded-full bg-light-text-primary dark:bg-dark-text-primary transition-transform ${
          checked ? "translate-x-6" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
