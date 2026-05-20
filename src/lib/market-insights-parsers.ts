export function parseAiInsights(text: string) {
  const pre = text
    .replace(/\|[^\n]*/gm, '')
    .replace(/[-]{3,}/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\n{3,}/g, '\n\n')

  const parts = pre.split(/\n(?=#{0,3}\s*\d+\.\s\S)/)
  const [rawHeader, ...rest] = parts

  const sections = rest.map(part => {
    const nl = part.indexOf('\n')
    const rawTitle = nl === -1 ? part : part.slice(0, nl)
    const rawContent = nl === -1 ? '' : part.slice(nl + 1)
    return {
      title: rawTitle.replace(/^#{1,3}\s*/, '').trim(),
      content: rawContent.trim(),
    }
  }).filter(s => s.title.length > 0)

  return { header: rawHeader.replace(/^#{1,3}\s*/gm, '').trim(), sections }
}

export function parseBullets(content: string, max = 4) {
  return content.split('\n')
    .filter(l => l.trim().startsWith('-'))
    .slice(0, max)
    .map(l => {
      const text = l.trim().slice(1).trim()
      const colonIdx = text.indexOf(':')
      if (colonIdx > -1 && colonIdx < 80) {
        return { bold: text.slice(0, colonIdx).trim(), rest: text.slice(colonIdx + 1).trim() }
      }
      return { bold: '', rest: text }
    })
}

export function findSection(sections: { title: string; content: string }[], keyword: string) {
  return sections.find(s => s.title.toLowerCase().includes(keyword.toLowerCase()))
}
