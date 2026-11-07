/** N'autorise que les chemins internes (évite les redirections vers un autre site). */
export function retourSecurise(valeur: string | null | undefined): string | null {
  if (!valeur || !valeur.startsWith('/') || valeur.startsWith('//') || valeur.includes('\\')) {
    return null;
  }
  return valeur;
}
