export function formatUGX(amount) {
  return `UGX ${Math.round(amount).toLocaleString('en-UG')}`;
}
