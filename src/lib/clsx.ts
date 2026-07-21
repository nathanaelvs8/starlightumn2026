/** Penggabung className mini — nggak perlu dependency tambahan. */
export default function clsx(
  ...parts: Array<string | false | null | undefined>
) {
  return parts.filter(Boolean).join(" ");
}
