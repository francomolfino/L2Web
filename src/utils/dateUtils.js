export function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (isNaN(date)) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}