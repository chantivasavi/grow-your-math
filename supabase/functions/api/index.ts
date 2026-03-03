const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// ============================================
// FORMULAS DATA
// ============================================
const formulasData: Record<string, Record<string, { name: string, formula: string }[]>> = {
  "9": {
    "Algebra": [
      { name: "Linear Equation", formula: "ax + b = 0" },
      { name: "Quadratic Identity", formula: "(a+b)² = a² + 2ab + b²" },
      { name: "Difference of Squares", formula: "a² - b² = (a+b)(a-b)" },
    ],
    "Geometry": [
      { name: "Area of Triangle", formula: "A = ½ × base × height" },
      { name: "Pythagoras Theorem", formula: "a² + b² = c²" },
      { name: "Area of Circle", formula: "A = πr²" },
    ]
  },
  "10": {
    "Algebra": [
      { name: "Quadratic Formula", formula: "x = (-b ± √(b²-4ac)) / 2a" },
      { name: "Sum of AP", formula: "Sn = n/2 [2a + (n-1)d]" },
      { name: "nth term of AP", formula: "an = a + (n-1)d" },
    ],
    "Trigonometry": [
      { name: "sin²θ + cos²θ", formula: "sin²θ + cos²θ = 1" },
      { name: "tan θ", formula: "tan θ = sin θ / cos θ" },
      { name: "Area of Triangle", formula: "A = ½ ab sin C" },
    ],
    "Geometry": [
      { name: "Surface Area of Sphere", formula: "SA = 4πr²" },
      { name: "Volume of Cone", formula: "V = ⅓πr²h" },
      { name: "CSA of Cylinder", formula: "CSA = 2πrh" },
    ]
  },
  "11": {
    "Algebra": [
      { name: "Binomial Theorem", formula: "(a+b)ⁿ = Σ C(n,r) aⁿ⁻ʳ bʳ" },
      { name: "Permutations", formula: "P(n,r) = n!/(n-r)!" },
      { name: "Combinations", formula: "C(n,r) = n!/r!(n-r)!" },
    ],
    "Trigonometry": [
      { name: "sin(A+B)", formula: "sin(A+B) = sinA cosB + cosA sinB" },
      { name: "cos(A+B)", formula: "cos(A+B) = cosA cosB - sinA sinB" },
      { name: "Law of Cosines", formula: "c² = a² + b² - 2ab cos C" },
    ],
    "Calculus": [
      { name: "Limits Definition", formula: "lim(x→a) f(x) = L" },
      { name: "Derivative Power Rule", formula: "d/dx(xⁿ) = nxⁿ⁻¹" },
    ]
  },
  "12": {
    "Calculus": [
      { name: "Integration Power Rule", formula: "∫xⁿ dx = xⁿ⁺¹/(n+1) + C" },
      { name: "Chain Rule", formula: "d/dx[f(g(x))] = f'(g(x))·g'(x)" },
      { name: "Integration by Parts", formula: "∫u dv = uv - ∫v du" },
      { name: "Definite Integral", formula: "∫ₐᵇ f(x)dx = F(b) - F(a)" },
    ],
    "Algebra": [
      { name: "Matrix Determinant 2x2", formula: "|A| = ad - bc" },
      { name: "Inverse Matrix", formula: "A⁻¹ = adj(A)/|A|" },
    ],
    "Probability": [
      { name: "Bayes Theorem", formula: "P(A|B) = P(B|A)P(A)/P(B)" },
      { name: "Mean of Distribution", formula: "μ = Σ xᵢP(xᵢ)" },
    ]
  },
  "JEE": {
    "Mathematics": [
      { name: "Quadratic Formula", formula: "x = (-b ± √(b²-4ac)) / 2a" },
      { name: "Binomial Theorem", formula: "(1+x)ⁿ = Σ C(n,r) xʳ" },
      { name: "Integration by Parts", formula: "∫u dv = uv - ∫v du" },
      { name: "Taylor Series", formula: "f(x) = Σ f⁽ⁿ⁾(a)(x-a)ⁿ/n!" },
    ],
    "Physics": [
      { name: "Newton's Second Law", formula: "F = ma" },
      { name: "Kinetic Energy", formula: "KE = ½mv²" },
      { name: "Wave Equation", formula: "v = fλ" },
      { name: "Coulomb's Law", formula: "F = kq₁q₂/r²" },
    ],
    "Chemistry": [
      { name: "Ideal Gas Law", formula: "PV = nRT" },
      { name: "Molarity", formula: "M = moles/volume(L)" },
      { name: "pH Formula", formula: "pH = -log[H⁺]" },
      { name: "Nernst Equation", formula: "E = E° - (RT/nF)lnQ" },
    ]
  }
}

// ============================================
// FEEDBACK STORE
// ============================================
const feedbackStore: { question: string, rating: string, solution: string, confidence: number, timestamp: number }[] = []

// ============================================
// AI HELPER
// ============================================
async function callAI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) throw new Error('LOVABLE_API_KEY not set')

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`AI error: ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// ============================================
// STEP COUNT BY LEVEL
// ============================================
function getStepRange(level: string): { min: number, max: number } {
  switch (level) {
    case 'easy': return { min: 5, max: 8 }
    case 'medium': return { min: 3, max: 5 }
    case 'hard': return { min: 2, max: 4 }
    default: return { min: 3, max: 5 }
  }
}

function getLevelDescription(level: string): string {
  switch (level) {
    case 'easy': return 'Basic conceptual problems with very detailed explanation and direct formula usage'
    case 'medium': return 'Standard board-level questions with structured step-by-step explanation'
    case 'hard': return 'Multi-step reasoning with higher-order thinking, logical reasoning emphasized, concise steps'
    default: return 'Standard explanation'
  }
}

// ============================================
// ASSESSMENT QUESTIONS
// ============================================
function getAssessmentQuestions(classLevel: number): { question: string, difficulty: string, expectedAnswer: string }[] {
  return [
    {
      difficulty: 'easy',
      question: classLevel <= 10
        ? 'Solve: 3x + 7 = 22. What is x?'
        : 'Find the derivative of f(x) = 3x² + 2x',
      expectedAnswer: classLevel <= 10 ? '5' : '6x + 2',
    },
    {
      difficulty: 'medium',
      question: classLevel <= 10
        ? 'Solve the quadratic equation: x² - 5x + 6 = 0'
        : 'Find the integral of (2x + 3) dx',
      expectedAnswer: classLevel <= 10 ? 'x = 2 or x = 3' : 'x² + 3x + C',
    },
    {
      difficulty: 'hard',
      question: classLevel <= 10
        ? 'The sum of three consecutive even numbers is 78. Find the numbers.'
        : 'Find the limit: lim(x→0) (sin(3x))/(2x)',
      expectedAnswer: classLevel <= 10 ? '24, 26, 28' : '3/2',
    },
  ]
}

// ============================================
// CHECK ANSWER HANDLER (stateless - client sends state)
// ============================================
async function handleCheckAnswer(req: Request): Promise<Response> {
  const body = await req.json()
  const { answer, problem_index, class_level } = body
  // problem_index: 0, 1, or 2
  
  const classLevel = class_level || 10
  const assessmentQs = getAssessmentQuestions(classLevel)
  
  if (problem_index < 0 || problem_index > 2) {
    return new Response(JSON.stringify({ error: 'Invalid problem index' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const currentQ = assessmentQs[problem_index]
  
  // Use AI to check if the answer is correct
  let isCorrect = false
  try {
    const checkPrompt = `The student was asked: "${currentQ.question}"
The expected answer is: "${currentQ.expectedAnswer}"
The student answered: "${answer}"
Is the student's answer correct or essentially correct? Reply with only "CORRECT" or "INCORRECT".`
    const aiResult = await callAI(checkPrompt)
    isCorrect = aiResult.trim().toUpperCase().includes('CORRECT') && !aiResult.trim().toUpperCase().includes('INCORRECT')
  } catch {
    // Fallback: basic string matching
    isCorrect = answer.toLowerCase().includes(currentQ.expectedAnswer.toLowerCase())
  }

  return new Response(JSON.stringify({
    problem_index,
    correct: isCorrect,
    difficulty: currentQ.difficulty,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// ============================================
// SOLVE HANDLER (stateless - client sends session state)
// ============================================
async function handleSolve(req: Request): Promise<Response> {
  const body = await req.json()
  const { question, board, class_level, current_level } = body

  const level = current_level || 'medium'
  const stepRange = getStepRange(level)
  const levelDesc = getLevelDescription(level)

  const prompt = `You are an expert Math Tutor AI. Solve the following problem.

Board: ${board}
Class Level: ${class_level}
Current Difficulty Level: ${level.toUpperCase()}
Step Range: Provide between ${stepRange.min} and ${stepRange.max} steps.

Level behavior: ${levelDesc}

Problem: ${question}

IMPORTANT RULES:
- No markdown formatting, no HTML, no special characters for formatting
- Clean plain text only
- Academic and friendly tone
- Use the board and class level context to tailor the explanation
- Provide exactly the right number of steps for the difficulty level

Respond in this exact JSON format (no markdown code blocks):
{
  "steps": ["step 1 text", "step 2 text", ...],
  "solution": "final answer here",
  "confidence": 0.XX
}

The confidence should be between 0.7 and 0.98. Use lower confidence if the problem is ambiguous.`

  try {
    const aiResponse = await callAI(prompt)

    let parsed: { steps: string[], solution: string, confidence: number }
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch {
      parsed = {
        steps: [aiResponse],
        solution: aiResponse.substring(0, 200),
        confidence: 0.75,
      }
    }

    // Ensure step count is within range
    while (parsed.steps.length < stepRange.min) {
      parsed.steps.push('Verify the result by substituting back into the original equation.')
    }
    if (parsed.steps.length > stepRange.max) {
      parsed.steps = parsed.steps.slice(0, stepRange.max)
    }

    parsed.confidence = Math.max(0.7, Math.min(0.98, parsed.confidence || 0.85))

    const stepsWithLevel = [
      `📊 Your Current Level: ${level.toUpperCase()}`,
      ...parsed.steps,
      `Would you like a more detailed explanation for this problem?`,
    ]

    return new Response(JSON.stringify({
      question,
      steps: stepsWithLevel,
      solution: parsed.solution,
      confidence: parsed.confidence,
      source: 'ai_generated' as const,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Solve error:', error)
    return new Response(JSON.stringify({
      question,
      steps: [
        `📊 Your Current Level: ${level.toUpperCase()}`,
        'Sorry, I encountered an error processing your question.',
        'Please try again with a clearer math problem.',
      ],
      solution: 'Error processing question. Please try again.',
      confidence: 0.7,
      source: 'ai_generated' as const,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  }
}

// ============================================
// FORMULAS HANDLER
// ============================================
function handleFormulas(url: URL): Response {
  const pathParts = url.pathname.split('/')
  const classLevel = pathParts[pathParts.length - 1] || '10'

  const formulas = formulasData[classLevel]
  if (!formulas) {
    return new Response(JSON.stringify({
      error: `No formulas found for class/level: ${classLevel}`,
      formulas: {},
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  return new Response(JSON.stringify({
    class_level: classLevel,
    formulas,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// ============================================
// FEEDBACK HANDLER
// ============================================
function handleFeedback(url: URL): Response {
  const question = url.searchParams.get('question') || ''
  const rating = url.searchParams.get('rating') || ''
  const solution = url.searchParams.get('solution') || ''
  const confidence = parseFloat(url.searchParams.get('confidence') || '0')

  feedbackStore.push({ question, rating, solution, confidence, timestamp: Date.now() })

  return new Response(JSON.stringify({
    success: true,
    message: 'Feedback recorded successfully',
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// ============================================
// ASSESS HANDLER (returns assessment questions)
// ============================================
function handleAssess(url: URL): Response {
  const classLevel = parseInt(url.searchParams.get('class_level') || '10')
  const assessmentQs = getAssessmentQuestions(classLevel)

  return new Response(JSON.stringify({
    assessment_completed: false,
    questions: assessmentQs.map((q, i) => ({
      index: i,
      difficulty: q.difficulty,
      question: q.question,
    })),
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// ============================================
// MAIN ROUTER
// ============================================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname

  try {
    // Route: /assess - GET assessment questions
    if (path.endsWith('/assess') && req.method === 'GET') {
      return handleAssess(url)
    }

    // Route: /check-answer - POST to check a single assessment answer
    if (path.endsWith('/check-answer') && req.method === 'POST') {
      return await handleCheckAnswer(req)
    }

    // Route: /solve
    if (path.endsWith('/solve') && req.method === 'POST') {
      return await handleSolve(req)
    }

    // Route: /formulas/...
    if (path.includes('/formulas')) {
      return handleFormulas(url)
    }

    // Route: /feedback
    if (path.includes('/feedback') && req.method === 'POST') {
      return handleFeedback(url)
    }

    return new Response(JSON.stringify({ error: 'Not found', path }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Router error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
