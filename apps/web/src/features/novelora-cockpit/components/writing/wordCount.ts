export function countWordsLocal(text: string): number {
  const cjk = (text.match(/[一-鿿]/g) ?? []).length;
  const latin = (text.replace(/[一-鿿]/g, ' ').match(/[A-Za-z0-9']+/g) ?? []).length;
  return cjk + latin;
}
