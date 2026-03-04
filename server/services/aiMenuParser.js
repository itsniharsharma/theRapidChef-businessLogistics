const MENU_SCHEMA_HINT = {
  categories: [
    {
      name: 'Category name',
      items: [
        {
          name: 'Item name',
          description: 'Optional short description',
          price: 0,
        },
      ],
    },
  ],
}

function sanitizeCategoryName(name) {
  const cleaned = String(name || '')
    .replace(/^#+\s*/, '')
    .replace(/[:\-–—]\s*$/, '')
    .trim()

  return cleaned || 'Menu'
}

function inferCategoryFromLine(line) {
  const trimmed = String(line || '').trim()
  if (!trimmed) return null

  if (/^#+\s+/.test(trimmed)) {
    return sanitizeCategoryName(trimmed)
  }

  if (/^[A-Za-z][A-Za-z\s/&()]{2,40}:$/.test(trimmed)) {
    return sanitizeCategoryName(trimmed)
  }

  if (/^\[(.+)]$/.test(trimmed)) {
    return sanitizeCategoryName(trimmed.replace(/^\[|]$/g, ''))
  }

  return null
}

function parsePriceToken(rawPrice) {
  const cleaned = String(rawPrice || '').replace(/[, ]+/g, '').replace(/[^\d.]/g, '')
  const value = Number(cleaned)
  if (Number.isNaN(value) || value < 0) {
    return null
  }
  return value
}

function parseItemLine(line) {
  const trimmed = String(line || '').trim()
  if (!trimmed) return null

  const separators = [' - ', ' – ', ' — ', ' | ', ': ']
  for (const separator of separators) {
    const splitAt = trimmed.lastIndexOf(separator)
    if (splitAt <= 0) continue

    const left = trimmed.slice(0, splitAt).trim()
    const right = trimmed.slice(splitAt + separator.length).trim()
    const price = parsePriceToken(right)

    if (!left || price === null) continue

    return {
      name: left,
      description: '',
      price,
      available: true,
      bestseller: false,
    }
  }

  const match = trimmed.match(/^(.*?)[\s.]*([₹$€£]?\s*\d+(?:\.\d{1,2})?)$/)
  if (!match) {
    return null
  }

  const name = String(match[1] || '').trim().replace(/[.\-–—|:]+$/g, '').trim()
  const price = parsePriceToken(match[2])

  if (!name || price === null) {
    return null
  }

  return {
    name,
    description: '',
    price,
    available: true,
    bestseller: false,
  }
}

function parseMenuWithHeuristics(menuText) {
  const lines = String(menuText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const categories = []
  let currentCategory = { name: 'Menu', items: [] }

  for (const line of lines) {
    const categoryName = inferCategoryFromLine(line)
    if (categoryName) {
      if (currentCategory.items.length) {
        categories.push(currentCategory)
      }
      currentCategory = { name: categoryName, items: [] }
      continue
    }

    const item = parseItemLine(line)
    if (item) {
      currentCategory.items.push(item)
    }
  }

  if (currentCategory.items.length) {
    categories.push(currentCategory)
  }

  const normalized = normalizeParsedMenu({ categories })
  if (!normalized.categories.length) {
    const error = new Error('Unable to auto-parse this menu. Please paste menu text in format: Item - 199')
    error.status = 422
    throw error
  }

  return normalized
}

function extractJsonObject(rawContent) {
  const trimmed = String(rawContent || '').trim()
  if (!trimmed) {
    throw new Error('AI returned empty response')
  }

  if (trimmed.startsWith('{')) {
    return trimmed
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }

  throw new Error('AI response did not contain valid JSON')
}

function normalizeParsedMenu(parsed) {
  const categories = Array.isArray(parsed?.categories) ? parsed.categories : []

  const normalized = categories
    .map((category) => {
      const name = String(category?.name || '').trim()
      const rawItems = Array.isArray(category?.items) ? category.items : []

      const items = rawItems
        .map((item) => {
          const itemName = String(item?.name || '').trim()
          const price = Number(item?.price)

          if (!itemName || Number.isNaN(price) || price < 0) {
            return null
          }

          return {
            name: itemName,
            description: String(item?.description || '').trim(),
            price,
            available: true,
            bestseller: false,
          }
        })
        .filter(Boolean)

      if (!name || items.length === 0) {
        return null
      }

      return {
        name,
        items,
      }
    })
    .filter(Boolean)

  return { categories: normalized }
}

function parseDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    return null
  }

  return {
    mimeType: match[1],
    data: match[2],
  }
}

function buildExtractionInstruction() {
  return [
    'Extract restaurant menu data into strict JSON only.',
    'Group all items under categories and include item price as a number.',
    `Required shape example: ${JSON.stringify(MENU_SCHEMA_HINT)}`,
    'No markdown. No explanation.',
  ].join('\n')
}

async function parseWithGemini({ apiKey, model, menuText, menuImageDataUrl }) {
  const parts = [{ text: buildExtractionInstruction() }]

  if (menuText) {
    parts.push({ text: `Menu input text:\n${menuText}` })
  }

  if (menuImageDataUrl) {
    const parsed = parseDataUrl(menuImageDataUrl)
    if (!parsed) {
      const error = new Error('Invalid image data format for Gemini')
      error.status = 400
      throw error
    }

    parts.push({
      inline_data: {
        mime_type: parsed.mimeType,
        data: parsed.data,
      },
    })
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
      }),
    },
  )

  if (!response.ok) {
    const raw = await response.text()
    const error = new Error(`Gemini analysis failed: ${raw || response.statusText}`)
    error.status = response.status === 429 ? 429 : 502
    throw error
  }

  const payload = await response.json()
  const content = payload?.candidates?.[0]?.content?.parts?.[0]?.text
  const jsonString = extractJsonObject(content)
  const parsed = JSON.parse(jsonString)
  return normalizeParsedMenu(parsed)
}

async function parseWithOpenAI({ apiKey, model, menuText, menuImageDataUrl }) {
  const userContent = [
    {
      type: 'text',
      text: buildExtractionInstruction(),
    },
  ]

  if (menuText) {
    userContent.push({
      type: 'text',
      text: `Menu input text:\n${menuText}`,
    })
  }

  if (menuImageDataUrl) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: menuImageDataUrl,
      },
    })
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a menu extraction engine. Return JSON only with this shape: {"categories":[{"name":"...","items":[{"name":"...","description":"...","price":0}]}]}. No markdown.',
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
    }),
  })

  if (!response.ok) {
    const raw = await response.text()
    const error = new Error(`AI analysis failed: ${raw || response.statusText}`)
    error.status = response.status === 429 ? 429 : 502
    throw error
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content
  const jsonString = extractJsonObject(content)
  const parsed = JSON.parse(jsonString)
  return normalizeParsedMenu(parsed)
}

export async function parseMenuWithAI({ menuText, menuImageDataUrl }) {
  const geminiApiKey = process.env.GEMINI_API_KEY
  const openaiApiKey = process.env.OPENAI_API_KEY

  if (!menuText && !menuImageDataUrl) {
    const error = new Error('Provide menu text or menu image to analyze')
    error.status = 400
    throw error
  }

  if (!geminiApiKey && !openaiApiKey && menuText) {
    return parseMenuWithHeuristics(menuText)
  }

  if (!geminiApiKey && !openaiApiKey && menuImageDataUrl) {
    const error = new Error('Gemini/OpenAI key or credits are required for image menu parsing. Upload text/CSV for free parsing.')
    error.status = 402
    throw error
  }

  let normalized = { categories: [] }

  try {
    if (geminiApiKey) {
      const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
      normalized = await parseWithGemini({
        apiKey: geminiApiKey,
        model: geminiModel,
        menuText,
        menuImageDataUrl,
      })
    } else if (openaiApiKey) {
      const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'
      normalized = await parseWithOpenAI({
        apiKey: openaiApiKey,
        model: openaiModel,
        menuText,
        menuImageDataUrl,
      })
    }
  } catch (providerError) {
    if (menuText) {
      return parseMenuWithHeuristics(menuText)
    }

    throw providerError
  }

  if (!normalized.categories.length) {
    if (menuText) {
      return parseMenuWithHeuristics(menuText)
    }

    const error = new Error('AI could not extract valid menu categories/items from the uploaded content')
    error.status = 422
    throw error
  }

  return normalized
}