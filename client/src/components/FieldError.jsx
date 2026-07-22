export default function FieldError({ message, id }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-1">
      {message}
    </p>
  );
}

export function inputErrorClass(hasError) {
  return hasError ? "border-rose-400 dark:border-rose-500 focus:ring-rose-400" : "";
}
